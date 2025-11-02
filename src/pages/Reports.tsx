import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiClient } from '@/integrations/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileDown, FileSpreadsheet, FileText, Calendar, Package, ShoppingCart, TrendingUp, AlertTriangle, BarChart3, PieChart, LineChart, ChevronRight, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const Reports = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Determine active view based on current path
  const getActiveView = () => {
    if (location.pathname === '/reports') {
      // Redirect to inventory report if accessing main reports page
      navigate('/reports/inventory', { replace: true });
      return 'inventory';
    }
    if (location.pathname.startsWith('/reports/')) {
      return location.pathname.split('/')[2] || 'inventory';
    }
    return 'inventory';
  };

  const [activeView, setActiveView] = useState<string>(getActiveView());

  useEffect(() => {
    setActiveView(getActiveView());
  }, [location.pathname]);

  const reportTypes = [
    { value: 'inventory', label: 'Inventory Report', description: 'Complete inventory overview with stock levels', icon: Package, hasChevron: true },
    { value: 'sales', label: 'Sales Report', description: 'Sales performance and revenue analysis', icon: ShoppingCart, hasChevron: true },
    { value: 'stock-movement', label: 'Stock Movement Report', description: 'Track all stock in and out transactions', icon: TrendingUp, hasChevron: true },
    { value: 'low-stock', label: 'Low Stock Alert Report', description: 'Products below minimum stock levels', icon: AlertTriangle, hasChevron: true },
    { value: 'profit-loss', label: 'Profit & Loss Report', description: 'Financial performance analysis', icon: BarChart3, hasChevron: false },
    { value: 'category-analysis', label: 'Category Analysis', description: 'Performance by product categories', icon: PieChart, hasChevron: false },
    { value: 'trend-analysis', label: 'Trend Analysis', description: 'Sales and inventory trends over time', icon: LineChart, hasChevron: false },
  ];

  const generateReport = async () => {
    setLoading(true);
    try {
      let data;
      
      switch (activeView) {
        case 'inventory':
          data = await apiClient.getProducts();
          break;
          
        case 'sales':
          data = await apiClient.getSales();
          break;
          
        case 'stock-movement':
          data = await apiClient.getStockTransactions();
          break;
          
        case 'low-stock':
          const products = await apiClient.getProducts();
          data = products.filter(p => p.stock_quantity <= (p.min_stock_level || 0));
          break;
          
        case 'profit-loss':
          data = await apiClient.getSales();
          break;
          
        case 'category-analysis':
          data = await apiClient.getCategories();
          break;
          
        case 'trend-analysis':
          data = await apiClient.getSales();
          break;
          
        default:
          data = [];
      }
      
      setReportData(data || []);
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (reportData.length === 0) {
      toast.error('No data to export');
      return;
    }
    
    const headers = Object.keys(reportData[0]);
    const rows = reportData.map(row => 
      headers.map(header => row[header] || '').join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeView}-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast.success('Report exported successfully');
  };

  const exportToPDF = () => {
    toast.info('Use browser print (Ctrl+P) to export as PDF');
  };

  return (
    <div className="space-y-6">

      {/* Content Area */}
      <div className="space-y-6">
        {/* Individual Report Content */}
        <div className="space-y-6">
          {(() => {
            const reportType = reportTypes.find(type => type.value === activeView);
            if (!reportType) return null;
            
            const IconComponent = reportType.icon;
            
            return (
              <>
                <Card className="shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/20 dark:to-emerald-950/20">
                    <CardTitle className="text-xl font-bold">Report Filters</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endDate">End Date</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={generateReport} 
                        disabled={loading}
                        className="bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all border-0"
                      >
                        {loading ? 'Generating...' : 'Generate Report'}
                      </Button>
                      <Button variant="outline" onClick={exportToCSV}>
                        <FileDown className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                      <Button variant="outline" onClick={exportToPDF}>
                        <FileText className="h-4 w-4 mr-2" />
                        Export PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Report Data Display */}
                {reportData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{reportType.label} Data</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {Object.keys(reportData[0] || {}).map((key) => (
                                <TableHead key={key} className="capitalize">
                                  {key.replace(/_/g, ' ')}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {reportData.map((row, index) => (
                              <TableRow key={index}>
                                {Object.values(row).map((value, cellIndex) => (
                                  <TableCell key={cellIndex}>
                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default Reports;