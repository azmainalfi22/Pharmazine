import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Receipt,
  FileText,
  Calendar,
  Download,
  Plus,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Building2
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import apiClient from '@/integrations/api/client';

// Types
interface FinancialDashboard {
  cash_in_hand: number;
  bank_balance: number;
  total_receivables: number;
  total_payables: number;
  today_revenue: number;
  today_expenses: number;
  week_revenue: number;
  month_revenue: number;
  profit_margin: number;
}

interface PaymentCollection {
  id: string;
  customer_name: string;
  invoice_no?: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  reference_no?: string;
  notes?: string;
  status: string;
  created_at: string;
}

interface Voucher {
  id: string;
  voucher_no: string;
  voucher_type: string;
  date: string;
  amount: number;
  description: string;
  status: string;
  created_by?: string;
  created_at: string;
}

interface Receivable {
  invoice_id: string;
  invoice_no: string;
  customer_name: string;
  invoice_date: string;
  amount: number;
  paid_amount: number;
  balance: number;
  status: string;
}

interface Payable {
  supplier_id: string;
  supplier_name: string;
  credit_limit: number;
  balance: number;
  status: string;
}

interface CashFlowItem {
  date: string;
  cash_in: number;
  cash_out: number;
  net_flow: number;
  transaction_count: number;
}

