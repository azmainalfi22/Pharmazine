import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/integrations/api/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  stock_quantity: number;
}

interface StockTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionType: string;
  transactionLabel: string;
  products: Product[];
  onSuccess: () => void;
}

const formSchema = z.object({
  product_id: z.string().min(1, 'Product is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  unit_price: z.coerce.number().min(0, 'Unit price must be non-negative').optional(),
  from_location: z.string().optional(),
  to_location: z.string().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

export const StockTransactionDialog = ({
  open,
  onOpenChange,
  transactionType,
  transactionLabel,
  products,
  onSuccess,
}: StockTransactionDialogProps) => {
  const [loading, setLoading] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      product_id: '',
      quantity: 1,
      unit_price: 0,
      from_location: '',
      to_location: '',
      reason: '',
      notes: '',
    },
  });

  const isStockIn = ['purchase', 'sales_return', 'opening_stock', 'transfer_in', 'stock_adjustment_in', 'misc_receive'].includes(transactionType);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      const product = products.find(p => p.id === values.product_id);
      if (!product) throw new Error('Product not found');

      // Calculate new stock quantity
      const quantityChange = isStockIn ? values.quantity : -values.quantity;
      const newStockQuantity = product.stock_quantity + quantityChange;

      if (newStockQuantity < 0) {
        throw new Error('Insufficient stock quantity');
      }

      // Create stock transaction via API
      await apiClient.createStockTransaction({
        product_id: values.product_id,
        transaction_type: transactionType,
        quantity: values.quantity,
        unit_price: values.unit_price,
        notes: values.notes,
        from_location: values.from_location,
        to_location: values.to_location,
        reason: values.reason,
        created_by: 'admin-user-id' // In a real app, get from auth context
      });

      toast.success(`${transactionLabel} recorded successfully`);
      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error recording transaction:', error);
      toast.error(error.message || 'Failed to record transaction');
    } finally {
      setLoading(false);
    }
  };

  const showUnitPrice = ['purchase', 'sales', 'opening_stock'].includes(transactionType);
  const showFromLocation = ['transfer_in', 'transfer_out'].includes(transactionType);
  const showToLocation = ['transfer_out', 'transfer_in'].includes(transactionType);
  const showReason = transactionType.includes('adjustment') || transactionType.includes('return');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{transactionLabel}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="product_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} (SKU: {product.sku}) - Stock: {product.stock_quantity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showUnitPrice && (
              <FormField
                control={form.control}
                name="unit_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Price (৳)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {showFromLocation && (
              <FormField
                control={form.control}
                name="from_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter source location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {showToLocation && (
              <FormField
                control={form.control}
                name="to_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter destination location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {showReason && (
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter reason for this transaction" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add any additional notes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Record Transaction
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
