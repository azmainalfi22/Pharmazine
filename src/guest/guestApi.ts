/**
 * In-browser stand-in for the Pharmazine API, used while no one is signed in.
 *
 * Generic REST behaviour over collections kept in localStorage:
 *   GET    /x            -> list (filtered by `*_id` / `search` / `limit` query params)
 *   GET    /x/{id}       -> one record
 *   GET    /x/{id}/child -> records of collection "x/child" whose `<x>_id` = id
 *   POST   /x            -> create record
 *   POST   /x/{id}/verb  -> status change (approve, cancel, read, ...)
 *   PUT/PATCH /x/{id}[/…]-> merge body into record
 *   DELETE /x/{id}       -> remove record
 *
 * Endpoints the backend answers with a computed object (dashboards, stats,
 * summaries) are handled explicitly below, returning the same shape the
 * backend returns, computed from the guest's local records.
 */
import { ALL_PERMISSIONS, GUEST_DB_KEY, GUEST_PROFILE } from "./guestMode";

// Records are arbitrary JSON written by the pages, so fields are untyped.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Rec = Record<string, any>;
type DB = Record<string, Rec[]>;

interface Ctx {
  db: DB;
  params: string[];
  query: URLSearchParams;
  body: Rec | undefined;
}

type Handler = (ctx: Ctx) => Response | unknown;

// ── storage ─────────────────────────────────────────────────────────────────

const loadDb = (): DB => {
  try {
    const raw = localStorage.getItem(GUEST_DB_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const saveDb = (db: DB) => {
  try {
    localStorage.setItem(GUEST_DB_KEY, JSON.stringify(db));
  } catch {
    /* quota exceeded / storage blocked — keep working in memory for this request */
  }
};

const coll = (db: DB, name: string): Rec[] => {
  if (!Array.isArray(db[name])) db[name] = [];
  return db[name];
};

const newId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
};

const nowIso = () => new Date().toISOString();

// ── response helpers ────────────────────────────────────────────────────────

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const fail = (status: number, detail: string) => json({ detail }, status);

const text = (body: string, contentType: string, filename?: string) =>
  new Response(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      ...(filename ? { "Content-Disposition": `attachment; filename="${filename}"` } : {}),
    },
  });

// ── domain helpers ──────────────────────────────────────────────────────────

const num = (v: unknown): number => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
};

const DAY = 24 * 60 * 60 * 1000;

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const createdAt = (r: Rec) => new Date(r.created_at || r.sale_date || 0).getTime();

const saleTotal = (s: Rec) => num(s.net_amount ?? s.total_amount);

const sumBy = <T>(rows: T[], f: (r: T) => number) => rows.reduce((a, r) => a + f(r), 0);

const minLevel = (p: Rec) => num(p.min_stock_level ?? p.reorder_level ?? 0);
const isLowStock = (p: Rec) => num(p.stock_quantity) <= minLevel(p);
const isOutOfStock = (p: Rec) => num(p.stock_quantity) <= 0;

const daysUntil = (date: string) => Math.floor((new Date(date).getTime() - startOfToday()) / DAY);

const salesSince = (db: DB, since: number) => coll(db, "sales").filter((s) => createdAt(s) >= since);

const productName = (db: DB, id: string) => coll(db, "products").find((p) => p.id === id)?.name ?? "Unknown";

const PRODUCT_NUMERIC = [
  "unit_price", "cost_price", "stock_quantity", "reorder_level", "min_stock_level",
  "max_stock_level", "mrp_unit", "mrp_strip", "weight", "gst_percent", "discount_percentage",
];

const withProductDefaults = (r: Rec): Rec => {
  const out: Rec = { unit_price: 0, cost_price: 0, stock_quantity: 0, min_stock_level: 0, ...r };
  for (const k of PRODUCT_NUMERIC) if (out[k] !== undefined && out[k] !== null && out[k] !== "") out[k] = num(out[k]);
  if (!out.sku) out.sku = `SKU-${String(Date.now()).slice(-6)}`;
  return out;
};

const toCsv = (rows: Rec[], columns?: string[]) => {
  const cols = columns ?? Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
};

