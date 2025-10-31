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
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['inventory', 'inventory/stock-in', 'inventory/stock-out']);

  const isAdmin = (user?.roles || []).some(r => r.role === 'admin');

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
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
            { path: '/inventory/stock-in/transfer-in', label: 'Transfer from Other Store', icon: ArrowRightLeft },
            { path: '/inventory/stock-in/stock-adjustment', label: 'Stock Adjustment', icon: Settings },
            { path: '/inventory/stock-in/misc-receive', label: 'Misc/Others Receive', icon: Package2 },
          ]
        },
        { 
          path: '/inventory/stock-out', 
          label: 'Stock OUT', 
          icon: ArrowUpCircle,
          submenu: [
            { path: '/inventory/stock-out/sales', label: 'Sales', icon: ShoppingCart },
            { path: '/inventory/stock-out/supplier-return', label: 'Supplier Return', icon: RotateCcw },
            { path: '/inventory/stock-out/production-out', label: 'Production Out/Consume', icon: Package },
            { path: '/inventory/stock-out/purchase-return', label: 'Purchase Return', icon: ArrowRightLeft },
            { path: '/inventory/stock-out/stock-adjustment', label: 'Stock Adjustment', icon: Settings },
            { path: '/inventory/stock-out/transfer-out', label: 'Transfer to Other Store', icon: ArrowRightLeft },
            { path: '/inventory/stock-out/misc-issue', label: 'Misc/Others Issue', icon: Package2 },
          ]
        },
      ]
    },
    { 
      path: '/sales', 
      label: 'POS / Sales', 
      icon: ShoppingCart,
      submenu: [
        { path: '/sales', label: 'POS Terminal', icon: CreditCard },
        { path: '/sales/history', label: 'Sales History', icon: Receipt },
      ]
    },
    { path: '/purchase', label: 'Purchases & GRN', icon: ShoppingBag },
    { path: '/requisitions', label: 'Requisitions', icon: FileText },
    { path: '/payments', label: 'Payments', icon: CreditCard },
    { 
      path: '/reports', 
      label: 'Reports', 
      icon: FileText,
      submenu: [
        { path: '/reports/inventory', label: 'Inventory Report', icon: Package },
        { path: '/reports/sales', label: 'Sales Report', icon: ShoppingCart },
        { path: '/reports/stock-movement', label: 'Stock Movement Report', icon: TrendingUp },
        { path: '/reports/low-stock', label: 'Low Stock Alert Report', icon: AlertTriangle },
        { path: '/reports/profit-loss', label: 'Profit & Loss Report', icon: BarChart3 },
        { path: '/reports/category-analysis', label: 'Category Analysis', icon: PieChart },
        { path: '/reports/trend-analysis', label: 'Trend Analysis', icon: LineChart },
      ]
    },
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
    <div className="bg-background h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-80 border-r-2 border-teal-100 dark:border-teal-900 bg-gradient-to-b from-card via-card to-muted/20 shadow-2xl backdrop-blur-sm">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center gap-3 border-b-2 border-teal-200/50 dark:border-teal-800/50 px-6 py-6 bg-gradient-to-br from-teal-50 via-emerald-50 to-teal-50 dark:from-teal-950/40 dark:via-emerald-950/40 dark:to-teal-950/40">
            <div className="relative">
              <img 
                src="/logo-icon.svg" 
                alt="Sharkar Logo" 
                className="h-14 w-14 drop-shadow-lg"
              />
              <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white dark:border-teal-950 animate-pulse shadow-lg"></div>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-teal-800 dark:text-teal-100 tracking-tight leading-tight truncate">Sharkar Feed & Medicine</h1>
              <p className="text-xs text-teal-600 dark:text-teal-400 font-medium mt-0.5">Pharmacy & Animal Feed</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1.5 p-5 overflow-y-auto scrollbar-thin scrollbar-thumb-teal-200 dark:scrollbar-thumb-teal-800 scrollbar-track-transparent">
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
                          'w-full justify-start gap-3 transition-all duration-200 font-medium px-4 py-3 rounded-xl',
                          isActive 
                            ? 'bg-gradient-to-r from-teal-500/20 via-emerald-500/15 to-teal-500/20 text-teal-700 dark:text-teal-300 shadow-md hover:shadow-lg border border-teal-200/50 dark:border-teal-800/50' 
                            : 'hover:bg-teal-50/50 dark:hover:bg-teal-950/30 text-foreground hover:text-teal-700 dark:hover:text-teal-300'
                        )}
                        onClick={() => toggleSubmenu(item.path.replace(/^\//, ''))}
                      >
                        <Icon className={cn('h-5 w-5 flex-shrink-0 transition-transform', isActive && 'text-teal-600 dark:text-teal-400')} />
                        <span className="truncate flex-1 text-left">{item.label}</span>
                        {isExpanded ? (
                          <ChevronDown className={cn('h-4 w-4 ml-auto flex-shrink-0 transition-transform', isActive && 'text-teal-600 dark:text-teal-400')} />
                        ) : (
                          <ChevronRight className="h-4 w-4 ml-auto flex-shrink-0 opacity-50" />
                        )}
                      </Button>
                      
                      {isExpanded && (
                        <div className="ml-4 mt-2 space-y-1 border-l-2 border-teal-200/50 dark:border-teal-800/50 pl-4">
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
                                      'w-full justify-start gap-2.5 transition-all duration-200 text-sm font-medium px-3 py-2.5 rounded-lg',
                                      isSubActive 
                                        ? 'bg-teal-100/70 dark:bg-teal-900/40 text-teal-800 dark:text-teal-200 shadow-sm border border-teal-200/30 dark:border-teal-800/30' 
                                        : 'hover:bg-teal-50/50 dark:hover:bg-teal-950/20 text-foreground hover:text-teal-700 dark:hover:text-teal-300'
                                    )}
                                    onClick={() => toggleSubmenu(subItem.path.replace(/^\//, ''))}
                                  >
                                    <SubIcon className={cn('h-4 w-4 flex-shrink-0', isSubActive && 'text-teal-600 dark:text-teal-400')} />
                                    <span className="truncate flex-1 text-left">{subItem.label}</span>
                                    {isSubExpanded ? (
                                      <ChevronDown className={cn('h-3 w-3 ml-auto flex-shrink-0', isSubActive && 'text-teal-600 dark:text-teal-400')} />
                                    ) : (
                                      <ChevronRight className="h-3 w-3 ml-auto flex-shrink-0 opacity-50" />
                                    )}
                                  </Button>
                                  
                                  {isSubExpanded && (
                                    <div className="ml-6 mt-1.5 space-y-1 border-l-2 border-teal-200/30 dark:border-teal-800/30 pl-3">
                                      {subItem.submenu.map((subSubItem) => {
                                        const SubSubIcon = subSubItem.icon;
                                        const isSubSubActive = location.pathname === subSubItem.path;
                                        
                                        return (
                                          <Link key={subSubItem.path} to={subSubItem.path}>
                                            <Button
                                              variant="ghost"
                                              className={cn(
                                                'w-full justify-start gap-2.5 transition-all duration-200 text-xs px-3 py-2 min-h-[36px] rounded-md',
                                                isSubSubActive 
                                                  ? 'bg-teal-100/60 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200 shadow-sm border border-teal-200/20 dark:border-teal-800/20' 
                                                  : 'hover:bg-teal-50/40 dark:hover:bg-teal-950/15 text-foreground hover:text-teal-700 dark:hover:text-teal-300'
                                              )}
                                            >
                                              <SubSubIcon className={cn('h-3.5 w-3.5 flex-shrink-0', isSubSubActive && 'text-teal-600 dark:text-teal-400')} />
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
                                    'w-full justify-start gap-2.5 transition-all duration-200 text-sm font-medium px-3 py-2.5 rounded-lg',
                                    isSubActive 
                                      ? 'bg-teal-100/70 dark:bg-teal-900/40 text-teal-800 dark:text-teal-200 shadow-sm border border-teal-200/30 dark:border-teal-800/30' 
                                      : 'hover:bg-teal-50/50 dark:hover:bg-teal-950/20 text-foreground hover:text-teal-700 dark:hover:text-teal-300'
                                  )}
                                >
                                  <SubIcon className={cn('h-4 w-4 flex-shrink-0', isSubActive && 'text-teal-600 dark:text-teal-400')} />
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
                          'w-full justify-start gap-3 transition-all duration-200 font-medium px-4 py-3 rounded-xl',
                          isActive 
                            ? 'bg-gradient-to-r from-teal-500/20 via-emerald-500/15 to-teal-500/20 text-teal-700 dark:text-teal-300 shadow-md hover:shadow-lg border border-teal-200/50 dark:border-teal-800/50' 
                            : 'hover:bg-teal-50/50 dark:hover:bg-teal-950/30 text-foreground hover:text-teal-700 dark:hover:text-teal-300'
                        )}
                      >
                        <Icon className={cn('h-5 w-5 flex-shrink-0 transition-transform', isActive && 'text-teal-600 dark:text-teal-400')} />
                        <span className="truncate flex-1 text-left">{item.label}</span>
                      </Button>
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>

          {/* User info & logout */}
          <div className="border-t-2 border-teal-200/50 dark:border-teal-800/50 p-5 space-y-3 bg-gradient-to-t from-muted/40 to-transparent">
            <div className="px-4 py-3 bg-gradient-to-br from-card to-card/80 rounded-xl shadow-md border border-teal-100/50 dark:border-teal-900/50 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-white dark:ring-teal-950">
                  {user?.full_name ? user.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{user?.full_name || user?.email || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate">{(user?.roles || []).map(r => r.role).join(', ') || 'Role'}</p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all duration-200 rounded-xl border-2"
              onClick={signOut}
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Sign Out</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="pl-80 h-screen overflow-hidden">
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
