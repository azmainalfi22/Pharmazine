# Pharmazine

A comprehensive pharmacy management system with advanced inventory control, POS, and business management features. Built with React, TypeScript, and PostgreSQL.

## Features

- **User Management**: Role-based access control (Admin, Manager, Employee)
- **Product Management**: Detailed product specifications with categories and subcategories
- **Inventory Tracking**: Real-time stock management with transaction history
- **Sales Management**: Complete sales workflow with EMI support
- **Customer & Supplier Management**: Comprehensive contact management
- **Reports & Analytics**: Business insights and reporting
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: shadcn/ui, Tailwind CSS
- **Database**: PostgreSQL
- **State Management**: React Context API
- **Routing**: React Router DOM
- **Forms**: React Hook Form with Zod validation

## Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Pharmazine
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up PostgreSQL database**

   **For Windows:**
   ```bash
   setup_postgresql.bat
   ```

   **For macOS/Linux:**
   ```bash
   chmod +x setup_postgresql.sh
   ./setup_postgresql.sh
   ```

   **Manual setup:**
   ```bash
   # Create database
   createdb pharmazine
   
   # Run the setup script
   psql -d pharmazine -f database_setup.sql
   
   # Create environment file
   cp env.example .env.local
   # Edit .env.local with your database credentials
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## Login Credentials

The system comes with pre-configured user accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@pharmazine.com | admin123 |
| Manager | manager@pharmazine.com | manager123 |
| Employee | employee@pharmazine.com | employee123 |

## Database Schema

The system includes the following main entities:

- **Users & Roles**: User management with role-based permissions
- **Products**: Detailed product catalog with specifications
- **Categories & Subcategories**: Product classification system
- **Suppliers & Customers**: Business partner management
- **Sales & Sales Items**: Transaction management with EMI support
- **Stock Transactions**: Complete inventory movement tracking
- **Countries**: Reference data for product origins

## Sample Data

The database includes comprehensive sample data:

- **6 user accounts** with different roles
- **8 product categories** and **12 subcategories**
- **6 suppliers** and **8 customers**
- **10 sample products** including smartphones, laptops, LED bulbs, fans, and air conditioners
- **5 sample sales transactions** with different payment methods
- **Stock transactions** and inventory data

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── inventory/      # Inventory-specific components
│   └── setup/          # Setup and configuration components
├── contexts/           # React contexts (Auth, etc.)
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
│   └── postgresql/     # PostgreSQL client and types
├── lib/                # Utility functions
├── pages/              # Page components
└── main.tsx           # Application entry point
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# PostgreSQL Database Configuration
DATABASE_URL=postgresql://postgres:pharmazine123@localhost:5432/pharmazine
VITE_DATABASE_HOST=localhost
VITE_DATABASE_PORT=5432
VITE_DATABASE_NAME=pharmazine
VITE_DATABASE_USER=postgres
VITE_DATABASE_PASSWORD=pharmazine123

# Application Configuration
VITE_APP_NAME=Pharmazine
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=development
VITE_DEBUG=true
```

## Features Overview

### Dashboard
- Overview of key metrics
- Recent sales and inventory alerts
- Quick access to common tasks

### Inventory Management
- Product catalog with detailed specifications
- Stock level monitoring
- Low stock alerts
- Stock transaction history

### Sales Management
- Complete sales workflow
- EMI (Equated Monthly Installment) support
- Multiple payment methods
- Sales reporting

### User Management
- Role-based access control
- User profile management
- Permission management

### Setup & Configuration
- Category and subcategory management
- Supplier and customer management
- Country reference data
- System configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is private.

## Support

For support and questions, please open an issue in the repository.

---

**Pharmazine** - Professional pharmacy management system with comprehensive business solutions.
