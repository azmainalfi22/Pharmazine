// Backend API server for Volt Dealer Suite
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database configuration
const dbConfig = {
  host: process.env.VITE_DATABASE_HOST || 'localhost',
  port: parseInt(process.env.VITE_DATABASE_PORT || '5432'),
  database: process.env.VITE_DATABASE_NAME || 'volt_dealer_suite',
  user: process.env.VITE_DATABASE_USER || 'postgres',
  password: process.env.VITE_DATABASE_PASSWORD || 'password',
  ssl: process.env.VITE_NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

// Create connection pool
const pool = new Pool(dbConfig);

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

// Helper function to execute queries
const query = async (text, params) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows;
  } finally {
    client.release();
  }
};

// Authentication endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // For demo purposes, we'll authenticate against the database
    // In a real application, you would hash passwords and verify them
    const user = await query('SELECT * FROM profiles WHERE email = $1', [email]);
    
    if (user.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const roles = await query('SELECT * FROM user_roles WHERE user_id = $1', [user[0].id]);
    
    res.json({
      user: {
        id: user[0].id,
        email: user[0].email,
        full_name: user[0].full_name,
        phone: user[0].phone,
        roles: roles
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Products endpoints
app.get('/api/products', async (req, res) => {
  try {
    const products = await query(`
      SELECT p.*, c.name as category_name, sc.name as subcategory_name, s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      ORDER BY p.created_at DESC
    `);
    res.json(products);
  } catch (error) {
    console.error('Products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await query('SELECT * FROM products WHERE id = $1', [id]);
    res.json(product[0] || null);
  } catch (error) {
    console.error('Product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Categories endpoints
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await query('SELECT * FROM categories ORDER BY name');
    res.json(categories);
  } catch (error) {
    console.error('Categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/subcategories', async (req, res) => {
  try {
    const { categoryId } = req.query;
    let subcategories;
    
    if (categoryId) {
      subcategories = await query('SELECT * FROM subcategories WHERE category_id = $1 ORDER BY name', [categoryId]);
    } else {
      subcategories = await query('SELECT * FROM subcategories ORDER BY name');
    }
    
    res.json(subcategories);
  } catch (error) {
    console.error('Subcategories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Suppliers endpoints
app.get('/api/suppliers', async (req, res) => {
  try {
    const suppliers = await query('SELECT * FROM suppliers ORDER BY name');
    res.json(suppliers);
  } catch (error) {
    console.error('Suppliers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Customers endpoints
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await query('SELECT * FROM customers ORDER BY name');
    res.json(customers);
  } catch (error) {
    console.error('Customers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sales endpoints
app.get('/api/sales', async (req, res) => {
  try {
    const sales = await query(`
      SELECT s.*, p.full_name as created_by_name
      FROM sales s
      LEFT JOIN profiles p ON s.created_by = p.id
      ORDER BY s.created_at DESC
    `);
    res.json(sales);
  } catch (error) {
    console.error('Sales error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/sales/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sale = await query('SELECT * FROM sales WHERE id = $1', [id]);
    res.json(sale[0] || null);
  } catch (error) {
    console.error('Sale error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/sales/:id/items', async (req, res) => {
  try {
    const { id } = req.params;
    const items = await query('SELECT * FROM sales_items WHERE sale_id = $1', [id]);
    res.json(items);
  } catch (error) {
    console.error('Sale items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Stock transactions endpoints
app.get('/api/stock-transactions', async (req, res) => {
  try {
    const transactions = await query(`
      SELECT st.*, p.name as product_name, pr.full_name as created_by_name
      FROM stock_transactions st
      LEFT JOIN products p ON st.product_id = p.id
      LEFT JOIN profiles pr ON st.created_by = pr.id
      ORDER BY st.created_at DESC
    `);
    res.json(transactions);
  } catch (error) {
    console.error('Stock transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Dashboard stats endpoint
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const [
      totalProducts,
      totalSales,
      totalCustomers,
      lowStockProducts
    ] = await Promise.all([
      query('SELECT COUNT(*) as count FROM products'),
      query('SELECT COUNT(*) as count FROM sales'),
      query('SELECT COUNT(*) as count FROM customers'),
      query('SELECT COUNT(*) as count FROM products WHERE stock_quantity <= min_stock_level')
    ]);

    res.json({
      totalProducts: parseInt(totalProducts[0].count),
      totalSales: parseInt(totalSales[0].count),
      totalCustomers: parseInt(totalCustomers[0].count),
      lowStockProducts: parseInt(lowStockProducts[0].count)
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'OK', database: 'Connected' });
  } catch (error) {
    res.status(500).json({ status: 'Error', database: 'Disconnected' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Volt Dealer Suite API server running on port ${PORT}`);
  console.log(`📊 Database: ${dbConfig.database}@${dbConfig.host}:${dbConfig.port}`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
});
