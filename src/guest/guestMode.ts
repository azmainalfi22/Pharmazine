/**
 * Guest mode: visitors can explore the whole app without signing in.
 *
 * While nobody is signed in (no API token in localStorage), every `/api/*`
 * request is answered in the browser by `guestApi.ts` instead of the real
 * backend. The guest starts with an empty pharmacy ("fresh install") and
 * whatever they create is kept in this browser's localStorage only.
 *
 * Signing in stores a token, after which requests go to the real backend
 * and the user's own data loads. Signing out returns to guest mode.
 */

export const GUEST_DB_KEY = "pharmazine_guest_db_v1";
export const GUEST_BANNER_DISMISSED_KEY = "pharmazine_guest_banner_dismissed";

export const isGuestSession = (): boolean => {
  try {
    return !localStorage.getItem("token");
  } catch {
    return true;
  }
};

export const GUEST_PROFILE = {
  id: "guest",
  email: "guest@pharmazine.local",
  full_name: "Guest",
  phone: undefined as string | undefined,
  created_at: "2025-01-01T00:00:00.000Z",
  updated_at: "2025-01-01T00:00:00.000Z",
};

// Mirrors backend/rbac.py Permission values — a guest gets full access to
// their own local sandbox.
export const ALL_PERMISSIONS = [
  "view_dashboard", "view_products", "create_products", "edit_products",
  "delete_products", "view_product_cost", "edit_product_price", "view_stock",
  "adjust_stock", "view_stock_value", "manage_opening_stock", "create_sale",
  "view_sales", "delete_sale", "apply_discount", "process_return",
  "view_purchases", "create_purchase", "edit_purchase", "delete_purchase",
  "approve_purchase", "view_customers", "create_customers", "edit_customers",
  "delete_customers", "view_suppliers", "create_suppliers", "edit_suppliers",
  "delete_suppliers", "view_reports", "view_financial_reports",
  "manage_payments", "view_profit_loss", "view_users", "create_users",
  "edit_users", "delete_users", "manage_roles", "view_audit_logs",
  "manage_settings", "import_data", "export_data", "backup_database",
];

/** Wipe everything the guest created in this browser. */
export const resetGuestData = () => {
  try {
    localStorage.removeItem(GUEST_DB_KEY);
  } catch {
    /* storage unavailable — nothing to clear */
  }
};
