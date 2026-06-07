import { ReactNode, useState } from "react";
import NotificationBell from "./NotificationBell";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
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
  FolderTree,
  Layers,
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
  FileText,
  DollarSign,
  Pill,
  Stethoscope,
  Briefcase,
  Bell,
  Database,
  MessageSquare,
  Heart,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const { currency, setCurrency } = useCurrency();
  const { lang, setLang, t } = useLanguage();
  // Auto-expand the sidebar section that contains the current route.
  const [expandedMenus, setExpandedMenus] = useState<string[]>(() => {
    const p = location.pathname;
    if (p.startsWith("/sales")) return ["sales"];
    if (p.startsWith("/inventory")) return ["inventory"];
    if (p.startsWith("/purchase") || p.startsWith("/procurement") || p.startsWith("/setup/suppliers")) return ["purchase"];
    if (p.startsWith("/medicine-management")) return ["medicine-management"];
    if (
      p.startsWith("/pharmacy-care") || p.startsWith("/prescriptions") ||
      p.startsWith("/drug-interactions") || p.startsWith("/refill-reminders") ||
      p.startsWith("/allergy-management") || p.startsWith("/insurance-claims") ||
      p.startsWith("/patients") || p.startsWith("/patient-history")
    ) return ["pharmacy-care"];
    if (p.startsWith("/reports")) return ["reports"];
    if (p.startsWith("/payments")) return ["payments"];
    if (p.startsWith("/multi-branch") || p.startsWith("/branch")) return ["multi-branch"];
    if (
      (p.startsWith("/setup") && !p.startsWith("/setup/suppliers")) ||
      p.startsWith("/settings") || p.startsWith("/import") || p.startsWith("/audit-logs")
    ) return ["setup"];
    return [];
  });

  const isAdmin = (user?.roles || []).some((r) =>
    r.role === "admin" || r.role === "super_admin"
  );

  const navItems = [
    { path: "/", label: t("nav.dashboard"), icon: LayoutDashboard },
    {
      path: "/sales",
      label: t("nav.pos"),
      icon: ShoppingCart,
      submenu: [
        { path: "/sales", label: t("nav.newSale"), icon: CreditCard },
        { path: "/sales/history", label: t("nav.salesHistory"), icon: Receipt },
        {
          path: "/inventory/stock-in/sales-return",
          label: t("nav.customerReturns"),
          icon: RotateCcw,
        },
      ],
    },
    {
      path: "/inventory",
      label: t("nav.inventory"),
      icon: Package,
      submenu: [
        { path: "/inventory", label: t("nav.products"), icon: Package },
        {
          path: "/inventory/movements",
          label: t("nav.stockMovements"),
          icon: ArrowRightLeft,
        },
        {
          path: "/inventory/low-stock",
          label: t("nav.lowStockAlerts"),
          icon: AlertTriangle,
        },
        {
          path: "/inventory/analytics",
          label: t("nav.abcAnalysis"),
          icon: BarChart3,
        },
        {
          path: "/inventory/auto-reorder",
          label: t("nav.autoReorder"),
          icon: TrendingUp,
        },
        {
          path: "/inventory/stock-in/stock-adjustment",
          label: t("nav.physicalCount"),
          icon: Settings,
        },
      ],
    },
    {
      path: "/purchase",
      label: t("nav.purchasesSuppliers"),
      icon: ShoppingBag,
      submenu: [
        { path: "/setup/suppliers", label: t("nav.manageSuppliers"), icon: Truck },
        { path: "/purchase", label: t("nav.purchaseOrders"), icon: ShoppingCart },
        { path: "/procurement/module", label: t("nav.procurementModule"), icon: Briefcase },
        {
          path: "/inventory/stock-out/supplier-return",
          label: t("nav.returnToSupplier"),
          icon: RotateCcw,
        },
      ],
    },
    {
      path: "/medicine-management",
      label: t("nav.medicineManagement"),
      icon: Pill,
      submenu: [
        {
          path: "/medicine-management/statistics",
          label: t("nav.statisticsAnalytics"),
          icon: BarChart3,
        },
        {
          path: "/medicine-management/categories",
          label: t("nav.dosageForms"),
          icon: FolderTree,
        },
        {
          path: "/medicine-management/types",
          label: t("nav.medicineTypes"),
          icon: Layers,
        },
        {
          path: "/medicine-management/units",
          label: t("nav.unitTypes"),
          icon: Package2,
        },
        {
          path: "/medicine-management/manufacturers",
          label: t("nav.manufacturers"),
          icon: Building2,
        },
        {
          path: "/medicine-management/batches",
          label: t("nav.batchTracking"),
          icon: Package,
        },
        {
          path: "/medicine-management/expiry-alerts",
          label: t("nav.expiryAlerts"),
          icon: AlertTriangle,
        },
        {
          path: "/medicine-management/waste",
          label: t("nav.wasteDamaged"),
          icon: AlertTriangle,
        },
        {
          path: "/medicine-management/transactions",
          label: t("nav.batchTransactions"),
          icon: ArrowRightLeft,
        },
        {
          path: "/medicine-management/barcode",
          label: t("nav.barcodeGenerator"),
          icon: Package2,
        },
        {
          path: "/medicine-management/discounts",
          label: t("nav.discountsPricing"),
          icon: DollarSign,
        },
      ],
    },
    { path: "/customers", label: t("nav.customers"), icon: Users },
    {
      path: "/pharmacy-care",
      label: t("nav.pharmacyCare"),
      icon: Heart,
      submenu: [
        { path: "/patients/crm", label: t("nav.patients"), icon: Users },
        { path: "/patient-history", label: t("nav.patientHistory"), icon: FileText },
        { path: "/prescriptions", label: t("nav.prescriptionMgmt"), icon: FileText },
        { path: "/drug-interactions", label: t("nav.drugInteractions"), icon: Shield },
        { path: "/refill-reminders", label: t("nav.refillReminders"), icon: Bell },
        { path: "/allergy-management", label: t("nav.allergyMgmt"), icon: AlertTriangle },
        { path: "/insurance-claims", label: t("nav.insuranceClaims"), icon: CreditCard },
      ],
    },
    { path: "/messages", label: t("nav.internalMessages"), icon: MessageSquare },
    {
      path: "/reports",
      label: t("nav.reports"),
      icon: BarChart3,
      submenu: [
        { path: "/reports/bi-dashboard", label: t("nav.biAnalytics"), icon: BarChart3 },
        { path: "/reports/medicine", label: t("nav.medicineReport"), icon: Pill },
        { path: "/reports/sales", label: t("nav.salesReport"), icon: ShoppingCart },
        { path: "/reports/stock", label: t("nav.stockReport"), icon: Package },
        {
          path: "/reports/financial",
          label: t("nav.financialReport"),
          icon: DollarSign,
        },
        { path: "/reports/customer", label: t("nav.customerReport"), icon: Users },
        {
          path: "/reports/purchase",
          label: t("nav.purchaseReport"),
          icon: TrendingUp,
        },
      ],
    },
    {
      path: "/payments",
      label: t("nav.paymentsFinance"),
      icon: DollarSign,
      submenu: [
        {
          path: "/payments/dashboard",
          label: t("nav.financialDashboard"),
          icon: BarChart3,
        },
        {
          path: "/payments/collection",
          label: t("nav.paymentCollection"),
          icon: CreditCard,
        },
        { path: "/payments/vouchers", label: t("nav.vouchers"), icon: FileText },
        {
          path: "/payments/receivables",
          label: t("nav.accountsReceivable"),
          icon: TrendingUp,
        },
        {
          path: "/payments/payables",
          label: t("nav.accountsPayable"),
          icon: TrendingUp,
        },
        { path: "/payments/cashflow", label: t("nav.cashFlow"), icon: DollarSign },
      ],
    },
    // Optional Modules
    { path: "/services", label: t("nav.servicesAppointments"), icon: Stethoscope },
    { path: "/crm", label: t("nav.crmLoyalty"), icon: TrendingUp },
    // Admin-only sections
    ...(isAdmin
      ? [{ path: "/hrm", label: t("nav.hrPayroll"), icon: Briefcase }]
      : []),
    ...(isAdmin
      ? [{ path: "/users", label: t("nav.users"), icon: Users }]
      : []),
    ...(isAdmin
      ? [
          {
            path: "/multi-branch",
            label: t("nav.multiBranch"),
            icon: Building2,
            submenu: [
              { path: "/multi-branch", label: t("nav.multiBranch"), icon: Building2 },
              { path: "/multi-branch/dashboard", label: t("nav.multiBranchDashboard"), icon: BarChart3 },
              { path: "/branch/transfers", label: t("nav.interBranchTransfers"), icon: ArrowRightLeft },
            ],
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            path: "/setup",
            label: t("nav.systemSetup"),
            icon: Settings,
            submenu: [
              { path: "/setup", label: t("nav.productCategories"), icon: FolderTree },
              {
                path: "/inventory/stock-in/opening-stock",
                label: t("nav.openingStock"),
                icon: Warehouse,
              },
              {
                path: "/setup/companies",
                label: t("nav.companyInfo"),
                icon: Building2,
              },
              {
                path: "/settings/system",
                label: t("nav.system"),
                icon: Settings,
              },
              {
                path: "/settings/security",
                label: t("nav.security"),
                icon: Shield,
              },
              {
                path: "/settings/notifications",
                label: t("nav.notifications"),
                icon: Bell,
              },
              { path: "/settings/backups", label: t("nav.backups"), icon: Database },
              {
                path: "/settings/performance",
                label: t("nav.performance"),
                icon: TrendingUp,
              },
              { path: "/import", label: t("nav.importData"), icon: ArrowDownCircle },
              { path: "/audit-logs", label: t("nav.auditLogs"), icon: FileText },
            ],
          },
        ]
      : []),
  ];

  const toggleSubmenu = (menuKey: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuKey)
        ? prev.filter((key) => key !== menuKey)
        : [...prev, menuKey]
    );
  };

  return (
    <div className="bg-background h-screen overflow-hidden relative">
      {/* Glassmorphic Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-emerald-50/30 to-primary/10 dark:from-primary/10 dark:via-emerald-950/20 dark:to-primary/5 pointer-events-none"></div>
      <div className="fixed top-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-20 animate-pulse pointer-events-none"></div>
      <div
        className="fixed bottom-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl opacity-20 animate-pulse pointer-events-none"
        style={{ animationDelay: "2s" }}
      ></div>

      {/* Glassmorphic Sidebar */}
      <aside className="fixed left-0 top-0 z-50 h-screen w-72 backdrop-blur-2xl bg-white/70 dark:bg-gray-900/70 shadow-2xl">
        {/* Glassmorphic overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-white/30 to-white/20 dark:from-gray-900/50 dark:via-gray-900/30 dark:to-gray-900/20 pointer-events-none"></div>

        <div className="relative flex h-full flex-col">
          {/* Logo - Glassmorphic Header */}
          <div className="px-5 py-5 border-b border-white/20 dark:border-gray-700/30 backdrop-blur-xl">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-primary/10 to-emerald-500/10 backdrop-blur-sm border border-white/40 dark:border-gray-700/40 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="relative">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary via-primary to-emerald-600 shadow-lg flex items-center justify-center ring-2 ring-white/50 dark:ring-primary/30 transition-transform hover:scale-105">
                  <svg
                    className="h-7 w-7 text-white drop-shadow-lg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                  </svg>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 shadow-lg">
                  <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75"></span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold bg-gradient-to-r from-primary via-primary to-emerald-600 bg-clip-text text-transparent tracking-tight leading-tight">
                  Pharmazine
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
              const isActive =
                location.pathname === item.path ||
                (item.submenu &&
                  item.submenu.some(
                    (sub) =>
                      location.pathname === sub.path ||
                      (sub.submenu &&
                        sub.submenu.some(
                          (subSub) => location.pathname === subSub.path
                        ))
                  ));
              const isExpanded = expandedMenus.includes(
                item.path.replace(/^\//, "")
              );

              return (
                <div key={item.path}>
                  {item.submenu ? (
                    <div>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start gap-2.5 transition-all duration-300 font-semibold text-sm px-3.5 py-2.5 rounded-xl group",
                          isActive
                            ? "bg-gradient-to-r from-primary/20 via-emerald-500/15 to-primary/20 backdrop-blur-xl text-primary shadow-lg border border-white/40 dark:border-gray-700/50"
                            : "hover:bg-white/60 dark:hover:bg-gray-800/60 backdrop-blur-sm text-gray-700 dark:text-gray-200 hover:text-primary hover:shadow-md border border-transparent hover:border-white/30"
                        )}
                        onClick={() =>
                          toggleSubmenu(item.path.replace(/^\//, ""))
                        }
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4 flex-shrink-0 transition-all duration-300",
                            isActive
                              ? "text-primary scale-110"
                              : "group-hover:scale-110"
                          )}
                        />
                        <span className="truncate flex-1 text-left text-[13px]">
                          {item.label}
                        </span>
                        {isExpanded ? (
                          <ChevronDown
                            className={cn(
                              "h-3.5 w-3.5 ml-auto flex-shrink-0 transition-all duration-300",
                              isActive && "text-primary"
                            )}
                          />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 ml-auto flex-shrink-0 opacity-40 group-hover:opacity-70 transition-all" />
                        )}
                      </Button>

                      {isExpanded && (
                        <div className="ml-3 mt-1.5 space-y-0.5 border-l-2 border-primary/30 dark:border-primary/20 pl-3">
                          {item.submenu.map((subItem) => {
                            const SubIcon = subItem.icon;
                            const isSubActive =
                              location.pathname === subItem.path ||
                              (subItem.submenu &&
                                subItem.submenu.some(
                                  (sub) => location.pathname === sub.path
                                ));
                            const isSubExpanded = expandedMenus.includes(
                              subItem.path.replace(/^\//, "")
                            );

                            // Check if this submenu item has its own submenu
                            if (subItem.submenu) {
                              return (
                                <div key={subItem.path}>
                                  <Button
                                    variant="ghost"
                                    className={cn(
                                      "w-full justify-start gap-2 transition-all duration-300 text-[12px] font-medium px-3 py-2 rounded-lg group",
                                      isSubActive
                                        ? "bg-primary/15 backdrop-blur-md text-primary shadow-md border border-white/30 dark:border-gray-700/40"
                                        : "hover:bg-white/50 dark:hover:bg-gray-800/50 backdrop-blur-sm text-gray-600 dark:text-gray-300 hover:text-primary"
                                    )}
                                    onClick={() =>
                                      toggleSubmenu(
                                        subItem.path.replace(/^\//, "")
                                      )
                                    }
                                  >
                                    <SubIcon
                                      className={cn(
                                        "h-3.5 w-3.5 flex-shrink-0 transition-all",
                                        isSubActive
                                          ? "text-primary scale-105"
                                          : "group-hover:scale-105"
                                      )}
                                    />
                                    <span className="truncate flex-1 text-left">
                                      {subItem.label}
                                    </span>
                                    {isSubExpanded ? (
                                      <ChevronDown
                                        className={cn(
                                          "h-3 w-3 ml-auto flex-shrink-0 transition-all",
                                          isSubActive && "text-primary"
                                        )}
                                      />
                                    ) : (
                                      <ChevronRight className="h-3 w-3 ml-auto flex-shrink-0 opacity-40 group-hover:opacity-60 transition-all" />
                                    )}
                                  </Button>

                                  {isSubExpanded && (
                                    <div className="ml-2.5 mt-1 space-y-0.5 border-l border-primary/20 dark:border-primary/15 pl-2.5">
                                      {subItem.submenu.map((subSubItem) => {
                                        const SubSubIcon = subSubItem.icon;
                                        const isSubSubActive =
                                          location.pathname === subSubItem.path;

                                        return (
                                          <Link
                                            key={subSubItem.path}
                                            to={subSubItem.path}
                                          >
                                            <Button
                                              variant="ghost"
                                              className={cn(
                                                "w-full justify-start gap-2 transition-all duration-300 text-[11px] px-2.5 py-1.5 min-h-[32px] rounded-lg group",
                                                isSubSubActive
                                                  ? "bg-primary/12 backdrop-blur-sm text-primary shadow-sm border border-white/25 dark:border-gray-700/30"
                                                  : "hover:bg-white/40 dark:hover:bg-gray-800/40 text-gray-600 dark:text-gray-400 hover:text-primary"
                                              )}
                                            >
                                              <SubSubIcon
                                                className={cn(
                                                  "h-3 w-3 flex-shrink-0 transition-all",
                                                  isSubSubActive
                                                    ? "text-primary"
                                                    : "group-hover:scale-105"
                                                )}
                                              />
                                              <span className="truncate text-left flex-1">
                                                {subSubItem.label}
                                              </span>
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
                                    "w-full justify-start gap-2 transition-all duration-300 text-[12px] font-medium px-3 py-2 rounded-lg group",
                                    isSubActive
                                      ? "bg-primary/15 backdrop-blur-md text-primary shadow-md border border-white/30 dark:border-gray-700/40"
                                      : "hover:bg-white/50 dark:hover:bg-gray-800/50 backdrop-blur-sm text-gray-600 dark:text-gray-300 hover:text-primary"
                                  )}
                                >
                                  <SubIcon
                                    className={cn(
                                      "h-3.5 w-3.5 flex-shrink-0 transition-all",
                                      isSubActive
                                        ? "text-primary scale-105"
                                        : "group-hover:scale-105"
                                    )}
                                  />
                                  <span className="truncate flex-1 text-left">
                                    {subItem.label}
                                  </span>
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
                          "w-full justify-start gap-2.5 transition-all duration-300 font-semibold text-sm px-3.5 py-2.5 rounded-xl group",
                          isActive
                            ? "bg-gradient-to-r from-primary/20 via-emerald-500/15 to-primary/20 backdrop-blur-xl text-primary shadow-lg border border-white/40 dark:border-gray-700/50"
                            : "hover:bg-white/60 dark:hover:bg-gray-800/60 backdrop-blur-sm text-gray-700 dark:text-gray-200 hover:text-primary hover:shadow-md border border-transparent hover:border-white/30"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4 flex-shrink-0 transition-all duration-300",
                            isActive
                              ? "text-primary scale-110"
                              : "group-hover:scale-110"
                          )}
                        />
                        <span className="truncate flex-1 text-left">
                          {item.label}
                        </span>
                      </Button>
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Glassmorphic User Profile & Logout */}
          <div className="p-4 border-t border-white/20 dark:border-gray-700/30 backdrop-blur-xl">
            <div className="mb-2 flex justify-end items-center gap-1.5 px-1">
              {/* Currency toggle */}
              <button
                onClick={() => setCurrency(currency === "BDT" ? "USD" : "BDT")}
                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white/60 dark:bg-gray-700/60 border border-white/40 dark:border-gray-600/40 hover:bg-primary/10 transition-colors text-primary"
                title="Toggle currency"
              >
                {currency === "BDT" ? "৳ BDT" : "$ USD"}
              </button>
              {/* Language toggle */}
              <button
                onClick={() => setLang(lang === "en" ? "bn" : "en")}
                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white/60 dark:bg-gray-700/60 border border-white/40 dark:border-gray-600/40 hover:bg-primary/10 transition-colors text-primary"
                title="Toggle language"
              >
                {lang === "en" ? "EN" : "বাংলা"}
              </button>
              <NotificationBell />
            </div>
            <div className="mb-3 p-3 rounded-xl bg-gradient-to-br from-white/60 to-white/30 dark:from-gray-800/60 dark:to-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-700/40 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary via-primary to-emerald-600 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white/50 dark:ring-primary/30">
                    {user?.full_name
                      ? user.full_name.charAt(0).toUpperCase()
                      : user?.email?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-800 dark:text-gray-100 truncate leading-tight">
                    {user?.full_name || user?.email || "User"}
                  </p>
                  <p className="text-[10px] font-semibold text-primary/80 uppercase tracking-wide truncate">
                    {(user?.roles || []).map((r) => r.role).join(", ") ||
                      "Role"}
                  </p>
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
        <div
          className="container mx-auto h-full"
          style={{
            overflowY: "auto",
            scrollbarWidth: "thin",
            msOverflowStyle: "none",
          }}
        >
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
