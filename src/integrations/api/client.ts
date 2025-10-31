// API client for Volt Dealer Suite frontend
// This replaces the PostgreSQL client with HTTP API calls

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Database types (matching the original Supabase types)
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type AppRole = 'admin' | 'manager' | 'employee'
export type PaymentMethod = 'cash' | 'bkash' | 'upay' | 'visa' | 'bank_transfer'
export type TransactionType = 
  | 'purchase' | 'sale' | 'adjustment' | 'return' | 'opening_stock'
  | 'sales_return' | 'transfer_in' | 'transfer_out' | 'stock_adjustment_in'
  | 'stock_adjustment_out' | 'misc_receive' | 'misc_issue' | 'supplier_return'
  | 'production_out' | 'purchase_return'

// Database table types
export interface Profile {
  id: string
  full_name: string
  email: string
  phone?: string
  created_at: string
  updated_at: string
}

export interface UserRole {
  id: string
  user_id: string
  role: AppRole
  created_at: string
}

export interface Category {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Subcategory {
  id: string
  name: string
  description?: string
  category_id?: string
  created_at: string
  updated_at: string
}

export interface Country {
  id: string
  name: string
  code: string
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: string
  name: string
  contact_person?: string
  phone?: string
  email?: string
  address?: string
  payment_terms?: string
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  company?: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  sku: string
  category_id?: string
  subcategory_id?: string
  supplier_id?: string
  description?: string
  unit_price: number
  cost_price: number
  stock_quantity: number
  reorder_level?: number
  min_stock_level?: number
  max_stock_level?: number
  image_url?: string
  brand?: string
  model?: string
  manufacturer?: string
  country_of_origin?: string
  assemble_country?: string
  serial_number?: string
  mrp_unit?: number
  mrp_strip?: number
  warranty_period?: string
  weight?: number
  dimensions?: string
  power_consumption?: string
  voltage_rating?: string
  color?: string
  connectivity?: string
  specifications?: string
  features?: string
  compatibility?: string
  package_contents?: string
  emi_management?: boolean
  // Pharmacy/feed specific fields
  unit_type?: string
  unit_size?: string
  unit_multiplier?: number
  purchase_price?: number
  selling_price?: number
  min_stock_threshold?: number
  // Medicine-specific fields
  batch_number?: string
  expiry_date?: string
  manufacturing_date?: string
  shelf_life?: string
  active_ingredients?: string
  dosage?: string
  storage_instructions?: string
  indications?: string
  side_effects?: string
  prescription_required?: boolean
  created_at: string
  updated_at: string
  // Additional fields from joins
  category_name?: string
  subcategory_name?: string
  supplier_name?: string
}

export interface StockTransaction {
  id: string
  product_id: string
  transaction_type: TransactionType
  quantity: number
  unit_price?: number
  reference_id?: string
  notes?: string
  from_location?: string
  to_location?: string
  reason?: string
  created_by?: string
  created_at: string
  // Additional fields from joins
  product_name?: string
  created_by_name?: string
}

export interface Sale {
  id: string
  customer_name: string
  customer_phone?: string
  customer_email?: string
  total_amount: number
  discount?: number
  tax?: number
  net_amount: number
  payment_method: PaymentMethod
  payment_status: string
  emi_enabled?: boolean
  emi_months?: number
  emi_amount?: number
  emi_interest_rate?: number
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
  // Additional fields from joins
  created_by_name?: string
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
}

export interface Company {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  website?: string
  tax_id?: string
  registration_number?: string
  business_type?: string
  established_date?: string
  description?: string
  logo_url?: string
  created_at: string
  updated_at: string
}

export interface DashboardStats {
  totalProducts: number
  totalSales: number
  totalCustomers: number
  lowStockProducts: number
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

export interface RegisterRequest {
  full_name: string
  email: string
  password: string
  phone?: string
}

// New Stock Management Types
export interface MasterReceive {
  receive_pk_no: number
  chalan_date: string
  category?: string
  supplier_name?: string
  product_model_number?: string
  receive_type?: string
  status?: number
  au_entry_by: number
  au_entry_at: string
  au_update_by?: number
  au_update_at?: string
}

export interface ReceiveDetails {
  receivedtl_pk_no: number
  receive_pk_no?: number
  chalan_no?: string
  item_barcode?: string
  item_pk_no: number
  item_name?: string
  receive_quantity: number
  unit_price?: number
  status?: number
  au_entry_by: number
  au_entry_at: string
  au_update_by?: number
  au_update_at?: string
  adj_reason?: string
  adj_type?: string
  remarks?: string
}

export interface IssueMaster {
  issue_pk_no: number
  chalan_date: string
  category?: string
  supplier_name?: string
  product_model_number?: string
  issue_type?: string
  status?: number
  au_entry_by: number
  au_entry_at: string
  au_update_by?: number
  au_update_at?: string
}

export interface IssueDetails {
  issuedtl_pk_no: number
  issue_pk_no?: number
  chalan_no?: string
  item_barcode?: string
  item_pk_no: number
  item_name?: string
  issue_quantity: number
  unit_price?: number
  status?: number
  au_entry_by: number
  au_entry_at: string
  au_update_by?: number
  au_update_at?: string
  adj_reason?: string
  adj_type?: string
  remarks?: string
}

// Request types for creating records
export interface MasterReceiveCreate {
  category?: string
  supplier_name?: string
  product_model_number?: string
  receive_type: string
  au_entry_by: number
}

export interface ReceiveDetailsCreate {
  receive_pk_no?: number
  chalan_no?: string
  item_barcode?: string
  item_pk_no: number
  item_name?: string
  receive_quantity: number
  unit_price?: number
  adj_reason?: string
  adj_type?: string
  remarks?: string
  au_entry_by: number
}

export interface IssueMasterCreate {
  category?: string
  supplier_name?: string
  product_model_number?: string
  issue_type: string
  au_entry_by: number
}

export interface IssueDetailsCreate {
  issue_pk_no?: number
  chalan_no?: string
  item_barcode?: string
  item_pk_no: number
  item_name?: string
  issue_quantity: number
  unit_price?: number
  adj_reason?: string
  adj_type?: string
  remarks?: string
  au_entry_by: number
}

// API Response types
export interface StockManagementResponse {
  message: string
  chalan_no: string
  master_id?: number
  details_count?: number
  type?: string
}

// API client class
export class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('volt_dealer_token')
  }

