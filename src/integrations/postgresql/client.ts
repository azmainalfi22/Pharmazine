// PostgreSQL client configuration for Sharkar Pharmacy Management System
// This replaces the Supabase client with a direct PostgreSQL connection

import { Pool } from 'pg';

// Database configuration
const dbConfig = {
  host: import.meta.env.VITE_DATABASE_HOST || 'localhost',
  port: parseInt(import.meta.env.VITE_DATABASE_PORT || '5432'),
  database: import.meta.env.VITE_DATABASE_NAME || 'pharmazine',
  user: import.meta.env.VITE_DATABASE_USER || 'postgres',
  password: import.meta.env.VITE_DATABASE_PASSWORD || 'password',
  ssl: import.meta.env.VITE_NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};

// Create connection pool
export const pool = new Pool(dbConfig);

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
  created_at: string
  updated_at: string
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

// Database client class
export class DatabaseClient {
  private pool: Pool

  constructor() {
    this.pool = pool
  }

  // Generic query method
  async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    const client = await this.pool.connect()
    try {
      const result = await client.query(text, params)
      return result.rows
    } finally {
      client.release()
    }
  }

  // Generic query method for single result
  async queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
    const results = await this.query<T>(text, params)
    return results[0] || null
  }

  // Authentication methods (simplified for demo)
  async authenticateUser(email: string, password: string): Promise<Profile | null> {
    // In a real application, you would hash passwords and verify them
    // For demo purposes, we'll just return the user if they exist
    const user = await this.queryOne<Profile>(
      'SELECT * FROM profiles WHERE email = $1',
      [email]
    )
    return user
  }

  async getUserRoles(userId: string): Promise<UserRole[]> {
    return this.query<UserRole>(
      'SELECT * FROM user_roles WHERE user_id = $1',
      [userId]
    )
  }

  // Product methods
  async getProducts(): Promise<Product[]> {
    return this.query<Product>(`
      SELECT p.*, c.name as category_name, sc.name as subcategory_name, s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      ORDER BY p.created_at DESC
    `)
  }

  async getProduct(id: string): Promise<Product | null> {
    return this.queryOne<Product>(
      'SELECT * FROM products WHERE id = $1',
      [id]
    )
  }

  async createProduct(product: Partial<Product>): Promise<Product> {
    const result = await this.query<Product>(`
      INSERT INTO products (name, sku, category_id, subcategory_id, supplier_id, description, unit_price, cost_price, stock_quantity, reorder_level, min_stock_level, max_stock_level, brand, model, manufacturer, country_of_origin, warranty_period, weight, dimensions, power_consumption, voltage_rating, color, connectivity, specifications, features, compatibility, package_contents, emi_management)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
      RETURNING *
    `, [
      product.name, product.sku, product.category_id, product.subcategory_id, product.supplier_id,
      product.description, product.unit_price, product.cost_price, product.stock_quantity, product.reorder_level,
      product.min_stock_level, product.max_stock_level, product.brand, product.model, product.manufacturer,
      product.country_of_origin, product.warranty_period, product.weight, product.dimensions, product.power_consumption,
      product.voltage_rating, product.color, product.connectivity, product.specifications, product.features,
      product.compatibility, product.package_contents, product.emi_management
    ])
    return result[0]
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return this.query<Category>('SELECT * FROM categories ORDER BY name')
  }

  async getSubcategories(categoryId?: string): Promise<Subcategory[]> {
    if (categoryId) {
      return this.query<Subcategory>(
        'SELECT * FROM subcategories WHERE category_id = $1 ORDER BY name',
        [categoryId]
      )
    }
    return this.query<Subcategory>('SELECT * FROM subcategories ORDER BY name')
  }

  // Supplier methods
  async getSuppliers(): Promise<Supplier[]> {
    return this.query<Supplier>('SELECT * FROM suppliers ORDER BY name')
  }

  // Customer methods
  async getCustomers(): Promise<Customer[]> {
    return this.query<Customer>('SELECT * FROM customers ORDER BY name')
  }

  // Sales methods
  async getSales(): Promise<Sale[]> {
    return this.query<Sale>(`
      SELECT s.*, p.full_name as created_by_name
      FROM sales s
      LEFT JOIN profiles p ON s.created_by = p.id
      ORDER BY s.created_at DESC
    `)
  }

  async getSale(id: string): Promise<Sale | null> {
    return this.queryOne<Sale>(
      'SELECT * FROM sales WHERE id = $1',
      [id]
    )
  }

  async getSaleItems(saleId: string): Promise<SaleItem[]> {
    return this.query<SaleItem>(
      'SELECT * FROM sales_items WHERE sale_id = $1',
      [saleId]
    )
  }

  // Stock transaction methods
  async getStockTransactions(): Promise<StockTransaction[]> {
    return this.query<StockTransaction>(`
      SELECT st.*, p.name as product_name, pr.full_name as created_by_name
      FROM stock_transactions st
      LEFT JOIN products p ON st.product_id = p.id
      LEFT JOIN profiles pr ON st.created_by = pr.id
      ORDER BY st.created_at DESC
    `)
  }

  // Close the connection pool
  async close(): Promise<void> {
    await this.pool.end()
  }
}

// Create a singleton instance
export const db = new DatabaseClient()

// Export for compatibility with existing code
export default db
