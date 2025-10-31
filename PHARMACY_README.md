# Sharkar Feed & Medicine (Pharmacy + Animal Feed)

## Quick Start (Docker)
1. Ensure Docker Desktop is running.
2. In project root:
   - docker compose up -d --build
3. Open http://localhost (frontend)
4. API base: http://127.0.0.1:9000/api

## Roles
- Admin: full access (finance, approvals, user management)
- Salesman: POS, view stock, create requisitions

## Key Endpoints
- Auth: /api/auth/login, /api/auth/me
- Products: CRUD, /api/products/{id}/stock
- Purchases: POST /api/purchases, GRN /api/grn
- Sales: POST /api/sales, items, payments /api/sales/{id}/payment (admin clears with /api/payments/{payment_id}/clear)
- Requisitions: /api/requisitions create/list, approve/purchase (admin)
- Finance: /api/transactions, /api/expenses, TB /api/reports/finance/trial-balance, P&L /api/reports/profit-loss
- Exports: /api/reports/stock/export, /api/reports/sales/export, invoice HTML /api/sales/{id}/invoice
- CSV Import (admin):
  - Templates: /api/import/templates/{products|suppliers|customers|opening_stock}.csv
  - Uploads: /api/import/products, /api/import/suppliers, /api/import/customers, /api/import/opening-stock
- Audit Logs (admin): /api/audit-logs

## CSV Columns
- products.csv: sku,name,unit_type,unit_size,purchase_price,selling_price,cost_price,min_stock_threshold,opening_qty
- suppliers.csv: name,contact_person,phone,email,address,payment_terms
- customers.csv: name,email,phone,address,company
- opening_stock.csv: product_sku,qty

## ERD
See docs/ERD.md (Mermaid).

## Tests
- Dev requirements: pip install -r requirements-dev.txt
- Run smoke test (server must be up): pytest backend/tests/test_smoke.py

## Notes
- Simple average COGS used in P&L for MVP.
- Admin-only endpoints protected; frontend hides admin-only menus for non-admins.