  // Set authentication token
  setToken(token: string | null) {
    this.token = token
    if (token) {
      localStorage.setItem('volt_dealer_token', token)
    } else {
      localStorage.removeItem('volt_dealer_token')
    }
  }

  // Get authentication token
  getToken(): string | null {
    return this.token
  }

  // Generic fetch method
  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
      ...(options.headers as { [key: string]: string }),
    }

    // Add authorization header if token exists
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Helper for CSV/Blob
  private async fetchBlob(endpoint: string, options: RequestInit = {}): Promise<Blob> {
    const url = `${this.baseUrl}${endpoint}`
    const headers: { [key: string]: string } = {
      ...(options.headers as { [key: string]: string }),
    }
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`
    const response = await fetch(url, { ...options, headers })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response.blob()
  }


  // Requisitions
  async createRequisition(payload: { store_id?: string; items: { product_id: string; qty: number; unit?: string }[] }) {
    return this.fetch(`/requisitions`, { method: 'POST', body: JSON.stringify(payload) })
  }
  async listRequisitions() {
    return this.fetch(`/requisitions`)
  }
  async approveRequisition(reqId: string) {
    return this.fetch(`/requisitions/${reqId}/approve`, { method: 'POST' })
  }
  async purchaseRequisition(reqId: string) {
    return this.fetch(`/requisitions/${reqId}/purchase`, { method: 'POST' })
  }

  // Payments
  async recordSalePayment(saleId: string, payload: { amount: number; method: string; status?: string }) {
    return this.fetch(`/sales/${saleId}/payment`, { method: 'POST', body: JSON.stringify(payload) })
  }
  async clearPayment(paymentId: string) {
    return this.fetch(`/payments/${paymentId}/clear`, { method: 'POST' })
  }

  // Finance
  async createTransaction(payload: { date?: string; type: string; amount: number; reference_id?: string; description?: string }) {
    return this.fetch(`/transactions`, { method: 'POST', body: JSON.stringify(payload) })
  }
  async listTransactions(params?: { from_date?: string; to_date?: string; type?: string }) {
    const qs = new URLSearchParams(params as any).toString()
    return this.fetch(`/transactions${qs ? `?${qs}` : ''}`)
  }
  async createExpense(payload: { date?: string; category?: string; amount: number; description?: string; receipt_url?: string }) {
    return this.fetch(`/expenses`, { method: 'POST', body: JSON.stringify(payload) })
  }
  async listExpenses(params?: { from_date?: string; to_date?: string; category?: string }) {
    const qs = new URLSearchParams(params as any).toString()
    return this.fetch(`/expenses${qs ? `?${qs}` : ''}`)
  }
  async trialBalance(params?: { from_date?: string; to_date?: string }): Promise<{ totals: Record<string, number> }> {
    const qs = new URLSearchParams(params as any).toString()
    return this.fetch(`/reports/finance/trial-balance${qs ? `?${qs}` : ''}`)
  }
  async profitLoss(params?: { from_date?: string; to_date?: string }): Promise<{ total_sales: number; cogs: number; gross_profit: number; expenses: number; net_profit: number }> {
    const qs = new URLSearchParams(params as any).toString()
    return this.fetch(`/reports/profit-loss${qs ? `?${qs}` : ''}`)
  }

  // Exports / Invoice
  async exportStockCSV(): Promise<Blob> {
    return this.fetchBlob(`/reports/stock/export`)
  }
  async exportSalesCSV(): Promise<Blob> {
    return this.fetchBlob(`/reports/sales/export`)
  }
  async getInvoiceHTML(saleId: string): Promise<string> {
    const url = `${this.baseUrl}/sales/${saleId}/invoice`
    const res = await fetch(url, { headers: this.token ? { Authorization: `Bearer ${this.token}` } : {} })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.text()
  }

  // CSV Imports
  async downloadTemplate(kind: 'products' | 'suppliers' | 'customers' | 'opening_stock'): Promise<Blob> {
    return this.fetchBlob(`/import/templates/${kind}.csv`)
  }
  async importCSV(endpoint: '/import/products' | '/import/suppliers' | '/import/customers' | '/import/opening-stock', file: File): Promise<any> {
    const form = new FormData()
    form.append('file', file)
    const url = `${this.baseUrl}${endpoint}`
    const headers: Record<string, string> = {}
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`
    const response = await fetch(url, { method: 'POST', headers, body: form as any })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response.json()
  }

  // Audit Logs
  async getAuditLogs(limit = 100) {
    return this.fetch(`/audit-logs?limit=${limit}`)
  }

  // Convenience wrappers for UI components
  async getSalePayments() {
    return this.fetch(`/payments`)
  }
  
  async getTransactions(params?: { from_date?: string; to_date?: string }) {
    return this.listTransactions(params)
  }
  
  async getExpenses(params?: { from_date?: string; to_date?: string }) {
    return this.listExpenses(params)
  }
  
  async getTrialBalance(startDate: string, endDate: string) {
    return this.trialBalance({ from_date: startDate, to_date: endDate })
  }
  
  async getProfitLoss(startDate: string, endDate: string) {
    return this.profitLoss({ from_date: startDate, to_date: endDate })
  }
  
  async downloadImportTemplate(type: 'products' | 'suppliers' | 'customers' | 'opening-stock') {
    const typeMap: Record<string, 'products' | 'suppliers' | 'customers' | 'opening_stock'> = {
      'products': 'products',
      'suppliers': 'suppliers',
      'customers': 'customers',
      'opening-stock': 'opening_stock'
    }
    return this.downloadTemplate(typeMap[type])
  }
  
  async importProductsCSV(file: File) {
    return this.importCSV('/import/products', file)
  }
  
  async importSuppliersCSV(file: File) {
    return this.importCSV('/import/suppliers', file)
  }
  
  async importCustomersCSV(file: File) {
    return this.importCSV('/import/customers', file)
  }
  
  async importOpeningStockCSV(file: File) {
    return this.importCSV('/import/opening-stock', file)
  }

  // Authentication methods
  async authenticateUser(email: string, password: string): Promise<Profile | null> {
    try {
      const response = await this.fetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      
      // Store the token
      this.setToken(response.access_token)
      
      // Get user info
      const user = await this.getCurrentUser()
      return user
    } catch (error) {
      console.error('Authentication error:', error)
      return null
    }
  }

  async registerUser(userData: RegisterRequest): Promise<Profile | null> {
    try {
      const user = await this.fetch<Profile>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      })
      return user
    } catch (error) {
      console.error('Registration error:', error)
      return null
    }
  }

  async getCurrentUser(): Promise<Profile | null> {
    try {
      const user = await this.fetch<Profile>('/auth/me')
      return user
    } catch (error) {
      console.error('Get current user error:', error)
      return null
    }
  }

  async logout(): Promise<void> {
    this.setToken(null)
  }

  async getUserRoles(userId: string): Promise<UserRole[]> {
    try {
      return this.fetch<UserRole[]>(`/users/${userId}/roles`)
    } catch (error) {
      console.error('Get user roles error:', error)
      return []
    }
  }

  // Product methods
  async getProducts(): Promise<Product[]> {
    return this.fetch<Product[]>('/products')
  }

  async getProduct(id: string): Promise<Product | null> {
    return this.fetch<Product | null>(`/products/${id}`)
  }

  async createProduct(product: Partial<Product>): Promise<Product> {
    return this.fetch<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    })
  }

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    return this.fetch<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    })
  }

  async deleteProduct(id: string): Promise<void> {
    return this.fetch<void>(`/products/${id}`, {
      method: 'DELETE',
    })
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return this.fetch<Category[]>('/categories')
  }

  async createCategory(category: Partial<Category>): Promise<Category> {
    return this.fetch<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    })
  }

  async updateCategory(id: string, category: Partial<Category>): Promise<Category> {
    return this.fetch<Category>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    })
  }

  async deleteCategory(id: string): Promise<void> {
    return this.fetch<void>(`/categories/${id}`, {
      method: 'DELETE',
    })
  }

  async getSubcategories(categoryId?: string): Promise<Subcategory[]> {
    const endpoint = categoryId ? `/subcategories?categoryId=${categoryId}` : '/subcategories'
    return this.fetch<Subcategory[]>(endpoint)
  }

  async createSubcategory(subcategory: Partial<Subcategory>): Promise<Subcategory> {
    return this.fetch<Subcategory>('/subcategories', {
      method: 'POST',
      body: JSON.stringify(subcategory),
    })
  }

  async updateSubcategory(id: string, subcategory: Partial<Subcategory>): Promise<Subcategory> {
    return this.fetch<Subcategory>(`/subcategories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(subcategory),
    })
  }

  async deleteSubcategory(id: string): Promise<void> {
    return this.fetch<void>(`/subcategories/${id}`, {
      method: 'DELETE',
    })
  }

  // Supplier methods
  async getSuppliers(): Promise<Supplier[]> {
    return this.fetch<Supplier[]>('/suppliers')
  }

  async createSupplier(supplier: Partial<Supplier>): Promise<Supplier> {
    return this.fetch<Supplier>('/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplier),
    })
  }

  async updateSupplier(id: string, supplier: Partial<Supplier>): Promise<Supplier> {
    return this.fetch<Supplier>(`/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(supplier),
    })
  }

  async deleteSupplier(id: string): Promise<void> {
    return this.fetch<void>(`/suppliers/${id}`, {
      method: 'DELETE',
    })
  }

  // Customer methods
  async getCustomers(): Promise<Customer[]> {
    return this.fetch<Customer[]>('/customers')
  }

  async createCustomer(customer: Partial<Customer>): Promise<Customer> {
    return this.fetch<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    })
  }

  async updateCustomer(id: string, customer: Partial<Customer>): Promise<Customer> {
    return this.fetch<Customer>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customer),
    })
  }

  async deleteCustomer(id: string): Promise<void> {
    return this.fetch<void>(`/customers/${id}`, {
      method: 'DELETE',
    })
  }

  // Country methods
  async getCountries(): Promise<Country[]> {
    return this.fetch<Country[]>('/countries')
  }

  async createCountry(country: Partial<Country>): Promise<Country> {
    return this.fetch<Country>('/countries', {
      method: 'POST',
      body: JSON.stringify(country),
    })
  }

  async updateCountry(id: string, country: Partial<Country>): Promise<Country> {
    return this.fetch<Country>(`/countries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(country),
    })
  }

  async deleteCountry(id: string): Promise<void> {
    return this.fetch<void>(`/countries/${id}`, {
      method: 'DELETE',
    })
  }

  // Company methods
  async getCompanies(): Promise<Company[]> {
    return this.fetch<Company[]>('/companies')
  }

  async getCompany(id: string): Promise<Company | null> {
    return this.fetch<Company | null>(`/companies/${id}`)
  }

  async createCompany(company: Partial<Company>): Promise<Company> {
    return this.fetch<Company>('/companies', {
      method: 'POST',
      body: JSON.stringify(company),
    })
  }

  async updateCompany(id: string, company: Partial<Company>): Promise<Company> {
    return this.fetch<Company>(`/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(company),
    })
  }

  async deleteCompany(id: string): Promise<void> {
    return this.fetch<void>(`/companies/${id}`, {
      method: 'DELETE',
    })
  }

  // Sales methods
  async getSales(): Promise<Sale[]> {
    return this.fetch<Sale[]>('/sales')
  }

  async getSale(id: string): Promise<Sale | null> {
    return this.fetch<Sale | null>(`/sales/${id}`)
  }

  async getSaleItems(saleId: string): Promise<SaleItem[]> {
    return this.fetch<SaleItem[]>(`/sales/${saleId}/items`)
  }

  // Stock transaction methods
  async getStockTransactions(): Promise<StockTransaction[]> {
    return this.fetch<StockTransaction[]>('/stock-transactions')
  }

  async createStockTransaction(transaction: Partial<StockTransaction>): Promise<StockTransaction> {
    return this.fetch<StockTransaction>('/stock-transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    })
  }

  async deleteStockTransaction(id: string): Promise<void> {
    return this.fetch<void>(`/stock-transactions/${id}`, {
      method: 'DELETE',
    })
  }

  // Purchase methods
  async getPurchases(): Promise<any[]> {
    return this.fetch<any[]>('/purchases')
  }

  async getPurchase(id: string): Promise<any> {
    return this.fetch<any>(`/purchases/${id}`)
  }

  async createPurchase(purchase: any): Promise<any> {
    return this.fetch<any>('/purchases', {
      method: 'POST',
      body: JSON.stringify(purchase),
    })
  }

  // GRN methods
  async getGRNs(): Promise<any[]> {
    return this.fetch<any[]>('/grns')
  }

  async getGRN(id: string): Promise<any> {
    return this.fetch<any>(`/grns/${id}`)
  }

  async confirmGRN(grn: any): Promise<any> {
    return this.fetch<any>('/grn', {
      method: 'POST',
      body: JSON.stringify(grn),
    })
  }

  async createSale(sale: Partial<Sale>): Promise<Sale> {
    return this.fetch<Sale>('/sales', {
      method: 'POST',
      body: JSON.stringify(sale),
    })
  }

  async createSaleItem(item: Partial<SaleItem>): Promise<SaleItem> {
    return this.fetch<SaleItem>('/sales/items', {
      method: 'POST',
      body: JSON.stringify(item),
    })
  }

  // Dashboard methods
  async getDashboardStats(): Promise<DashboardStats> {
    return this.fetch<DashboardStats>('/dashboard/stats')
  }

  // Health check
  async healthCheck(): Promise<{ status: string; database: string }> {
    return this.fetch<{ status: string; database: string }>('/health')
  }

  // New Stock Management Methods
  
  // Master Receive methods
  async createMasterReceive(receive: MasterReceiveCreate): Promise<MasterReceive> {
    return this.fetch<MasterReceive>('/master-receive', {
      method: 'POST',
      body: JSON.stringify(receive),
    })
  }

  async getMasterReceive(): Promise<MasterReceive[]> {
    return this.fetch<MasterReceive[]>('/master-receive')
  }

  // Receive Details methods
  async createReceiveDetails(detail: ReceiveDetailsCreate): Promise<ReceiveDetails> {
    return this.fetch<ReceiveDetails>('/receive-details', {
      method: 'POST',
      body: JSON.stringify(detail),
    })
  }

  async getReceiveDetails(): Promise<ReceiveDetails[]> {
    return this.fetch<ReceiveDetails[]>('/receive-details')
  }

  // Issue Master methods
  async createIssueMaster(issue: IssueMasterCreate): Promise<IssueMaster> {
    return this.fetch<IssueMaster>('/issue-master', {
      method: 'POST',
      body: JSON.stringify(issue),
    })
  }

  async getIssueMaster(): Promise<IssueMaster[]> {
    return this.fetch<IssueMaster[]>('/issue-master')
  }

  // Issue Details methods
  async createIssueDetails(detail: IssueDetailsCreate): Promise<IssueDetails> {
    return this.fetch<IssueDetails>('/issue-details', {
      method: 'POST',
      body: JSON.stringify(detail),
    })
  }

  async getIssueDetails(): Promise<IssueDetails[]> {
    return this.fetch<IssueDetails[]>('/issue-details')
  }

  // Comprehensive Stock Management methods
  async createOpeningStock(items: ReceiveDetailsCreate[]): Promise<StockManagementResponse> {
    return this.fetch<StockManagementResponse>('/stock-management/opening-stock', {
      method: 'POST',
      body: JSON.stringify(items),
    })
  }

  async createStockAdjustment(
    adjustmentType: 'write_on' | 'write_off',
    items: ReceiveDetailsCreate[]
  ): Promise<StockManagementResponse> {
    return this.fetch<StockManagementResponse>('/stock-management/adjustment', {
      method: 'POST',
      body: JSON.stringify({
        adjustment_type: adjustmentType,
        items: items,
      }),
    })
  }
}

// Create a singleton instance
export const apiClient = new ApiClient()

// Export for compatibility with existing code
export default apiClient
