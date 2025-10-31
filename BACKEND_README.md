# Volt Dealer Suite - FastAPI Backend

A comprehensive electronics dealer management system with Python FastAPI backend and PostgreSQL database.

## 🚀 Quick Start

### Prerequisites

- Python 3.8 or higher
- PostgreSQL 12 or higher
- Node.js 16 or higher (for frontend)

### 1. Database Setup

1. **Install PostgreSQL** (if not already installed)
   - Windows: Download from https://www.postgresql.org/download/windows/
   - macOS: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql postgresql-contrib`

2. **Create Database**
   ```bash
   createdb volt_dealer_suite
   ```

3. **Set Database Password** (if needed)
   ```bash
   psql -U postgres
   ALTER USER postgres PASSWORD 'password';
   ```

### 2. Backend Setup

1. **Clone/Navigate to Project Directory**
   ```bash
   cd volt-dealer-suite
   ```

2. **Install Python Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set Environment Variables**
   Create a `.env` file in the project root:
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/volt_dealer_suite
   ```

4. **Start the Backend Server**

   **Option A: Using the startup script (Recommended)**
   ```bash
   # Linux/macOS
   chmod +x start_backend.sh
   ./start_backend.sh
   
   # Windows
   start_backend.bat
   ```

   **Option B: Manual start**
   ```bash
   python backend/seed_data.py  # Seed the database
   uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
   ```

5. **Verify Backend is Running**
   - API Server: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - Health Check: http://localhost:8000/api/health

### 3. Frontend Setup

1. **Install Frontend Dependencies**
   ```bash
   npm install
   ```

2. **Start the Frontend**
   ```bash
   npm run dev
   ```

3. **Access the Application**
   - Frontend: http://localhost:8080 (or the port shown in terminal)
   - Login with any of these demo accounts:
     - `admin@voltdealer.com` (Admin)
     - `manager1@voltdealer.com` (Manager)
     - `employee1@voltdealer.com` (Employee)

## 📊 Database Schema

The system includes the following main entities:

- **Users & Roles**: Admin, Manager, Employee accounts
- **Products**: Electronics inventory with detailed specifications
- **Categories & Subcategories**: Product organization
- **Suppliers**: Vendor management
- **Customers**: Customer information
- **Companies**: Business entity management
- **Countries**: Geographic data
- **Stock Transactions**: Inventory movements (purchase, sale, adjustment)
- **Sales**: Transaction records with payment details
- **Sale Items**: Individual items in each sale

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/users/{user_id}/roles` - Get user roles

### Data Retrieval
- `GET /api/categories` - Get all categories
- `GET /api/subcategories` - Get all subcategories
- `GET /api/countries` - Get all countries
- `GET /api/suppliers` - Get all suppliers
- `GET /api/customers` - Get all customers
- `GET /api/companies` - Get all companies
- `GET /api/products` - Get all products
- `GET /api/sales` - Get all sales
- `GET /api/stock-transactions` - Get all stock transactions
- `GET /api/sales/{sale_id}/items` - Get sale items
- `GET /api/dashboard/stats` - Get dashboard statistics

### Data Creation
- `POST /api/stock-transactions` - Create stock transaction (with automatic stock update)
- `POST /api/sales` - Create sale
- `POST /api/sales/items` - Create sale item (with automatic stock reduction)

### Data Deletion
- `DELETE /api/stock-transactions/{id}` - Delete stock transaction (with automatic stock reversal)

## 🎯 Key Features

### Real-time Stock Management
- **Stock Transactions**: Opening stock, purchases, sales, adjustments
- **Automatic Updates**: Stock quantities update automatically with transactions
- **Stock Validation**: Prevents overselling with real-time stock checks

### Sales Management
- **POS System**: Complete point-of-sale functionality
- **Payment Methods**: Cash, bKash, UPay, Visa, Bank Transfer
- **EMI Support**: Installment payment options for eligible products
- **Customer Management**: Customer information and purchase history

### Inventory Management
- **Product Catalog**: Comprehensive product database with specifications
- **Category Management**: Hierarchical product organization
- **Supplier Management**: Vendor information and payment terms
- **Low Stock Alerts**: Automatic notifications for reorder levels

### Reporting & Analytics
- **Dashboard**: Real-time business metrics
- **Sales Reports**: Revenue and transaction analysis
- **Inventory Reports**: Stock levels and movement tracking
- **Low Stock Reports**: Products needing reorder

## 🔄 Stock Transaction Types

### Stock In
- `purchase` - Goods purchased from suppliers
- `sales_return` - Items returned by customers
- `opening_stock` - Initial stock levels
- `transfer_in` - Stock received from other locations
- `stock_adjustment_in` - Stock level adjustments (increase)
- `misc_receive` - Miscellaneous incoming stock

### Stock Out
- `sales` - Goods sold to customers
- `supplier_return` - Items returned to suppliers
- `production_out` - Stock consumed for production
- `purchase_return` - Returned purchased items
- `stock_adjustment_out` - Stock level adjustments (decrease)
- `transfer_out` - Stock sent to other locations
- `misc_issue` - Miscellaneous stock issues

## 🛠️ Development

### Project Structure
```
volt-dealer-suite/
├── backend/
│   ├── main.py              # FastAPI application
│   └── seed_data.py         # Database seeding script
├── src/                     # React frontend
├── requirements.txt         # Python dependencies
├── start_backend.sh         # Linux/macOS startup script
├── start_backend.bat        # Windows startup script
└── README.md               # This file
```

### Adding New Features

1. **Backend**: Add new models, endpoints in `backend/main.py`
2. **Frontend**: Update API client in `src/integrations/api/client.ts`
3. **Database**: Run `python backend/seed_data.py` to update sample data

### Database Migrations

The system uses SQLAlchemy with automatic table creation. For production, consider using Alembic for proper migrations.

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Check database credentials in `.env`
   - Verify database `volt_dealer_suite` exists

2. **Port Already in Use**
   - Backend: Change port in `uvicorn` command
   - Frontend: Vite will automatically find available port

3. **Python Dependencies**
   - Ensure Python 3.8+ is installed
   - Use virtual environment: `python -m venv venv`

4. **Frontend API Errors**
   - Check backend is running on port 8000
   - Verify API_BASE_URL in frontend environment

### Getting Help

- Check API documentation at http://localhost:8000/docs
- Review console logs for detailed error messages
- Ensure all prerequisites are properly installed

## 📈 Performance Notes

- **Database**: Uses connection pooling for optimal performance
- **API**: FastAPI provides automatic API documentation and validation
- **Frontend**: React with Vite for fast development and building
- **Real-time**: Stock updates happen immediately with each transaction

## 🔒 Security Considerations

- **Authentication**: Basic email-based login (extend for production)
- **Authorization**: Role-based access control (admin, manager, employee)
- **Data Validation**: Pydantic models ensure data integrity
- **SQL Injection**: SQLAlchemy ORM prevents SQL injection attacks

For production deployment, consider:
- JWT token authentication
- HTTPS encryption
- Database connection encryption
- Input sanitization
- Rate limiting
- CORS configuration
