import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, DollarSign, CreditCard, Clock, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/integrations/api/client';
import { exportPaymentReport } from '@/utils/excelExporter';

interface SalePayment {
  id: string;
  sale_id: string;
  payment_type: string;
  amount: number;
  status: string;
  recorded_by: string;
  recorded_at: string;
  cleared_by?: string;
  cleared_at?: string;
  reference?: string;
  notes?: string;
}

interface Sale {
  id: string;
  invoice_no: string;
  customer_name?: string;
  total_amount: number;
  created_at: string;
  payment_status?: string;
}

const PaymentsPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.roles.some(role => role.role === 'admin');

  const [payments, setPayments] = useState<SalePayment[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  // Record payment dialog
  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState('');
  const [paymentType, setPaymentType] = useState<'cash' | 'card' | 'online'>('cash');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  useEffect(() => {
    fetchPayments();
    fetchSales();
  }, []);

  const fetchPayments = async () => {
    try {
      const data = await apiClient.getSalePayments();
      setPayments(data);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchSales = async () => {
    try {
      const data = await apiClient.getSales();
      setSales(data);
    } catch (error) {
      console.error('Error fetching sales:', error);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedSale) {
      toast.error('Please select a sale');
      return;
    }
    if (paymentAmount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    try {
      const paymentData = {
        payment_type: paymentType,
        amount: paymentAmount,
        recorded_by: user.id,
        reference: paymentReference,
        notes: paymentNotes,
      };

      await apiClient.recordSalePayment(selectedSale, paymentData);
      toast.success('Payment recorded successfully!');
      setIsRecordDialogOpen(false);
      resetRecordForm();
      fetchPayments();
      fetchSales();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    }
  };

  const handleClearPayment = async (paymentId: string) => {
    if (!isAdmin) {
      toast.error('Only admins can clear payments');
      return;
    }
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    try {
      await apiClient.clearPayment(paymentId, user.id);
      toast.success('Payment cleared successfully!');
      fetchPayments();
    } catch (error) {
      console.error('Error clearing payment:', error);
      toast.error('Failed to clear payment');
    }
  };

  const resetRecordForm = () => {
    setSelectedSale('');
    setPaymentType('cash');
    setPaymentAmount(0);
    setPaymentReference('');
    setPaymentNotes('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'cleared':
        return <Badge variant="outline" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" /> Cleared</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentTypeBadge = (type: string) => {
    switch (type) {
      case 'cash':
        return <Badge variant="outline" className="bg-green-50"><DollarSign className="h-3 w-3 mr-1" /> Cash</Badge>;
      case 'card':
        return <Badge variant="outline" className="bg-blue-50"><CreditCard className="h-3 w-3 mr-1" /> Card</Badge>;
      case 'online':
        return <Badge variant="outline" className="bg-purple-50"><CreditCard className="h-3 w-3 mr-1" /> Online</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const pendingPayments = payments.filter(p => p.status === 'pending');
  const clearedPayments = payments.filter(p => p.status === 'cleared');

  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalCleared = clearedPayments.reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading payments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 p-8 rounded-2xl border-2 border-teal-200/20 shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-2">Payment Management</h1>
            <p className="text-white/90 text-base">Manage pending and cleared payments</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
              onClick={() => {
                exportPaymentReport(payments);
                toast.success('Payment report exported to Excel');
              }}
            >
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
          <Dialog open={isRecordDialogOpen} onOpenChange={setIsRecordDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all border-0">
                <DollarSign className="h-4 w-4" />
                Record Payment
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record Sale Payment</DialogTitle>
              <DialogDescription>
                Record a payment for a sale (Cash/Card/Online)
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Sale</Label>
                <Select value={selectedSale} onValueChange={setSelectedSale}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a sale..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sales.map(sale => (
                      <SelectItem key={sale.id} value={sale.id}>
                        Invoice: {sale.invoice_no} - ${sale.total_amount.toFixed(2)} ({sale.customer_name || 'Walk-in'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Payment Type</Label>
                <Select value={paymentType} onValueChange={(val) => setPaymentType(val as 'cash' | 'card' | 'online')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="online">Online Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label>Reference (Optional)</Label>
                <Input
                  placeholder="e.g., Check #, Transaction ID..."
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Input
                  placeholder="Any additional notes..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleRecordPayment} className="flex-1" disabled={!selectedSale || paymentAmount <= 0}>
                  Record Payment
                </Button>
                <Button variant="outline" onClick={() => setIsRecordDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">${totalPending.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">{pendingPayments.length} payment(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Cleared</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalCleared.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">{clearedPayments.length} payment(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Received</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalPending + totalCleared).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">{payments.length} payment(s)</p>
          </CardContent>
        </Card>
      </div>

      {/* Payments Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingPayments.length})
          </TabsTrigger>
          <TabsTrigger value="cleared" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Cleared ({clearedPayments.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All ({payments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending payments
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Sale ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Recorded By</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{new Date(payment.recorded_at).toLocaleDateString()}</TableCell>
                        <TableCell className="font-mono text-xs">{payment.sale_id.substring(0, 8)}...</TableCell>
                        <TableCell>{getPaymentTypeBadge(payment.payment_type)}</TableCell>
                        <TableCell className="font-semibold">${payment.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{payment.reference || '-'}</TableCell>
                        <TableCell className="text-sm">{payment.recorded_by}</TableCell>
                        <TableCell className="text-right">
                          {isAdmin && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleClearPayment(payment.id)}
                              className="gap-1"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Clear
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cleared">
          <Card>
            <CardHeader>
              <CardTitle>Cleared Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {clearedPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No cleared payments yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date Recorded</TableHead>
                      <TableHead>Date Cleared</TableHead>
                      <TableHead>Sale ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Cleared By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clearedPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{new Date(payment.recorded_at).toLocaleDateString()}</TableCell>
                        <TableCell>{payment.cleared_at ? new Date(payment.cleared_at).toLocaleDateString() : '-'}</TableCell>
                        <TableCell className="font-mono text-xs">{payment.sale_id.substring(0, 8)}...</TableCell>
                        <TableCell>{getPaymentTypeBadge(payment.payment_type)}</TableCell>
                        <TableCell className="font-semibold text-green-600">${payment.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-sm">{payment.cleared_by || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No payments recorded yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Sale ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{new Date(payment.recorded_at).toLocaleDateString()}</TableCell>
                        <TableCell className="font-mono text-xs">{payment.sale_id.substring(0, 8)}...</TableCell>
                        <TableCell>{getPaymentTypeBadge(payment.payment_type)}</TableCell>
                        <TableCell className="font-semibold">${payment.amount.toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{payment.reference || '-'}</TableCell>
                        <TableCell className="text-right">
                          {isAdmin && payment.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleClearPayment(payment.id)}
                              className="gap-1"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Clear
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentsPage;


