import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CategorySetup } from '@/components/setup/CategorySetup';
import { SubcategorySetup } from '@/components/setup/SubcategorySetup';
import { CountrySetup } from '@/components/setup/CountrySetup';
import { CustomerSetup } from '@/components/setup/CustomerSetup';
import { SupplierSetup } from '@/components/setup/SupplierSetup';
// import { CompanySetup } from '@/components/setup/CompanySetup';

const Setup = () => {
  const location = useLocation();
  
  // Determine active view based on current path
  const getActiveView = () => {
    if (location.pathname === '/setup/subcategories') return 'subcategories';
    if (location.pathname === '/setup/countries') return 'countries';
    if (location.pathname === '/setup/customers') return 'customers';
    if (location.pathname === '/setup/suppliers') return 'suppliers';
    if (location.pathname === '/setup/companies') return 'companies';
    return 'categories';
  };
  
  const [activeView, setActiveView] = useState<'categories' | 'subcategories' | 'countries' | 'customers' | 'suppliers' | 'companies'>(getActiveView());

  useEffect(() => {
    setActiveView(getActiveView());
  }, [location.pathname]);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 p-8 rounded-2xl border-2 border-teal-200/20 shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="relative">
          <CardTitle className="text-3xl font-bold text-white drop-shadow-lg mb-2">Master Data Setup</CardTitle>
          <p className="text-white/90 text-base">
            Configure categories, subcategories, countries, customers, suppliers, and company information
          </p>
        </div>
      </div>

      {/* Content Area */}
      <div className="space-y-6">
        {/* Categories Content */}
        {activeView === 'categories' && <CategorySetup />}

        {/* Subcategories Content */}
        {activeView === 'subcategories' && <SubcategorySetup />}

        {/* Countries Content */}
        {activeView === 'countries' && <CountrySetup />}

        {/* Customers Content */}
        {activeView === 'customers' && <CustomerSetup />}

        {/* Suppliers Content */}
        {activeView === 'suppliers' && <SupplierSetup />}

        {/* Companies Content */}
        {activeView === 'companies' && (
          <div className="text-center py-12 text-muted-foreground">
            Company settings are available in Settings → Company tab
          </div>
        )}
      </div>
    </div>
  );
};

export default Setup;
