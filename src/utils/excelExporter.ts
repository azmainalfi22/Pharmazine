import * as XLSX from 'xlsx';

interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

interface ExportOptions {
  filename: string;
  sheetName?: string;
  columns: ExportColumn[];
  data: any[];
}

export const exportToExcel = (options: ExportOptions) => {
  const { filename, sheetName = 'Sheet1', columns, data } = options;

  // Create worksheet data with headers
  const wsData = [
    columns.map(col => col.header),
    ...data.map(row => 
      columns.map(col => {
        const value = row[col.key];
        // Format dates
        if (value instanceof Date) {
          return value.toLocaleDateString();
        }
        // Handle null/undefined
        if (value === null || value === undefined) {
          return '';
        }
        return value;
      })
    )
  ];

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  const colWidths = columns.map(col => ({ wch: col.width || 15 }));
  ws['!cols'] = colWidths;

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Generate file
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

// Stock Report Export
export const exportStockReport = (products: any[]) => {
  const data = products.map(product => ({
    sku: product.sku,
    name: product.name,
    category: product.category,
    subcategory: product.subcategory || '-',
    current_stock: product.stock_quantity || product.current_stock || 0,
    unit_type: product.unit_type || 'piece',
    purchase_price: product.purchase_price || product.cost_price || 0,
    selling_price: product.selling_price || product.unit_price || 0,
    supplier: product.supplier || '-',
    status: product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock',
  }));

  exportToExcel({
    filename: `stock-report-${new Date().toISOString().split('T')[0]}`,
    sheetName: 'Stock Report',
    columns: [
      { header: 'SKU', key: 'sku', width: 15 },
      { header: 'Product Name', key: 'name', width: 30 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Subcategory', key: 'subcategory', width: 15 },
      { header: 'Current Stock', key: 'current_stock', width: 12 },
      { header: 'Unit', key: 'unit_type', width: 10 },
      { header: 'Purchase Price', key: 'purchase_price', width: 15 },
      { header: 'Selling Price', key: 'selling_price', width: 15 },
      { header: 'Supplier', key: 'supplier', width: 20 },
      { header: 'Status', key: 'status', width: 12 },
    ],
    data,
  });
};

// Sales Report Export
export const exportSalesReport = (sales: any[]) => {
  const data = sales.map(sale => ({
    invoice_no: sale.id?.substring(0, 8).toUpperCase() || '-',
    date: new Date(sale.created_at).toLocaleDateString(),
    customer: sale.customer_name || '-',
    phone: sale.customer_phone || '-',
    payment_method: sale.payment_method || '-',
    gross_amount: sale.gross_amount || 0,
    discount: sale.discount_amount || 0,
    tax: sale.tax_amount || 0,
    net_amount: sale.net_amount || 0,
    status: sale.payment_status || '-',
  }));

  exportToExcel({
    filename: `sales-report-${new Date().toISOString().split('T')[0]}`,
    sheetName: 'Sales Report',
    columns: [
      { header: 'Invoice No', key: 'invoice_no', width: 12 },
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Customer', key: 'customer', width: 20 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Payment Method', key: 'payment_method', width: 15 },
      { header: 'Gross Amount', key: 'gross_amount', width: 15 },
      { header: 'Discount', key: 'discount', width: 12 },
      { header: 'Tax', key: 'tax', width: 12 },
      { header: 'Net Amount', key: 'net_amount', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
    ],
    data,
  });
};

// Purchase Report Export
export const exportPurchaseReport = (purchases: any[]) => {
  const data = purchases.map(purchase => ({
    invoice_no: purchase.invoice_no || '-',
    date: new Date(purchase.date).toLocaleDateString(),
    supplier: purchase.supplier_name || '-',
    total_amount: purchase.total_amount || 0,
    payment_status: purchase.payment_status || '-',
    items_count: purchase.items?.length || 0,
  }));

  exportToExcel({
    filename: `purchase-report-${new Date().toISOString().split('T')[0]}`,
    sheetName: 'Purchase Report',
    columns: [
      { header: 'Invoice No', key: 'invoice_no', width: 15 },
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Supplier', key: 'supplier', width: 25 },
      { header: 'Total Amount', key: 'total_amount', width: 15 },
      { header: 'Payment Status', key: 'payment_status', width: 15 },
      { header: 'Items Count', key: 'items_count', width: 12 },
    ],
    data,
  });
};

// Requisition Report Export
export const exportRequisitionReport = (requisitions: any[]) => {
  const data = requisitions.map(req => ({
    id: req.id.substring(0, 8).toUpperCase(),
    date: new Date(req.requested_at).toLocaleDateString(),
    requested_by: req.requested_by || '-',
    status: req.status || '-',
    items_count: req.items?.length || 0,
    approved_by: req.approved_by || '-',
    approved_at: req.approved_at ? new Date(req.approved_at).toLocaleDateString() : '-',
  }));

  exportToExcel({
    filename: `requisition-report-${new Date().toISOString().split('T')[0]}`,
    sheetName: 'Requisitions',
    columns: [
      { header: 'Requisition ID', key: 'id', width: 15 },
      { header: 'Date Requested', key: 'date', width: 15 },
      { header: 'Requested By', key: 'requested_by', width: 20 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Items Count', key: 'items_count', width: 12 },
      { header: 'Approved By', key: 'approved_by', width: 20 },
      { header: 'Approved At', key: 'approved_at', width: 15 },
    ],
    data,
  });
};

// Payment Report Export
export const exportPaymentReport = (payments: any[]) => {
  const data = payments.map(payment => ({
    id: payment.id.substring(0, 8).toUpperCase(),
    sale_id: payment.sale_id?.substring(0, 8).toUpperCase() || '-',
    date: new Date(payment.recorded_at).toLocaleDateString(),
    type: payment.payment_type || '-',
    amount: payment.amount || 0,
    status: payment.status || '-',
    recorded_by: payment.recorded_by || '-',
    cleared_by: payment.cleared_by || '-',
    cleared_at: payment.cleared_at ? new Date(payment.cleared_at).toLocaleDateString() : '-',
  }));

  exportToExcel({
    filename: `payment-report-${new Date().toISOString().split('T')[0]}`,
    sheetName: 'Payments',
    columns: [
      { header: 'Payment ID', key: 'id', width: 15 },
      { header: 'Sale ID', key: 'sale_id', width: 15 },
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Type', key: 'type', width: 12 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Recorded By', key: 'recorded_by', width: 20 },
      { header: 'Cleared By', key: 'cleared_by', width: 20 },
      { header: 'Cleared At', key: 'cleared_at', width: 15 },
    ],
    data,
  });
};

// Financial Report Export (Trial Balance)
export const exportTrialBalance = (trialBalance: any[]) => {
  const data = trialBalance.map(item => ({
    account: item.account || '-',
    debit: item.debit || 0,
    credit: item.credit || 0,
    balance: (item.debit || 0) - (item.credit || 0),
  }));

  // Add totals row
  const totals = data.reduce(
    (acc, item) => ({
      debit: acc.debit + item.debit,
      credit: acc.credit + item.credit,
    }),
    { debit: 0, credit: 0 }
  );

  data.push({
    account: 'TOTAL',
    debit: totals.debit,
    credit: totals.credit,
    balance: totals.debit - totals.credit,
  });

  exportToExcel({
    filename: `trial-balance-${new Date().toISOString().split('T')[0]}`,
    sheetName: 'Trial Balance',
    columns: [
      { header: 'Account', key: 'account', width: 30 },
      { header: 'Debit', key: 'debit', width: 15 },
      { header: 'Credit', key: 'credit', width: 15 },
      { header: 'Balance', key: 'balance', width: 15 },
    ],
    data,
  });
};

// Expense Report Export
export const exportExpenseReport = (expenses: any[]) => {
  const data = expenses.map(expense => ({
    date: new Date(expense.date).toLocaleDateString(),
    category: expense.category || '-',
    amount: expense.amount || 0,
    description: expense.description || '-',
    recorded_by: expense.recorded_by || '-',
  }));

  // Add totals row
  const total = data.reduce((sum, item) => sum + item.amount, 0);
  data.push({
    date: 'TOTAL',
    category: '',
    amount: total,
    description: '',
    recorded_by: '',
  });

  exportToExcel({
    filename: `expense-report-${new Date().toISOString().split('T')[0]}`,
    sheetName: 'Expenses',
    columns: [
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Recorded By', key: 'recorded_by', width: 20 },
    ],
    data,
  });
};

// Customer List Export
export const exportCustomerList = (customers: any[]) => {
  const data = customers.map(customer => ({
    name: customer.name || '-',
    email: customer.email || '-',
    phone: customer.phone || '-',
    address: customer.address || '-',
    created_at: customer.created_at ? new Date(customer.created_at).toLocaleDateString() : '-',
  }));

  exportToExcel({
    filename: `customer-list-${new Date().toISOString().split('T')[0]}`,
    sheetName: 'Customers',
    columns: [
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Address', key: 'address', width: 40 },
      { header: 'Registered Date', key: 'created_at', width: 15 },
    ],
    data,
  });
};

// Supplier List Export
export const exportSupplierList = (suppliers: any[]) => {
  const data = suppliers.map(supplier => ({
    name: supplier.name || '-',
    contact_person: supplier.contact_person || '-',
    email: supplier.email || '-',
    phone: supplier.phone || '-',
    address: supplier.address || '-',
  }));

  exportToExcel({
    filename: `supplier-list-${new Date().toISOString().split('T')[0]}`,
    sheetName: 'Suppliers',
    columns: [
      { header: 'Company Name', key: 'name', width: 25 },
      { header: 'Contact Person', key: 'contact_person', width: 20 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Address', key: 'address', width: 40 },
    ],
    data,
  });
};