const PaymentsFinance = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.roles.some(role => role.role === 'admin');

  // Determine active tab based on URL
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'dashboard';
    if (path.includes('/collection')) return 'collection';
    if (path.includes('/vouchers')) return 'vouchers';
    if (path.includes('/receivables')) return 'receivables';
    if (path.includes('/payables')) return 'payables';
    if (path.includes('/cashflow')) return 'cashflow';
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(getActiveTab());
  const [loading, setLoading] = useState(false);

  // Dashboard state
  const [dashboard, setDashboard] = useState<FinancialDashboard | null>(null);

  // Payment collection state
  const [payments, setPayments] = useState<PaymentCollection[]>([]);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    customer_name: '',
    invoice_no: '',
    amount: 0,
    payment_method: 'cash',
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    reference_no: '',
    notes: ''
  });

  // Vouchers state
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [voucherDialog, setVoucherDialog] = useState(false);
  const [voucherForm, setVoucherForm] = useState({
    voucher_type: 'payment',
    amount: 0,
    description: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  // Receivables state
  const [receivables, setReceivables] = useState<Receivable[]>([]);

  // Payables state
  const [payables, setPayables] = useState<Payable[]>([]);

  // Cash flow state
  const [cashFlow, setCashFlow] = useState<CashFlowItem[]>([]);
  const [cashFlowSummary, setCashFlowSummary] = useState({
    opening_balance: 0,
    total_cash_in: 0,
    total_cash_out: 0,
    net_cash_flow: 0,
    closing_balance: 0
  });

  // Search states
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setActiveTab(getActiveTab());
  }, [location.pathname]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'dashboard':
          await loadDashboard();
          break;
        case 'collection':
          await loadPayments();
          break;
        case 'vouchers':
          await loadVouchers();
          break;
        case 'receivables':
          await loadReceivables();
          break;
        case 'payables':
          await loadPayables();
          break;
        case 'cashflow':
          await loadCashFlow();
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboard = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/finance/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDashboard(data);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  const loadPayments = async () => {
    try {
      const data = await apiClient.getSales();
      const paymentData = data.map((sale: any) => ({
        id: sale.id,
        customer_name: sale.customer_name || 'Walk-in Customer',
        invoice_no: sale.invoice_no,
        amount: parseFloat(sale.net_amount || 0),
        payment_method: sale.payment_method || 'cash',
        payment_date: sale.created_at,
        reference_no: sale.reference_no || '',
        notes: sale.notes || '',
        status: sale.payment_status || 'completed',
        created_at: sale.created_at
      }));
      setPayments(paymentData);
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  };

  const loadVouchers = async () => {
    try {
      // Load vouchers - for now using mock data
      setVouchers([
        {
          id: '1',
          voucher_no: 'V-001',
          voucher_type: 'payment',
          date: new Date().toISOString(),
          amount: 1000,
          description: 'Supplier payment',
          status: 'approved',
          created_at: new Date().toISOString()
        }
      ]);
    } catch (error) {
      console.error('Error loading vouchers:', error);
    }
  };

  const loadReceivables = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/finance/receivables', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setReceivables(data.receivables || []);
      }
    } catch (error) {
      console.error('Error loading receivables:', error);
    }
  };

  const loadPayables = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/finance/payables', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPayables(data.payables || []);
      }
    } catch (error) {
      console.error('Error loading payables:', error);
    }
  };

  const loadCashFlow = async () => {
    try {
      const [summaryRes, dailyRes] = await Promise.all([
        fetch('http://localhost:8000/api/finance/cashflow/summary', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('http://localhost:8000/api/finance/cashflow/daily', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (summaryRes.ok) {
        const summary = await summaryRes.json();
        setCashFlowSummary(summary);
      }

      if (dailyRes.ok) {
        const daily = await dailyRes.json();
        setCashFlow(daily.daily_flow || []);
      }
    } catch (error) {
      console.error('Error loading cash flow:', error);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const routes: Record<string, string> = {
      dashboard: '/payments/dashboard',
      collection: '/payments/collection',
      vouchers: '/payments/vouchers',
      receivables: '/payments/receivables',
      payables: '/payments/payables',
      cashflow: '/payments/cashflow'
    };
    navigate(routes[value] || '/payments');
  };

  const handleSavePayment = async () => {
    if (!paymentForm.customer_name || paymentForm.amount <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      toast.success('Payment collected successfully');
      setPaymentDialog(false);
      resetPaymentForm();
      loadPayments();
    } catch (error) {
      toast.error('Failed to save payment');
    }
  };

  const handleSaveVoucher = async () => {
    if (!voucherForm.description || voucherForm.amount <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      toast.success('Voucher created successfully');
      setVoucherDialog(false);
      resetVoucherForm();
      loadVouchers();
    } catch (error) {
      toast.error('Failed to create voucher');
    }
  };

  const resetPaymentForm = () => {
    setPaymentForm({
      customer_name: '',
      invoice_no: '',
      amount: 0,
      payment_method: 'cash',
      payment_date: format(new Date(), 'yyyy-MM-dd'),
      reference_no: '',
      notes: ''
    });
  };

  const resetVoucherForm = () => {
    setVoucherForm({
      voucher_type: 'payment',
      amount: 0,
      description: '',
      date: format(new Date(), 'yyyy-MM-dd')
    });
  };

  const filteredPayments = payments.filter(p =>
    p.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.invoice_no && p.invoice_no.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 rounded-2xl border-2 border-blue-200/20 shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="relative">
          <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-2 flex items-center gap-3">
            <DollarSign className="h-8 w-8" />
            Payments & Finance Management
          </h1>
          <p className="text-white/90 text-base">Comprehensive financial management and accounting</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="collection" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Collection
          </TabsTrigger>
          <TabsTrigger value="vouchers" className="gap-2">
            <FileText className="h-4 w-4" />
            Vouchers
          </TabsTrigger>
          <TabsTrigger value="receivables" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Receivables
          </TabsTrigger>
          <TabsTrigger value="payables" className="gap-2">
            <TrendingDown className="h-4 w-4" />
            Payables
          </TabsTrigger>
          <TabsTrigger value="cashflow" className="gap-2">
            <Wallet className="h-4 w-4" />
            Cash Flow
          </TabsTrigger>
        </TabsList>

        {/* Financial Dashboard Tab */}
        <TabsContent value="dashboard">
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">Loading dashboard...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="border-green-200 bg-green-50/50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Cash in Hand</p>
                          <p className="text-2xl font-bold text-green-600">
                            ${(dashboard?.cash_in_hand || 0).toFixed(2)}
                          </p>
                        </div>
                        <Wallet className="h-10 w-10 text-green-600 opacity-20" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-blue-200 bg-blue-50/50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Bank Balance</p>
                          <p className="text-2xl font-bold text-blue-600">
                            ${(dashboard?.bank_balance || 0).toFixed(2)}
                          </p>
                        </div>
                        <Building2 className="h-10 w-10 text-blue-600 opacity-20" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-orange-200 bg-orange-50/50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Receivables</p>
                          <p className="text-2xl font-bold text-orange-600">
                            ${(dashboard?.total_receivables || 0).toFixed(2)}
                          </p>
                        </div>
                        <ArrowUpRight className="h-10 w-10 text-orange-600 opacity-20" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-red-200 bg-red-50/50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Payables</p>
                          <p className="text-2xl font-bold text-red-600">
                            ${(dashboard?.total_payables || 0).toFixed(2)}
                          </p>
                        </div>
                        <ArrowDownRight className="h-10 w-10 text-red-600 opacity-20" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Today's Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">${(dashboard?.today_revenue || 0).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground mt-1">Expenses: ${(dashboard?.today_expenses || 0).toFixed(2)}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Week Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">${(dashboard?.week_revenue || 0).toFixed(2)}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Month Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">${(dashboard?.month_revenue || 0).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground mt-1">Profit Margin: {(dashboard?.profit_margin || 0).toFixed(1)}%</p>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* Payment Collection Tab */}
        <TabsContent value="collection">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Payment Collections
                  </CardTitle>
                  <CardDescription>Record and track customer payments</CardDescription>
                </div>
                <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Collect Payment
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Collect Payment</DialogTitle>
                      <DialogDescription>Record a new payment from customer</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Customer Name *</Label>
                        <Input
                          value={paymentForm.customer_name}
                          onChange={(e) => setPaymentForm({ ...paymentForm, customer_name: e.target.value })}
                          placeholder="Customer name"
                        />
                      </div>
                      <div>
                        <Label>Invoice Number</Label>
                        <Input
                          value={paymentForm.invoice_no}
                          onChange={(e) => setPaymentForm({ ...paymentForm, invoice_no: e.target.value })}
                          placeholder="INV-001"
                        />
                      </div>
                      <div>
                        <Label>Amount *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={paymentForm.amount}
                          onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label>Payment Method</Label>
                        <Select
                          value={paymentForm.payment_method}
                          onValueChange={(value) => setPaymentForm({ ...paymentForm, payment_method: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                            <SelectItem value="upi">UPI</SelectItem>
                            <SelectItem value="online">Online Transfer</SelectItem>
                            <SelectItem value="cheque">Cheque</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Payment Date</Label>
                        <Input
                          type="date"
                          value={paymentForm.payment_date}
                          onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Reference Number</Label>
                        <Input
                          value={paymentForm.reference_no}
                          onChange={(e) => setPaymentForm({ ...paymentForm, reference_no: e.target.value })}
                          placeholder="Transaction ID, Cheque No, etc."
                        />
                      </div>
                      <div>
                        <Label>Notes</Label>
                        <Textarea
                          value={paymentForm.notes}
                          onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                          placeholder="Additional notes..."
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setPaymentDialog(false)}>Cancel</Button>
                      <Button onClick={handleSavePayment}>Collect Payment</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by customer or invoice..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">Loading...</div>
              ) : filteredPayments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {searchTerm ? 'No payments found' : 'No payment collections yet'}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Invoice</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{format(new Date(payment.payment_date), 'dd MMM yyyy')}</TableCell>
                          <TableCell className="font-medium">{payment.customer_name}</TableCell>
                          <TableCell>
                            {payment.invoice_no ? (
                              <Badge variant="outline">{payment.invoice_no}</Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-right font-bold text-green-600">
                            ${payment.amount.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {payment.payment_method}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                              {payment.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                              {payment.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                              {payment.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vouchers Tab */}
        <TabsContent value="vouchers">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Vouchers
                  </CardTitle>
                  <CardDescription>Manage payment and receipt vouchers</CardDescription>
                </div>
                <Dialog open={voucherDialog} onOpenChange={setVoucherDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Voucher
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Voucher</DialogTitle>
                      <DialogDescription>Create a new payment or receipt voucher</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Voucher Type</Label>
                        <Select
                          value={voucherForm.voucher_type}
                          onValueChange={(value) => setVoucherForm({ ...voucherForm, voucher_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="payment">Payment Voucher</SelectItem>
                            <SelectItem value="receipt">Receipt Voucher</SelectItem>
                            <SelectItem value="journal">Journal Voucher</SelectItem>
                            <SelectItem value="contra">Contra Voucher</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Amount *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={voucherForm.amount}
                          onChange={(e) => setVoucherForm({ ...voucherForm, amount: parseFloat(e.target.value) || 0 })}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label>Date</Label>
                        <Input
                          type="date"
                          value={voucherForm.date}
                          onChange={(e) => setVoucherForm({ ...voucherForm, date: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Description *</Label>
                        <Textarea
                          value={voucherForm.description}
                          onChange={(e) => setVoucherForm({ ...voucherForm, description: e.target.value })}
                          placeholder="Voucher description..."
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setVoucherDialog(false)}>Cancel</Button>
                      <Button onClick={handleSaveVoucher}>Create Voucher</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">Loading...</div>
              ) : vouchers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No vouchers yet</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Voucher No</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vouchers.map((voucher) => (
                        <TableRow key={voucher.id}>
                          <TableCell className="font-mono">{voucher.voucher_no}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {voucher.voucher_type}
                            </Badge>
                          </TableCell>
                          <TableCell>{format(new Date(voucher.date), 'dd MMM yyyy')}</TableCell>
                          <TableCell className="text-right font-bold">${voucher.amount.toFixed(2)}</TableCell>
                          <TableCell className="max-w-xs truncate">{voucher.description}</TableCell>
                          <TableCell>
                            <Badge variant={voucher.status === 'approved' ? 'default' : 'secondary'}>
                              {voucher.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Accounts Receivable Tab */}
        <TabsContent value="receivables">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Accounts Receivable
              </CardTitle>
              <CardDescription>Track outstanding customer payments</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">Loading...</div>
              ) : receivables.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No outstanding receivables</div>
              ) : (
                <>
                  <div className="mb-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-sm text-muted-foreground">Total Outstanding</p>
                    <p className="text-2xl font-bold text-orange-600">
                      ${receivables.reduce((sum, r) => sum + r.balance, 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice No</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Paid</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {receivables.map((receivable) => (
                          <TableRow key={receivable.invoice_id}>
                            <TableCell className="font-mono">{receivable.invoice_no}</TableCell>
                            <TableCell>{receivable.customer_name}</TableCell>
                            <TableCell>{format(new Date(receivable.invoice_date), 'dd MMM yyyy')}</TableCell>
                            <TableCell className="text-right">${receivable.amount.toFixed(2)}</TableCell>
                            <TableCell className="text-right text-green-600">${receivable.paid_amount.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-bold text-orange-600">${receivable.balance.toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge variant={receivable.status === 'partial' ? 'secondary' : 'outline'}>
                                {receivable.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Accounts Payable Tab */}
        <TabsContent value="payables">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Accounts Payable
              </CardTitle>
              <CardDescription>Track outstanding supplier payments</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">Loading...</div>
              ) : payables.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No outstanding payables</div>
              ) : (
                <>
                  <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm text-muted-foreground">Total Outstanding</p>
                    <p className="text-2xl font-bold text-red-600">
                      ${payables.reduce((sum, p) => sum + p.balance, 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Supplier</TableHead>
                          <TableHead className="text-right">Credit Limit</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payables.map((payable) => (
                          <TableRow key={payable.supplier_id}>
                            <TableCell className="font-medium">{payable.supplier_name}</TableCell>
                            <TableCell className="text-right">${payable.credit_limit.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-bold text-red-600">${payable.balance.toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge variant={payable.status === 'exceeded' ? 'destructive' : 'default'}>
                                {payable.status === 'exceeded' && <AlertCircle className="w-3 h-3 mr-1" />}
                                {payable.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cash Flow Tab */}
        <TabsContent value="cashflow">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Opening Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold">${cashFlowSummary.opening_balance.toFixed(2)}</p>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Cash In</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold text-green-600">
                    +${cashFlowSummary.total_cash_in.toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-red-200 bg-red-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Cash Out</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold text-red-600">
                    -${cashFlowSummary.total_cash_out.toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Net Flow</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-xl font-bold ${cashFlowSummary.net_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {cashFlowSummary.net_cash_flow >= 0 ? '+' : ''}${cashFlowSummary.net_cash_flow.toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Closing Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold">${cashFlowSummary.closing_balance.toFixed(2)}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Daily Cash Flow</CardTitle>
                <CardDescription>Daily breakdown of cash inflows and outflows</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">Loading...</div>
                ) : cashFlow.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">No cash flow data available</div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Cash In</TableHead>
                          <TableHead className="text-right">Cash Out</TableHead>
                          <TableHead className="text-right">Net Flow</TableHead>
                          <TableHead className="text-right">Transactions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cashFlow.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{format(new Date(item.date), 'dd MMM yyyy')}</TableCell>
                            <TableCell className="text-right text-green-600">+${item.cash_in.toFixed(2)}</TableCell>
                            <TableCell className="text-right text-red-600">-${item.cash_out.toFixed(2)}</TableCell>
                            <TableCell className={`text-right font-bold ${item.net_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {item.net_flow >= 0 ? '+' : ''}${item.net_flow.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">{item.transaction_count}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentsFinance;