/** "sales" -> "sale", "batches" -> "batch" — used to find child records' foreign key. */
const singular = (word: string) => {
  if (/(ch|sh|x|ss)es$/.test(word)) return word.slice(0, -2);
  if (word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  return word.endsWith("s") ? word.slice(0, -1) : word;
};

const ACTION_STATUS: Record<string, string> = {
  approve: "approved",
  reject: "rejected",
  confirm: "confirmed",
  cancel: "cancelled",
  complete: "completed",
  clear: "cleared",
  purchase: "purchased",
  "create-po": "po_created",
};

// ── computed endpoints ──────────────────────────────────────────────────────

const realtimeStats = (db: DB) => {
  const products = coll(db, "products");
  const today = salesSince(db, startOfToday());
  const batches = coll(db, "pharmacy/batches");
  return {
    today_sales: sumBy(today, saleTotal),
    today_transactions: today.length,
    today_customers: new Set(today.map((s) => s.customer_phone || s.customer_name || s.id)).size,
    week_sales: sumBy(salesSince(db, Date.now() - 7 * DAY), saleTotal),
    month_sales: sumBy(salesSince(db, Date.now() - 30 * DAY), saleTotal),
    low_stock_count: products.filter(isLowStock).length,
    out_of_stock_count: products.filter(isOutOfStock).length,
    expiring_soon_count: batches.filter((b) => {
      const d = daysUntil(b.expiry_date);
      return num(b.quantity_remaining) > 0 && d >= 0 && d <= 90;
    }).length,
    pending_requisitions: coll(db, "requisitions").filter((r) => (r.status ?? "pending") === "pending").length,
    total_inventory_value: sumBy(products, (p) => num(p.stock_quantity) * num(p.cost_price)),
    timestamp: nowIso(),
  };
};

const expiryAlerts = (db: DB, days: number) =>
  coll(db, "pharmacy/batches")
    .filter((b) => b.expiry_date && num(b.quantity_remaining) > 0 && daysUntil(b.expiry_date) <= days)
    .map((b) => {
      const d = daysUntil(b.expiry_date);
      const product = coll(db, "products").find((p) => p.id === b.product_id) ?? {};
      return {
        batch_id: b.id,
        batch_number: b.batch_number,
        product_id: b.product_id,
        product_name: product.name ?? "Unknown",
        generic_name: product.generic_name ?? null,
        brand_name: product.brand_name ?? null,
        expiry_date: b.expiry_date,
        quantity_remaining: num(b.quantity_remaining),
        purchase_price: num(b.purchase_price),
        value_at_risk: num(b.quantity_remaining) * num(b.purchase_price),
        manufacturer: null,
        store: null,
        days_to_expiry: d,
        alert_level: d < 0 ? "expired" : d <= 30 ? "critical" : d <= 60 ? "warning" : "info",
      };
    })
    .sort((a, b) => a.days_to_expiry - b.days_to_expiry);

const productSalesAnalytics = (db: DB, days: number) => {
  const since = Date.now() - days * DAY;
  const saleIds = new Set(salesSince(db, since).map((s) => s.id));
  const byProduct = new Map<string, { qty: number; orders: number; revenue: number }>();
  for (const it of coll(db, "sales/items")) {
    if (!saleIds.has(it.sale_id)) continue;
    const agg = byProduct.get(it.product_id) ?? { qty: 0, orders: 0, revenue: 0 };
    agg.qty += num(it.quantity);
    agg.orders += 1;
    agg.revenue += num(it.quantity) * num(it.unit_price);
    byProduct.set(it.product_id, agg);
  }
  const result: Rec[] = [];
  for (const [productId, agg] of byProduct) {
    const product = coll(db, "products").find((p) => p.id === productId);
    if (!product) continue;
    const avg = days > 0 ? agg.qty / days : 0;
    const supply = avg > 0 ? num(product.stock_quantity) / avg : null;
    result.push({
      product_id: productId,
      product_name: product.name,
      sku: product.sku,
      total_sold: agg.qty,
      order_count: agg.orders,
      total_revenue: agg.revenue,
      avg_daily_sales: Math.round(avg * 100) / 100,
      current_stock: num(product.stock_quantity),
      days_of_supply: supply === null ? null : Math.round(supply * 10) / 10,
    });
  }
  result.sort((a, b) => b.total_revenue - a.total_revenue);
  const total = sumBy(result, (r) => r.total_revenue);
  let cumulative = 0;
  for (const r of result) {
    cumulative += r.total_revenue;
    const pct = total > 0 ? (cumulative / total) * 100 : 0;
    r.abc_class = pct <= 80 ? "A" : pct <= 95 ? "B" : "C";
  }
  return result;
};

const profitLoss = (db: DB) => {
  const sales = coll(db, "sales");
  const products = coll(db, "products");
  const total_sales = sumBy(sales, saleTotal);
  const cogs = sumBy(coll(db, "sales/items"), (it) => {
    const p = products.find((x) => x.id === it.product_id);
    return num(it.quantity) * num(p?.cost_price);
  });
  const expenses = sumBy(coll(db, "expenses"), (e) => num(e.amount));
  return {
    total_sales,
    cogs,
    gross_profit: total_sales - cogs,
    expenses,
    net_profit: total_sales - cogs - expenses,
  };
};

const guestUserRow = () => ({ ...GUEST_PROFILE, role: "admin", roles: ["admin"] });

const ROUTES: Array<[string, RegExp, Handler]> = [
  // Session / identity
  ["GET", /^\/health$/, () => ({
    status: "OK",
    database: "Guest mode (browser storage)",
    database_ok: true,
    rest_fallback: false,
  })],
  ["GET", /^\/(auth|users)\/me$/, () => GUEST_PROFILE],
  ["GET", /^\/rbac\/permissions$/, () => ({ user_id: GUEST_PROFILE.id, roles: ["admin"], permissions: ALL_PERMISSIONS })],
  ["GET", /^\/users$/, () => [guestUserRow()]],
  ["GET", /^\/users\/[^/]+\/roles$/, () => [{ role: "admin" }]],

  // Dashboard
  ["GET", /^\/dashboard\/stats$/, ({ db }) => ({
    totalProducts: coll(db, "products").length,
    totalSales: coll(db, "sales").length,
    totalCustomers: coll(db, "customers").length,
    lowStockProducts: coll(db, "products").filter(isLowStock).length,
  })],
  ["GET", /^\/dashboard\/(realtime|realtime-stats)$/, ({ db }) => realtimeStats(db)],
  ["GET", /^\/dashboard\/top-products-today$/, ({ db }) => {
    const products = productSalesAnalytics(db, 1)
      .filter((p) => p.order_count > 0)
      .slice(0, 10)
      .map((p) => ({
        id: p.product_id,
        sku: p.sku,
        name: p.product_name,
        generic_name: null,
        quantity_sold: p.total_sold,
        order_count: p.order_count,
        revenue: p.total_revenue,
        current_stock: p.current_stock,
      }));
    return { products, count: products.length };
  }],
  ["GET", /^\/dashboard\/hourly-sales$/, ({ db }) => {
    const byHour = new Map<number, Rec[]>();
    for (const s of salesSince(db, startOfToday())) {
      const h = new Date(createdAt(s)).getHours();
      byHour.set(h, [...(byHour.get(h) ?? []), s]);
    }
    const hourly_data = [...byHour.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([hour, rows]) => ({
        hour,
        transaction_count: rows.length,
        total_sales: sumBy(rows, saleTotal),
        avg_transaction: sumBy(rows, saleTotal) / rows.length,
      }));
    return { hourly_data, count: hourly_data.length };
  }],
  ["GET", /^\/products\/sales-analytics$/, ({ db, query }) => productSalesAnalytics(db, num(query.get("days")) || 30)],
  ["GET", /^\/products\/([^/]+)\/stock$/, ({ db, params }) => ({
    product_id: params[0],
    total_qty: num(coll(db, "products").find((p) => p.id === params[0])?.stock_quantity),
  })],
  ["POST", /^\/products\/([^/]+)\/stock-add$/, ({ db, params, body }) => {
    const p = coll(db, "products").find((x) => x.id === params[0]);
    if (!p) return fail(404, "Product not found");
    p.stock_quantity = num(p.stock_quantity) + num(body?.quantity);
    p.updated_at = nowIso();
    return p;
  }],

  // Pharmacy
  ["GET", /^\/pharmacy\/statistics\/medicines$/, ({ db }) => {
    const products = coll(db, "products");
    const alerts = expiryAlerts(db, 90);
    return {
      total_medicines: products.length,
      total_batches: coll(db, "pharmacy/batches").length,
      expiring_soon_count: alerts.filter((a) => a.days_to_expiry >= 0).length,
      expired_count: alerts.filter((a) => a.days_to_expiry < 0).length,
      low_stock_count: products.filter(isLowStock).length,
      out_of_stock_count: products.filter(isOutOfStock).length,
      total_manufacturers: coll(db, "pharmacy/manufacturers").length,
      average_stock_level: products.length ? sumBy(products, (p) => num(p.stock_quantity)) / products.length : 0,
      total_inventory_value: sumBy(products, (p) => num(p.stock_quantity) * num(p.cost_price)),
      expiring_value_at_risk: sumBy(alerts, (a) => a.value_at_risk),
    };
  }],
  ["GET", /^\/pharmacy\/statistics\/manufacturers$/, ({ db }) => {
    const m = coll(db, "pharmacy/manufacturers");
    return {
      total_manufacturers: m.length,
      active_manufacturers: m.filter((x) => x.is_active !== false).length,
      total_outstanding: 0,
      total_purchases_this_month: 0,
      top_manufacturers: [],
    };
  }],
  ["GET", /^\/pharmacy\/expiry-alerts$/, ({ db, query }) => expiryAlerts(db, num(query.get("days")) || 90)],
  ["GET", /^\/pharmacy\/expired-medicines$/, ({ db }) => expiryAlerts(db, -1)],
  ["GET", /^\/pharmacy\/low-stock-alerts$/, ({ db }) =>
    coll(db, "products").filter(isLowStock).map((p) => {
      const level = minLevel(p);
      const pct = level > 0 ? (num(p.stock_quantity) / level) * 100 : 0;
      return {
        product_id: p.id,
        product_name: p.name,
        generic_name: p.generic_name ?? null,
        brand_name: p.brand_name ?? null,
        current_stock: num(p.stock_quantity),
        reorder_level: level,
        stock_percentage: pct,
        total_value: num(p.stock_quantity) * num(p.cost_price),
        alert_level: isOutOfStock(p) ? "critical" : pct <= 50 ? "high" : "medium",
      };
    })],
  ["POST", /^\/pharmacy\/batches$/, ({ db, body }) => {
    const batch = {
      id: newId(),
      created_at: nowIso(),
      updated_at: nowIso(),
      ...body,
      quantity_received: num(body?.quantity_received),
      quantity_remaining: num(body?.quantity_remaining ?? body?.quantity_received),
    };
    coll(db, "pharmacy/batches").push(batch);
    return batch;
  }],
  ["POST", /^\/pharmacy\/generate-barcode$/, () => ({ barcode_data: null, qr_code_data: null })],
  ["GET", /^\/pharmacy\/enhanced\/drug-interactions\/check$/, () => ({ interactions: [], has_interactions: false })],

  // Sales
  ["POST", /^\/sales$/, ({ db, body }) => {
    const sales = coll(db, "sales");
    const d = new Date();
    const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    const sale = {
      id: newId(),
      invoice_number: `INV-${stamp}-${String(sales.length + 1).padStart(4, "0")}`,
      payment_status: "completed",
      created_at: nowIso(),
      updated_at: nowIso(),
      ...body,
    };
    sales.push(sale);
    return sale;
  }],
  ["POST", /^\/sales\/items$/, ({ db, body }) => {
    const item = { id: newId(), created_at: nowIso(), ...body };
    coll(db, "sales/items").push(item);
    const qty = num(body?.quantity);
    const product = coll(db, "products").find((p) => p.id === body?.product_id);
    if (product) product.stock_quantity = num(product.stock_quantity) - qty;
    const batch = coll(db, "pharmacy/batches").find(
      (b) => b.product_id === body?.product_id && b.batch_number && b.batch_number === body?.batch_no
    );
    if (batch) batch.quantity_remaining = Math.max(0, num(batch.quantity_remaining) - qty);
    return item;
  }],
  ["GET", /^\/sales\/([^/]+)\/invoice$/, ({ db, params }) => {
    const sale = coll(db, "sales").find((s) => s.id === params[0]);
    if (!sale) return fail(404, "Sale not found");
    const rows = coll(db, "sales/items")
      .filter((i) => i.sale_id === sale.id)
      .map((i) => `<tr><td>${productName(db, i.product_id)}</td><td>${num(i.quantity)}</td><td>${num(i.unit_price).toFixed(2)}</td><td>${num(i.total_price).toFixed(2)}</td></tr>`)
      .join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${sale.invoice_number ?? "Invoice"}</title></head><body style="font-family:sans-serif"><h2>Pharmazine — ${sale.invoice_number ?? sale.id}</h2><p>${sale.customer_name ?? "Walk-in Customer"} · ${new Date(sale.created_at).toLocaleString()}</p><table border="1" cellpadding="6" cellspacing="0"><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>${rows}</table><h3>Total: ${saleTotal(sale).toFixed(2)}</h3><p><em>Guest mode invoice</em></p></body></html>`;
    return text(html, "text/html");
  }],
  ["GET", /^\/customers\/by-phone\/([^/]+)$/, ({ db, params }) => {
    const phone = decodeURIComponent(params[0]);
    const c = coll(db, "customers").find((x) => x.phone === phone);
    if (!c) return fail(404, "Customer not found");
    return { id: c.id, name: c.name, phone: c.phone, loyalty_points: num(c.loyalty_points), loyalty_tier: c.loyalty_tier ?? null };
  }],
  ["PATCH", /^\/customers\/([^/]+)\/loyalty$/, ({ db, params, body }) => {
    const c = coll(db, "customers").find((x) => x.id === params[0]);
    if (!c) return fail(404, "Customer not found");
    c.loyalty_points = Math.max(0, num(c.loyalty_points) + num(body?.earn) - num(body?.redeem));
    return { id: c.id, loyalty_points: c.loyalty_points };
  }],

  // Finance & reports
  ["GET", /^\/reports\/profit-loss$/, ({ db }) => profitLoss(db)],
  ["GET", /^\/reports\/finance\/trial-balance$/, ({ db }) => {
    const totals: Record<string, number> = {};
    for (const t of coll(db, "transactions")) totals[t.type] = (totals[t.type] ?? 0) + num(t.amount);
    return { totals };
  }],
  ["GET", /^\/reports\/stock\/export$/, ({ db }) =>
    text(toCsv(coll(db, "products"), ["sku", "name", "stock_quantity", "unit_price", "cost_price"]), "text/csv", "stock.csv")],
  ["GET", /^\/reports\/sales\/export$/, ({ db }) =>
    text(toCsv(coll(db, "sales"), ["invoice_number", "created_at", "customer_name", "net_amount", "payment_method"]), "text/csv", "sales.csv")],
  ["GET", /^\/import\/templates\/([^/]+)\.csv$/, ({ params }) => {
    const headers: Record<string, string> = {
      products: "name,sku,unit_price,cost_price,stock_quantity,min_stock_level",
      suppliers: "name,contact_person,phone,email,address",
      customers: "name,phone,email,address",
      "opening-stock": "sku,quantity,cost_price",
    };
    return text(`${headers[params[0]] ?? "name"}\n`, "text/csv", `${params[0]}_template.csv`);
  }],
  ["POST", /^\/import\//, () => fail(400, "CSV import is available after signing in. Guest mode keeps data in this browser only.")],
  ["GET", /^\/finance\/dashboard$/, ({ db }) => {
    const pl = profitLoss(db);
    return {
      cash_in_hand: pl.total_sales,
      bank_balance: 0,
      total_receivables: 0,
      total_payables: 0,
      today_revenue: sumBy(salesSince(db, startOfToday()), saleTotal),
      today_expenses: 0,
      week_revenue: sumBy(salesSince(db, Date.now() - 7 * DAY), saleTotal),
      month_revenue: sumBy(salesSince(db, Date.now() - 30 * DAY), saleTotal),
      profit_margin: pl.total_sales > 0 ? Math.round((pl.gross_profit / pl.total_sales) * 1000) / 10 : 0,
    };
  }],
  ["GET", /^\/finance\/payments\/summary$/, ({ db }) => {
    const sales = coll(db, "sales");
    const by = (methods: string[]) => sumBy(sales.filter((s) => methods.includes(s.payment_method)), saleTotal);
    return {
      total_collected: sumBy(sales.filter((s) => s.payment_status === "completed"), saleTotal),
      pending_payments: sumBy(sales.filter((s) => s.payment_status !== "completed"), saleTotal),
      cash_payments: by(["cash"]),
      card_payments: by(["visa", "card"]),
      online_payments: by(["bkash", "upay", "bank_transfer", "online"]),
      total_transactions: sales.length,
    };
  }],
  ["GET", /^\/finance\/receivables$/, () => ({ receivables: [], total_receivable: 0, count: 0 })],
  ["GET", /^\/finance\/payables$/, () => ({ payables: [], total_payable: 0, count: 0 })],
  ["GET", /^\/finance\/cashflow\/summary$/, ({ db }) => {
    const inflow = sumBy(coll(db, "sales"), saleTotal);
    const outflow = sumBy(coll(db, "expenses"), (e) => num(e.amount));
    return { opening_balance: 0, total_cash_in: inflow, total_cash_out: outflow, net_cash_flow: inflow - outflow, closing_balance: inflow - outflow };
  }],
  ["GET", /^\/finance\/cashflow\/daily$/, () => ({ daily_flow: [], count: 0 })],

  // Patients / care
  ["GET", /^\/patients\/([^/]+)\/statistics$/, () => ({
    total_purchases: 0, total_spent: 0, unique_medications: 0, first_purchase: null, last_purchase: null,
  })],
  ["GET", /^\/patients\/([^/]+)\/medication-history$/, () => ({ history: [], count: 0 })],
  ["GET", /^\/(patients\/)?refill-reminders$/, () => ({ reminders: [], count: 0 })],

  // Automation, backups, notifications, messages
  ["GET", /^\/auto-reorder\/recommendations$/, () => ({ recommendations: [], count: 0, total_estimated_cost: 0, timestamp: nowIso() })],
  ["GET", /^\/auto-reorder\/by-supplier$/, () => ({ suppliers: [], total_suppliers: 0 })],
  ["GET", /^\/auto-reorder\/log$/, () => ({ log: [], count: 0 })],
  ["GET", /^\/auto-reorder\/stats$/, () => ({
    pending_recommendations: 0, po_created: 0, ordered: 0, received: 0,
    critical_items: 0, high_priority_items: 0, medium_priority_items: 0, total_pending_quantity: 0,
  })],
  ["POST", /^\/auto-reorder\/generate$/, () => ({ message: "No reorder recommendations — stock levels are fine", count: 0 })],
  ["GET", /^\/(backups|backup\/list)$/, () => ({ backups: [], count: 0 })],
  ["GET", /^\/backup\/stats$/, () => ({
    total_backups: 0, successful: 0, failed: 0, automatic: 0, manual: 0, total_size_mb: 0, last_backup: null,
  })],
  ["POST", /^\/(backups|backup)\/create$/, () => fail(400, "Backups are available after signing in. Guest data lives in this browser only.")],
  ["GET", /^\/notifications\/(low-stock|expiry-alerts|daily-summary)$/, () => ({ message: "Notifications are disabled in guest mode" })],
  ["GET", /^\/notifications\/log$/, () => ({ notifications: [], count: 0 })],
  ["GET", /^\/notifications\/stats$/, () => ({
    total_notifications: 0, sent: 0, pending: 0, failed: 0,
    by_type: { low_stock: 0, expiry: 0, refill_reminder: 0 }, today_count: 0,
  })],
  ["POST", /^\/notifications\/read-all$/, ({ db }) => {
    for (const n of coll(db, "notifications")) n.is_read = true;
    return { message: "All notifications marked as read" };
  }],
  ["GET", /^\/messages\/inbox$/, ({ db }) => {
    const messages = coll(db, "messages").filter((m) => m.recipient_id === GUEST_PROFILE.id);
    return { messages, count: messages.length };
  }],
  ["GET", /^\/messages\/sent$/, ({ db }) => {
    const messages = coll(db, "messages").filter((m) => m.sender_id === GUEST_PROFILE.id);
    return { messages, count: messages.length };
  }],
  ["GET", /^\/messages\/unread-count$/, ({ db }) => ({
    unread_count: coll(db, "messages").filter((m) => m.recipient_id === GUEST_PROFILE.id && !m.is_read).length,
  })],
  ["POST", /^\/messages\/send$/, ({ db, body }) => {
    const msg = {
      id: newId(),
      sender_id: GUEST_PROFILE.id,
      sender_name: GUEST_PROFILE.full_name,
      is_read: false,
      created_at: nowIso(),
      ...body,
    };
    coll(db, "messages").push(msg);
    return { message: "Message sent", id: msg.id };
  }],

  // CRM, branches, system, security
  ["GET", /^\/crm\/analytics\/summary$/, ({ db }) => ({
    total_customers: coll(db, "customers").length,
    loyalty_members: 0,
    active_campaigns: coll(db, "crm/campaigns").filter((c) => c.status === "active").length,
    total_points_distributed: 0,
    total_points_redeemed: 0,
    loyalty_tiers: { Gold: 0, Silver: 0, Bronze: 0 },
    campaign_performance: { total_sent: 0, total_opened: 0, average_open_rate: 0, average_click_rate: 0 },
    recent_activity: [],
  })],
  ["GET", /^\/crm\/analytics\/customer-segments$/, () => ({ segments: [] })],
  ["GET", /^\/branches\/stats$/, ({ db }) => {
    const b = coll(db, "branches");
    const active = b.filter((x) => x.is_active !== false).length;
    return { total_branches: b.length, active_branches: active, inactive_branches: b.length - active, total_employees: 0, head_office_branch: null };
  }],
  ["GET", /^\/system\/performance$/, () => ({
    slow_queries: [], slow_api_calls: [], table_sizes: [], index_usage: [], unused_indexes: [],
  })],
  ["POST", /^\/system\/optimize$/, () => ({ message: "Nothing to optimise in guest mode" })],
  ["GET", /^\/system\/config\/categories\/list$/, ({ db }) => ({
    categories: Array.from(new Set(coll(db, "system/config").map((c) => c.category).filter(Boolean))),
  })],
  ["GET", /^\/system\/config\/([^/]+)$/, ({ db, params }) => {
    const c = coll(db, "system/config").find((x) => x.config_key === params[0] || x.id === params[0]);
    return c ?? fail(404, "Config not found");
  }],
  ["PUT", /^\/system\/config\/([^/]+)$/, ({ db, params, body }) => {
    const list = coll(db, "system/config");
    let c = list.find((x) => x.config_key === params[0] || x.id === params[0]);
    if (!c) {
      c = { id: newId(), config_key: params[0], created_at: nowIso() };
      list.push(c);
    }
    Object.assign(c, body, { updated_at: nowIso() });
    return c;
  }],
  ["GET", /^\/security\/2fa\/status$/, () => ({ is_enabled: false })],
  ["POST", /^\/security\/(2fa\/\w+|change-password)$/, () =>
    fail(400, "Account security settings are available after signing in.")],
  ["GET", /^\/services\/reviews\/average\/[^/]+$/, () => ({ average_rating: 0, total_reviews: 0 })],
  ["GET", /^\/procurement\/three-way-match\/([^/]+)$/, ({ db, params }) => {
    const po = coll(db, "purchases").find((p) => p.id === params[0]);
    if (!po) return fail(404, "Purchase not found");
    return {
      purchase_id: po.id,
      invoice_no: po.invoice_no ?? po.invoice_number ?? "",
      supplier_name: po.supplier_name ?? "Unknown",
      po_date: po.purchase_date ?? po.created_at ?? "",
      po_status: po.status ?? "draft",
      total_amount: num(po.total_amount),
      overall_match: "pending",
      items: [],
    };
  }],
];

// ── generic REST ────────────────────────────────────────────────────────────

const ID_RE = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\d+)$/i;

const splitPath = (path: string) => {
  const segs = path.split("/").filter(Boolean);
  const idx = segs.findIndex((s) => ID_RE.test(s));
  if (idx < 0) return { collection: segs.join("/"), id: null as string | null, rest: [] as string[] };
  return { collection: segs.slice(0, idx).join("/"), id: segs[idx], rest: segs.slice(idx + 1) };
};

const IGNORED_FILTERS = new Set(["limit", "offset", "skip", "search", "q", "days", "from", "to", "from_date", "to_date", "start_date", "end_date"]);

const listRecords = (rows: Rec[], query: URLSearchParams) => {
  let out = rows;
  query.forEach((value, key) => {
    if (IGNORED_FILTERS.has(key) || value === "" || value === "all") return;
    if (key.endsWith("_id") || key === "status" || key === "type" || key === "category") {
      out = out.filter((r) => r[key] === undefined || String(r[key]) === value);
    }
  });
  const search = (query.get("search") || query.get("q") || "").toLowerCase();
  if (search) {
    out = out.filter((r) =>
      ["name", "sku", "generic_name", "brand_name", "phone", "email", "barcode"].some((k) =>
        String(r[k] ?? "").toLowerCase().includes(search)
      )
    );
  }
  out = [...out].sort((a, b) => createdAt(b) - createdAt(a));
  const limit = num(query.get("limit"));
  return limit > 0 ? out.slice(0, limit) : out;
};

const generic = (method: string, path: string, query: URLSearchParams, body: Rec | undefined, db: DB) => {
  const { collection, id, rest } = splitPath(path);
  const rows = coll(db, collection);

  if (method === "GET") {
    if (!id) return listRecords(rows, query);
    if (rest.length === 0) return rows.find((r) => String(r.id) === id) ?? fail(404, "Not found");
    const parentKey = `${singular(collection.split("/").pop() || "")}_id`;
    const childRows = coll(db, `${collection}/${rest.join("/")}`).filter((r) => String(r[parentKey]) === id);
    return listRecords(childRows, query);
  }

  if (method === "POST" && !id) {
    const base = { id: newId(), created_at: nowIso(), updated_at: nowIso(), ...(body ?? {}) };
    const rec = collection === "products" ? withProductDefaults(base) : base;
    rows.push(rec);
    return rec;
  }

  const target = id ? rows.find((r) => String(r.id) === id) : undefined;

  if (method === "DELETE") {
    if (id) db[collection] = rows.filter((r) => String(r.id) !== id);
    return { message: "Deleted successfully" };
  }

  // POST/PUT/PATCH on an existing record (optionally with an action suffix)
  if (!target) return { success: true, message: "OK" };
  const action = rest[rest.length - 1];
  if (action === "read") Object.assign(target, { is_read: true, read_at: nowIso() });
  else if (action && ACTION_STATUS[action]) target.status = ACTION_STATUS[action];
  if (body && typeof body === "object" && !Array.isArray(body)) Object.assign(target, body);
  query.forEach((value, key) => {
    if (key === "reason" || key === "status") target[key === "reason" ? "rejection_reason" : key] = value;
  });
  if (collection === "products") Object.assign(target, withProductDefaults(target));
  target.updated_at = nowIso();
  return target;
};

// ── entry point ─────────────────────────────────────────────────────────────

/**
 * Answer one API request locally. `path` excludes the leading `/api`.
 */
export const handleGuestRequest = (method: string, path: string, query: URLSearchParams, rawBody: unknown): Response => {
  const db = loadDb();
  const body = rawBody && typeof rawBody === "object" && !(rawBody instanceof FormData) ? (rawBody as Rec) : undefined;
  const cleanPath = path.replace(/\/+$/, "") || "/";
  let result: unknown;

  try {
    const route = ROUTES.find(([m, re]) => m === method && re.test(cleanPath));
    if (route) {
      const params = (cleanPath.match(route[1]) ?? []).slice(1).filter((p) => p !== undefined);
      result = route[2]({ db, params, query, body });
    } else {
      result = generic(method, cleanPath, query, body, db);
    }
  } catch (err) {
    return fail(500, err instanceof Error ? err.message : "Guest mode error");
  }

  if (method !== "GET") saveDb(db);
  if (result instanceof Response) return result;
  return json(result ?? {}, method === "POST" ? 201 : 200);
};
