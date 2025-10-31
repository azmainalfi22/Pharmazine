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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Download,
  Calendar,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/integrations/api/client';
import { exportTrialBalance, exportExpenseReport } from '@/utils/excelExporter';

interface Transaction {
  id: string;
  date: string;
  type: string;
  account: string;
  debit: number;
  credit: number;
  balance: number;
  description?: string;
}

interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  description?: string;
  recorded_by: string;
}

interface TrialBalanceItem {
  account: string;
  debit: number;
  credit: number;
}

interface ProfitLossData {
  revenue: {
    sales: number;
    other: number;
    total: number;
  };
  cogs: number;
  gross_profit: number;
  expenses: {
    [key: string]: number;
    total: number;
  };
  net_profit: number;
}

const FinancePage = () => {
  const { user } = useAuth();
  const isAdmin = user?.roles.some(role => role.role === 'admin');

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [trialBalance, setTrialBalance] = useState<TrialBalanceItem[]>([]);
  const [profitLoss, setProfitLoss] = useState<ProfitLossData | null>(null);
  const [loading, setLoading] = useState(true);

  // Date filters
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Add expense dialog
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseAmount, setExpenseAmount] = useState(0);
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (isAdmin) {
      fetchFinancialData();
    }
  }, [isAdmin, startDate, endDate]);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const [txns, exps, tb, pl] = await Promise.all([
        apiClient.getTransactions(),
        apiClient.getExpenses(),
        apiClient.getTrialBalance(startDate, endDate),
        apiClient.getProfitLoss(startDate, endDate),
      ]);
      setTransactions(txns);
      setExpenses(exps);
      setTrialBalance(tb);
      setProfitLoss(pl);
    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast.error('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async () => {
    if (!expenseCategory || expenseAmount <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    try {
      const expenseData = {
        date: expenseDate,
        category: expenseCategory,
        amount: expenseAmount,
        description: expenseDescription,
        recorded_by: user.id,
      };

      await apiClient.createExpense(expenseData);
      toast.success('Expense recorded successfully!');
      setIsExpenseDialogOpen(false);
      resetExpenseForm();
      fetchFinancialData();
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense');
    }
  };

  const resetExpenseForm = () => {
    setExpenseCategory('');
    setExpenseAmount(0);
    setExpenseDescription('');
    setExpenseDate(new Date().toISOString().split('T')[0]);
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
          <p className="text-muted-foreground">
            Only administrators can access the finance module.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading financial data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 p-8 rounded-2xl border-2 border-teal-200/20 shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-2">Finance & Accounting</h1>
            <p className="text-white/90 text-base">View financial reports and manage expenses</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all border-0">
                  <Plus className="h-4 w-4" />
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Record Expense</DialogTitle>
                  <DialogDescription>
                    Add a new business expense
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rent">Rent</SelectItem>
                        <SelectItem value="utilities">Utilities</SelectItem>
                        <SelectItem value="salaries">Salaries</SelectItem>
                        <SelectItem value="supplies">Office Supplies</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="transport">Transport</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
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
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      placeholder="What was this expense for?"
                      value={expenseDescription}
                      onChange={(e) => setExpenseDescription(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleAddExpense} 
                      className="flex-1 bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all border-0 disabled:opacity-50" 
                      disabled={!expenseCategory || expenseAmount <= 0}
                    >
                      Add Expense
                    </Button>
                    <Button variant="outline" onClick={() => setIsExpenseDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Date Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Date Range Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={fetchFinancialData} className="w-full">
                Apply Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary Cards */}
      {profitLoss && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">${profitLoss.revenue.total.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Sales + Other Income</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">COGS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">${profitLoss.cogs.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Cost of Goods Sold</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">${profitLoss.expenses.total.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Operating Expenses</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${profitLoss.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${profitLoss.net_profit.toFixed(2)}
              </div>
              <div className="flex items-center gap-1 mt-1">
                {profitLoss.net_profit >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
                <p className="text-xs text-muted-foreground">
                  {((profitLoss.net_profit / profitLoss.revenue.total) * 100).toFixed(1)}% margin
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs for different reports */}
      <Tabs defaultValue="profitloss" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profitloss">Profit & Loss</TabsTrigger>
          <TabsTrigger value="trialbalance">Trial Balance</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="profitloss">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Profit & Loss Statement</CardTitle>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {profitLoss ? (
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Revenue</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Sales Revenue</span>
                        <span>${profitLoss.revenue.sales.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Other Income</span>
                        <span>${profitLoss.revenue.other.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold pt-2 border-t">
                        <span>Total Revenue</span>
                        <span>${profitLoss.revenue.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Cost of Goods Sold</h3>
                    <div className="flex justify-between text-sm">
                      <span>COGS</span>
                      <span className="text-red-600">-${profitLoss.cogs.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 bg-green-50">
                    <div className="flex justify-between font-semibold">
                      <span>Gross Profit</span>
                      <span className="text-green-600">${profitLoss.gross_profit.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Operating Expenses</h3>
                    <div className="space-y-1 text-sm">
                      {Object.entries(profitLoss.expenses).map(([key, value]) => {
                        if (key === 'total') return null;
                        return (
                          <div key={key} className="flex justify-between">
                            <span className="capitalize">{key}</span>
                            <span className="text-red-600">-${value.toFixed(2)}</span>
                          </div>
                        );
                      })}
                      <div className="flex justify-between font-semibold pt-2 border-t">
                        <span>Total Expenses</span>
                        <span className="text-red-600">-${profitLoss.expenses.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`border rounded-lg p-4 ${profitLoss.net_profit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Net Profit</span>
                      <span className={profitLoss.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ${profitLoss.net_profit.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No data available for the selected period
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trialbalance">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Trial Balance</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => {
                    exportTrialBalance(trialBalance);
                    toast.success('Trial Balance exported to Excel');
                  }}
                >
                  <Download className="h-4 w-4" />
                  Export Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {trialBalance.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trialBalance.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.account}</TableCell>
                        <TableCell className="text-right">${item.debit.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${item.credit.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold bg-muted">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right">
                        ${trialBalance.reduce((sum, item) => sum + item.debit, 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        ${trialBalance.reduce((sum, item) => sum + item.credit, 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No trial balance data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle>Expense List</CardTitle>
            </CardHeader>
            <CardContent>
              {expenses.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Recorded By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{expense.category}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{expense.description || '-'}</TableCell>
                        <TableCell className="text-right font-semibold text-red-600">
                          ${expense.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-sm">{expense.recorded_by}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No expenses recorded yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Ledger</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((txn) => (
                      <TableRow key={txn.id}>
                        <TableCell>{new Date(txn.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{txn.type}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{txn.account}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{txn.description || '-'}</TableCell>
                        <TableCell className="text-right">{txn.debit > 0 ? `$${txn.debit.toFixed(2)}` : '-'}</TableCell>
                        <TableCell className="text-right">{txn.credit > 0 ? `$${txn.credit.toFixed(2)}` : '-'}</TableCell>
                        <TableCell className="text-right font-semibold">${txn.balance.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No transactions recorded yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancePage;


