"""
Per-account workspaces (multi-tenancy).

Every account belongs to a workspace (``profiles.tenant_id``). Isolation is
enforced by Postgres row-level security, set up by
``supabase/migrations/20261007120000_per_account_workspaces.sql``:

* ``TenantScopeMiddleware`` works out the caller's workspace from the bearer
  token (``tid`` claim, or a profile lookup for older tokens) and stores it in
  a context variable for the duration of the request.
* A SQLAlchemy ``after_begin`` hook then starts every transaction with
  ``SET LOCAL ROLE pharmazine_app`` + ``app.tenant_id``, so every query the
  routes run — ORM or raw SQL — only sees and writes that workspace's rows.
  Requests without a valid token get no workspace and therefore no rows.
* Code outside a request (startup, schedulers) and the login/register
  endpoints run in "system" scope as the connecting role, unrestricted.

If the migration has not been applied yet, tenancy stays disabled and the API
behaves exactly as before (one shared dataset); the middleware re-checks every
minute, so applying the migration later takes effect without a restart.
"""
from __future__ import annotations

import contextvars
import threading
import time
from typing import Optional

import anyio
from jose import JWTError, jwt
from sqlalchemy import event, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

SYSTEM = "__system__"

_scope: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar(
    "pharmazine_db_scope", default=SYSTEM
)
_enabled = False
_engine: Optional[Engine] = None
_last_check = 0.0
RECHECK_SECONDS = 60
_cache: dict[str, str] = {}
_cache_lock = threading.Lock()

# Endpoints that must see across workspaces (they establish the session).
SYSTEM_PATHS = {"/api/auth/login", "/api/auth/register", "/api/health"}


def is_enabled() -> bool:
    return _enabled


def current_tenant() -> Optional[str]:
    """Workspace of the current request, or None (anonymous / system)."""
    value = _scope.get()
    return None if value == SYSTEM else value


def init(engine: Engine) -> bool:
    """Enable tenancy if the database has been migrated. Safe to call at import."""
    global _engine
    _engine = engine
    return _check(log_disabled=True)


def _check(log_disabled: bool) -> bool:
    global _enabled, _last_check
    _last_check = time.monotonic()
    engine = _engine
    if engine is None:
        return False
    try:
        with engine.begin() as conn:
            # The connecting role must be allowed to SET ROLE pharmazine_app,
            # otherwise every request would fail — stay in shared mode instead.
            ready = conn.execute(text(
                "SELECT to_regrole('pharmazine_app') IS NOT NULL "
                "AND to_regprocedure('public.pharmazine_tenantize_all(boolean)') IS NOT NULL "
                "AND pg_has_role(current_user, 'pharmazine_app', 'MEMBER')"
            )).scalar()
            if ready:
                # Cover tables created at runtime since the migration ran.
                conn.execute(text("SELECT public.pharmazine_tenantize_all(true)"))
                if conn.execute(text("SELECT to_regclass('public.vouchers') IS NOT NULL")).scalar():
                    conn.execute(text(
                        "CREATE UNIQUE INDEX IF NOT EXISTS ux_vouchers_tenant_voucher_no "
                        "ON public.vouchers (tenant_id, voucher_no)"
                    ))
        _enabled = bool(ready)
    except Exception as exc:  # pragma: no cover - depends on the database
        print(f"[WARN] Workspace isolation check failed: {exc}")
        _enabled = False

    if _enabled:
        print("[INFO] Per-account workspaces: ENABLED")
    elif log_disabled:
        print("[WARN] Per-account workspaces: DISABLED — apply "
              "supabase/migrations/20261007120000_per_account_workspaces.sql; "
              "all accounts currently share one dataset.")
    return _enabled


@event.listens_for(Session, "after_begin")
def _apply_scope(session, transaction, connection):
    if not _enabled:
        return
    value = _scope.get()
    if value == SYSTEM:
        return
    connection.exec_driver_sql("SET LOCAL ROLE pharmazine_app")
    connection.execute(
        text("SELECT set_config('app.tenant_id', :t, true)"), {"t": value or ""}
    )


def ensure_workspace(user_id: str, workspace_name: Optional[str] = None) -> Optional[str]:
    """Return the account's workspace id, creating a fresh one if it has none."""
    if not _enabled or not user_id or _engine is None:
        return None
    with _cache_lock:
        cached = _cache.get(user_id)
    if cached:
        return cached

    with _engine.begin() as conn:
        row = conn.execute(
            text("SELECT tenant_id, full_name FROM public.profiles WHERE id = CAST(:u AS uuid)"),
            {"u": user_id},
        ).first()
        if row is None:
            return None
        tenant_id, full_name = row
        if tenant_id is None:
            name = workspace_name or (f"{full_name}'s pharmacy" if full_name else "My pharmacy")
            tenant_id = conn.execute(
                text("SELECT public.pharmazine_create_workspace(CAST(:u AS uuid), :n)"),
                {"u": user_id, "n": name},
            ).scalar()

    tenant_id = str(tenant_id)
    with _cache_lock:
        _cache[user_id] = tenant_id
    return tenant_id


class TenantScopeMiddleware:
    """Pure ASGI middleware that sets the workspace for each API request."""

    def __init__(self, app, secret_key: str, algorithm: str):
        self.app = app
        self.secret_key = secret_key
        self.algorithm = algorithm

    def _resolve(self, authorization: str) -> Optional[str]:
        if not authorization.lower().startswith("bearer "):
            return None
        try:
            payload = jwt.decode(authorization[7:].strip(), self.secret_key, algorithms=[self.algorithm])
        except JWTError:
            return None
        if payload.get("tid"):
            return str(payload["tid"])
        try:
            return ensure_workspace(str(payload.get("sub") or ""))
        except Exception as exc:  # DB unreachable etc. — treat as no workspace
            print(f"[WARN] Could not resolve workspace: {exc}")
            return None

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http" and not _enabled and time.monotonic() - _last_check > RECHECK_SECONDS:
            await anyio.to_thread.run_sync(_check, False)
        if scope["type"] != "http" or not _enabled:
            await self.app(scope, receive, send)
            return

        path = scope.get("path", "")
        if path in SYSTEM_PATHS or not path.startswith("/api/"):
            value: Optional[str] = SYSTEM
        else:
            authorization = ""
            for key, val in scope.get("headers") or []:
                if key == b"authorization":
                    authorization = val.decode("latin-1")
                    break
            value = await anyio.to_thread.run_sync(self._resolve, authorization) if authorization else None

        token = _scope.set(value)
        try:
            await self.app(scope, receive, send)
        finally:
            _scope.reset(token)
