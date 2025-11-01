import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings, 
  LogOut,
  ShoppingBag,
  ChevronDown,
  ChevronRight,
  ArrowDownCircle,
  ArrowUpCircle,
  FolderTree,
  Layers,
  Globe,
  Truck,
  Building2,
  CreditCard,
  Receipt,
  RotateCcw,
  Warehouse,
  ArrowRightLeft,
  Package2,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  PieChart,
  LineChart,
  FileText,
  DollarSign,
  Pill,
  Stethoscope,
  Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['medicine-management', 'inventory', 'inventory/stock-in', 'inventory/stock-out']);

  const isAdmin = (user?.roles || []).some(r => r.role === 'admin');

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { 
      path: '/sales', 
      label: 'POS & Sales', 
      icon: ShoppingCart,
      submenu: [
        { path: '/sales', label: 'Point of Sale', icon: ShoppingCart },
        { path: '/sales/history', label: 'Sales History', icon: FileText },
      ]
    },
    { 
      path: '/medicine-management', 
      label: 'Medicines', 
      icon: Pill,
      submenu: [
        { path: '/medicine-management', label: 'Overview', icon: LayoutDashboard },
        { path: '/medicine-management/categories', label: 'Categories', icon: FolderTree },
        { path: '/medicine-management/manufacturers', label: 'Manufacturers', icon: Building2 },
        { path: '/medicine-management/batches', label: 'Batches', icon: Package },
        { path: '/medicine-management/expiry-alerts', label: 'Expiry Alerts', icon: AlertTriangle },
      ]
    },
    { 
      path: '/inventory', 
      label: 'Inventory', 
      icon: Package,
      submenu: [
        { path: '/inventory', label: 'Product Overview', icon: Package },
        { 
          path: '/inventory/stock-in', 
          label: 'Stock IN', 
          icon: ArrowDownCircle,
          submenu: [
            { path: '/inventory/stock-in/purchase', label: 'Purchase', icon: ShoppingCart },
            { path: '/inventory/stock-in/sales-return', label: 'Sales Return', icon: RotateCcw },
            { path: '/inventory/stock-in/opening-stock', label: 'Opening Stock', icon: Warehouse },
            { path: '/inventory/stock-in/transfer-in', label: 'Transfer In', icon: ArrowRightLeft },
            { path: '/inventory/stock-in/stock-adjustment', label: 'Adjustment', icon: Settings },
            { path: '/inventory/stock-in/misc-receive', label: 'Misc Receive', icon: Package2 },
          ]
        },
        { 
          path: '/inventory/stock-out', 
          label: 'Stock OUT', 
          icon: ArrowUpCircle,
          submenu: [
            { path: '/inventory/stock-out/sales', label: 'Sales', icon: ShoppingCart },
            { path: '/inventory/stock-out/supplier-return', label: 'Supplier Return', icon: RotateCcw },
            { path: '/inventory/stock-out/production-out', label: 'Production Out', icon: Package },
            { path: '/inventory/stock-out/purchase-return', label: 'Purchase Return', icon: ArrowRightLeft },
            { path: '/inventory/stock-out/stock-adjustment', label: 'Adjustment', icon: Settings },
            { path: '/inventory/stock-out/transfer-out', label: 'Transfer Out', icon: ArrowRightLeft },
            { path: '/inventory/stock-out/misc-issue', label: 'Misc Issue', icon: Package2 },
          ]
        },
      ]
    },
    { 
      path: '/sales', 
      label: 'POS & Sales', 
      icon: ShoppingCart,
      submenu: [
        { path: '/sales', label: 'POS Terminal', icon: CreditCard },
        { path: '/sales/history', label: 'Sales History', icon: Receipt },
      ]
    },
    { path: '/purchase', label: 'Purchases', icon: ShoppingBag },
    { path: '/returns', label: 'Returns & Waste', icon: RotateCcw },
    { path: '/customers', label: 'Customers', icon: Users },
    { path: '/requisitions', label: 'Requisitions', icon: FileText },
    { path: '/payments', label: 'Payments', icon: CreditCard },
    { 
      path: '/reports', 
      label: 'Reports', 
      icon: BarChart3,
      submenu: [
        { path: '/reports', label: 'Overview', icon: BarChart3 },
        { path: '/reports/sales', label: 'Sales Reports', icon: ShoppingCart },
        { path: '/reports/stock', label: 'Stock Reports', icon: Package },
        { path: '/reports/financial', label: 'Financial Reports', icon: DollarSign },
        { path: '/reports/profit-loss', label: 'Profit & Loss', icon: TrendingUp },
      ]
    },
    { path: '/services', label: 'Services', icon: Stethoscope },
    { path: '/crm', label: 'CRM & Loyalty', icon: Users },
    { path: '/hrm', label: 'HR & Payroll', icon: Briefcase, roles: ['admin'] },
    // Admin-only sections
    ...(isAdmin ? [{ path: '/finance', label: 'Finance', icon: DollarSign }] : []),
    ...(isAdmin ? [{ path: '/import', label: 'Import Data', icon: ArrowDownCircle }] : []),
    ...(isAdmin ? [{ path: '/audit-logs', label: 'Audit Logs', icon: FileText }] : []),
    ...(isAdmin ? [{ path: '/users', label: 'Users', icon: Users }] : []),
    ...(isAdmin ? [{ 
      path: '/setup', 
      label: 'Setup', 
      icon: Settings,
      submenu: [
        { path: '/setup', label: 'Categories', icon: FolderTree },
        { path: '/setup/subcategories', label: 'Subcategories', icon: Layers },
        { path: '/setup/countries', label: 'Countries', icon: Globe },
        { path: '/setup/customers', label: 'Customers', icon: Users },
        { path: '/setup/suppliers', label: 'Suppliers', icon: Truck },
        { path: '/setup/companies', label: 'Companies', icon: Building2 },
      ]
    }] : []),
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const toggleSubmenu = (menuKey: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuKey) 
        ? prev.filter(key => key !== menuKey)
        : [...prev, menuKey]
    );
  };

  return (
    <div className="bg-background h-screen overflow-hidden relative">
      {/* Glassmorphic Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-emerald-50/30 to-primary/10 dark:from-primary/10 dark:via-emerald-950/20 dark:to-primary/5 pointer-events-none"></div>
      <div className="fixed top-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-20 animate-pulse pointer-events-none"></div>
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl opacity-20 animate-pulse pointer-events-none" style={{ animationDelay: '2s' }}></div>
      
      {/* Glassmorphic Sidebar */}
      <aside className="fixed left-0 top-0 z-50 h-screen w-72 backdrop-blur-2xl bg-white/70 dark:bg-gray-900/70 border-r border-white/20 dark:border-gray-700/30 shadow-2xl">
        {/* Glassmorphic overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-white/30 to-white/20 dark:from-gray-900/50 dark:via-gray-900/30 dark:to-gray-900/20 pointer-events-none"></div>
        
        <div className="relative flex h-full flex-col">
          {/* Logo - Glassmorphic Header */}
          <div className="px-5 py-5 border-b border-white/20 dark:border-gray-700/30 backdrop-blur-xl">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-primary/10 to-emerald-500/10 backdrop-blur-sm border border-white/40 dark:border-gray-700/40 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="relative">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary via-primary to-emerald-600 shadow-lg flex items-center justify-center ring-2 ring-white/50 dark:ring-primary/30 transition-transform hover:scale-105">
                  <svg className="h-7 w-7 text-white drop-shadow-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                    <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                  </svg>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 shadow-lg">
                  <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75"></span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold bg-gradient-to-r from-primary via-primary to-emerald-600 bg-clip-text text-transparent tracking-tight leading-tight">
                  Sharkar Pharmacy
                </h1>
                <p className="text-[10px] font-semibold text-primary/80 dark:text-primary/70 uppercase tracking-wider">
                  Pharmacy Management
                </p>
              </div>
            </div>
          </div>

          {/* Navigation - Glassmorphic */}
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto glass-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                (item.submenu && item.submenu.some(sub => 
                  location.pathname === sub.path || 
                  (sub.submenu && sub.submenu.some(subSub => location.pathname === subSub.path))
                ));
              const isExpanded = expandedMenus.includes(item.path.replace(/^\//, ''));
              
              return (
                <div key={item.path}>
                  {item.submenu ? (
                    <div>
                      <Button
                        variant="ghost"
                        className={cn(
                          'w-full justify-start gap-2.5 transition-all duration-300 font-semibold text-sm px-3.5 py-2.5 rounded-xl group',
                          isActive 
                            ? 'bg-gradient-to-r from-primary/20 via-emerald-500/15 to-primary/20 backdrop-blur-xl text-primary shadow-lg border border-white/40 dark:border-gray-700/50' 
                            : 'hover:bg-white/60 dark:hover:bg-gray-800/60 backdrop-blur-sm text-gray-700 dark:text-gray-200 hover:text-primary hover:shadow-md border border-transparent hover:border-white/30'
                        )}
                        onClick={() => toggleSubmenu(item.path.replace(/^\//, ''))}
                      >
                        <Icon className={cn('h-4 w-4 flex-shrink-0 transition-all duration-300', isActive ? 'text-primary scale-110' : 'group-hover:scale-110')} />
                        <span className="truncate flex-1 text-left text-[13px]">{item.label}</span>
                        {isExpanded ? (
                          <ChevronDown className={cn('h-3.5 w-3.5 ml-auto flex-shrink-0 transition-all duration-300', isActive && 'text-primary')} />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 ml-auto flex-shrink-0 opacity-40 group-hover:opacity-70 transition-all" />
                        )}
                      </Button>
                      
                      {isExpanded && (
                        <div className="ml-3 mt-1.5 space-y-0.5 border-l-2 border-primary/30 dark:border-primary/20 pl-3">
                          {item.submenu.map((subItem) => {
                            const SubIcon = subItem.icon;
                            const isSubActive = location.pathname === subItem.path || 
                              (subItem.submenu && subItem.submenu.some(sub => location.pathname === sub.path));
                            const isSubExpanded = expandedMenus.includes(subItem.path.replace(/^\//, ''));
                            
                            // Check if this submenu item has its own submenu
                            if (subItem.submenu) {
                              return (
                                <div key={subItem.path}>
                                  <Button
                                    variant="ghost"
                                    className={cn(
                                      'w-full justify-start gap-2 transition-all duration-300 text-[12px] font-medium px-3 py-2 rounded-lg group',
                                      isSubActive 
                                        ? 'bg-primary/15 backdrop-blur-md text-primary shadow-md border border-white/30 dark:border-gray-700/40' 
                                        : 'hover:bg-white/50 dark:hover:bg-gray-800/50 backdrop-blur-sm text-gray-600 dark:text-gray-300 hover:text-primary'
                                    )}
                                    onClick={() => toggleSubmenu(subItem.path.replace(/^\//, ''))}
                                  >
                                    <SubIcon className={cn('h-3.5 w-3.5 flex-shrink-0 transition-all', isSubActive ? 'text-primary scale-105' : 'group-hover:scale-105')} />
                                    <span className="truncate flex-1 text-left">{subItem.label}</span>
                                    {isSubExpanded ? (
                                      <ChevronDown className={cn('h-3 w-3 ml-auto flex-shrink-0 transition-all', isSubActive && 'text-primary')} />
                                    ) : (
                                      <ChevronRight className="h-3 w-3 ml-auto flex-shrink-0 opacity-40 group-hover:opacity-60 transition-all" />
                                    )}
                                  </Button>
                                  
                                  {isSubExpanded && (
                                    <div className="ml-2.5 mt-1 space-y-0.5 border-l border-primary/20 dark:border-primary/15 pl-2.5">
                                      {subItem.submenu.map((subSubItem) => {
                                        const SubSubIcon = subSubItem.icon;
                                        const isSubSubActive = location.pathname === subSubItem.path;
                                        
                                        return (
                                          <Link key={subSubItem.path} to={subSubItem.path}>
                                            <Button
                                              variant="ghost"
                                              className={cn(
                                                'w-full justify-start gap-2 transition-all duration-300 text-[11px] px-2.5 py-1.5 min-h-[32px] rounded-lg group',
                                                isSubSubActive 
                                                  ? 'bg-primary/12 backdrop-blur-sm text-primary shadow-sm border border-white/25 dark:border-gray-700/30' 
                                                  : 'hover:bg-white/40 dark:hover:bg-gray-800/40 text-gray-600 dark:text-gray-400 hover:text-primary'
                                              )}
                                            >
                                              <SubSubIcon className={cn('h-3 w-3 flex-shrink-0 transition-all', isSubSubActive ? 'text-primary' : 'group-hover:scale-105')} />
                                              <span className="truncate text-left flex-1">{subSubItem.label}</span>
                                            </Button>
                                          </Link>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            
                            // Regular submenu item without nested submenu
                            return (
                              <Link key={subItem.path} to={subItem.path}>
                                <Button
                                  variant="ghost"
                                  className={cn(
                                    'w-full justify-start gap-2 transition-all duration-300 text-[12px] font-medium px-3 py-2 rounded-lg group',
                                    isSubActive 
                                      ? 'bg-primary/15 backdrop-blur-md text-primary shadow-md border border-white/30 dark:border-gray-700/40' 
                                      : 'hover:bg-white/50 dark:hover:bg-gray-800/50 backdrop-blur-sm text-gray-600 dark:text-gray-300 hover:text-primary'
                                  )}
                                >
                                  <SubIcon className={cn('h-3.5 w-3.5 flex-shrink-0 transition-all', isSubActive ? 'text-primary scale-105' : 'group-hover:scale-105')} />
                                  <span className="truncate flex-1 text-left">{subItem.label}</span>
                                </Button>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link to={item.path}>
                      <Button
                        variant="ghost"
                        className={cn(
                          'w-full justify-start gap-2.5 transition-all duration-300 font-semibold text-sm px-3.5 py-2.5 rounded-xl group',
                          isActive 
                            ? 'bg-gradient-to-r from-primary/20 via-emerald-500/15 to-primary/20 backdrop-blur-xl text-primary shadow-lg border border-white/40 dark:border-gray-700/50' 
                            : 'hover:bg-white/60 dark:hover:bg-gray-800/60 backdrop-blur-sm text-gray-700 dark:text-gray-200 hover:text-primary hover:shadow-md border border-transparent hover:border-white/30'
                        )}
                      >
                        <Icon className={cn('h-4 w-4 flex-shrink-0 transition-all duration-300', isActive ? 'text-primary scale-110' : 'group-hover:scale-110')} />
                        <span className="truncate flex-1 text-left">{item.label}</span>
                      </Button>
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Glassmorphic User Profile & Logout */}
          <div className="p-4 border-t border-white/20 dark:border-gray-700/30 backdrop-blur-xl">
            <div className="mb-3 p-3 rounded-xl bg-gradient-to-br from-white/60 to-white/30 dark:from-gray-800/60 dark:to-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-700/40 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary via-primary to-emerald-600 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white/50 dark:ring-primary/30">
                    {user?.full_name ? user.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-800 dark:text-gray-100 truncate leading-tight">{user?.full_name || user?.email || 'User'}</p>
                  <p className="text-[10px] font-semibold text-primary/80 uppercase tracking-wide truncate">{(user?.roles || []).map(r => r.role).join(', ') || 'Role'}</p>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-500/10 text-gray-700 dark:text-gray-200 hover:text-red-600 dark:hover:text-red-400 border border-transparent hover:border-red-500/30 backdrop-blur-sm hover:shadow-md transition-all duration-300 group"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="pl-72 h-screen overflow-hidden relative">
        <div className="container mx-auto h-full" style={{overflowY: 'auto', scrollbarWidth: 'thin', msOverflowStyle: 'none'}}>
          <style>{`
            .container::-webkit-scrollbar { 
              width: 8px; 
            }
            .container::-webkit-scrollbar-track { 
              background: transparent; 
            }
            .container::-webkit-scrollbar-thumb { 
              background: hsl(var(--muted-foreground) / 0.3);
              border-radius: 4px;
            }
            .container::-webkit-scrollbar-thumb:hover { 
              background: hsl(var(--muted-foreground) / 0.5);
            }
          `}</style>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
