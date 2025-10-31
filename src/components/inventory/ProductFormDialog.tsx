import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiClient } from '@/integrations/api/client';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

interface Subcategory {
  id: string;
  name: string;
  category_id?: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface Country {
  id: string;
  name: string;
  code: string;
}

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  product?: any;
}

const formSchema = z.object({
  // Basic Information
  name: z.string().min(1, 'Product name is required').max(255),
  sku: z.string().min(1, 'SKU is required').max(100),
  description: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  category_id: z.string().optional(),
  subcategory_id: z.string().optional(),
  
  // Manufacturer & Origin
  manufacturer: z.string().optional(),
  country_of_origin: z.string().optional(),
  
  // Unit Management (Pharmacy-specific)
  unit_type: z.string().optional(),
  unit_size: z.string().optional(),
  unit_multiplier: z.string().optional(),
  
  // Pricing (Pharmacy-specific)
  purchase_price: z.string().default('0'),
  selling_price: z.string().default('0'),
  mrp_unit: z.string().default('0'),
  cost_price: z.string().default('0'),
  
  // Pharmacy-specific Specifications
  batch_number: z.string().optional(),
  expiry_date: z.string().optional(),
  manufacturing_date: z.string().optional(),
  shelf_life: z.string().optional(),
  active_ingredients: z.string().optional(),
  dosage: z.string().optional(),
  storage_instructions: z.string().optional(),
  indications: z.string().optional(),
  side_effects: z.string().optional(),
  prescription_required: z.boolean().default(false),
  weight: z.string().optional(),
  dimensions: z.string().optional(),
  package_contents: z.string().optional(),
  
  // Stock Management
  stock_quantity: z.string().default('0'),
  min_stock_level: z.string().default('0'),
  max_stock_level: z.string().default('0'),
  reorder_level: z.string().default('10'),
  image_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  supplier_id: z.string().optional(),
});

export function ProductFormDialog({ open, onOpenChange, onSuccess, product }: ProductFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: product?.name || '',
      sku: product?.sku || '',
      description: product?.description || '',
      brand: product?.brand || '',
      model: product?.model || '',
      category_id: product?.category_id || '',
      subcategory_id: product?.subcategory_id || '',
      manufacturer: product?.manufacturer || '',
      country_of_origin: product?.country_of_origin || '',
      unit_type: product?.unit_type || '',
      unit_size: product?.unit_size || '',
      unit_multiplier: product?.unit_multiplier?.toString() || '',
      purchase_price: product?.purchase_price?.toString() || '0',
      selling_price: product?.selling_price?.toString() || '0',
      mrp_unit: product?.mrp_unit?.toString() || '0',
      cost_price: product?.cost_price?.toString() || '0',
      batch_number: product?.batch_number || '',
      expiry_date: product?.expiry_date ? (new Date(product.expiry_date).toISOString().split('T')[0]) : '',
      manufacturing_date: product?.manufacturing_date ? (new Date(product.manufacturing_date).toISOString().split('T')[0]) : '',
      shelf_life: product?.shelf_life || '',
      active_ingredients: product?.active_ingredients || '',
      dosage: product?.dosage || '',
      storage_instructions: product?.storage_instructions || '',
      indications: product?.indications || '',
      side_effects: product?.side_effects || '',
      prescription_required: product?.prescription_required || false,
      weight: product?.weight?.toString() || '',
      dimensions: product?.dimensions || '',
      package_contents: product?.package_contents || '',
      stock_quantity: product?.stock_quantity?.toString() || '0',
      min_stock_level: product?.min_stock_level?.toString() || '0',
      max_stock_level: product?.max_stock_level?.toString() || '0',
      reorder_level: product?.reorder_level?.toString() || '10',
      image_url: product?.image_url || '',
      supplier_id: product?.supplier_id || '',
    },
  });

  useEffect(() => {
    if (open) {
      fetchCategories();
      fetchSuppliers();
      fetchCountries();
      if (product?.category_id) {
        setSelectedCategoryId(product.category_id);
        fetchSubcategories(product.category_id);
      }
    }
  }, [open, product]);

  useEffect(() => {
    if (selectedCategoryId) {
      fetchSubcategories(selectedCategoryId);
    } else {
      setSubcategories([]);
    }
  }, [selectedCategoryId]);

  const fetchCategories = async () => {
    try {
      const data = await apiClient.getCategories();
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchSubcategories = async (categoryId: string) => {
    try {
      const data = await apiClient.getSubcategories();
      const filtered = data.filter(sub => sub.category_id === categoryId);
      setSubcategories(filtered || []);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const data = await apiClient.getSuppliers();
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchCountries = async () => {
    try {
      const data = await apiClient.getCountries();
      setCountries(data || []);
    } catch (error) {
      console.error('Error fetching countries:', error);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);

    try {
      const productData = {
        name: values.name,
        sku: values.sku,
        description: values.description || null,
        brand: values.brand || null,
        model: values.model || null,
        category_id: values.category_id || null,
        subcategory_id: values.subcategory_id || null,
        manufacturer: values.manufacturer || null,
        country_of_origin: values.country_of_origin || null,
        unit_type: values.unit_type || null,
        unit_size: values.unit_size || null,
        unit_multiplier: values.unit_multiplier ? parseFloat(values.unit_multiplier) : null,
        purchase_price: parseFloat(values.purchase_price) || 0,
        selling_price: parseFloat(values.selling_price) || 0,
        mrp_unit: parseFloat(values.mrp_unit) || 0,
        unit_price: parseFloat(values.selling_price) || 0,
        cost_price: parseFloat(values.cost_price) || 0,
        batch_number: values.batch_number || null,
        expiry_date: values.expiry_date ? new Date(values.expiry_date).toISOString() : null,
        manufacturing_date: values.manufacturing_date ? new Date(values.manufacturing_date).toISOString() : null,
        shelf_life: values.shelf_life || null,
        active_ingredients: values.active_ingredients || null,
        dosage: values.dosage || null,
        storage_instructions: values.storage_instructions || null,
        indications: values.indications || null,
        side_effects: values.side_effects || null,
        prescription_required: values.prescription_required || false,
        weight: values.weight ? parseFloat(values.weight) : null,
        dimensions: values.dimensions || null,
        package_contents: values.package_contents || null,
        stock_quantity: parseInt(values.stock_quantity) || 0,
        min_stock_level: parseInt(values.min_stock_level) || 0,
        max_stock_level: parseInt(values.max_stock_level) || 0,
        reorder_level: parseInt(values.reorder_level) || 10,
        image_url: values.image_url || null,
        supplier_id: values.supplier_id || null,
      };

      if (product?.id) {
        await apiClient.updateProduct(product.id, productData);
        toast.success('Product updated successfully');
      } else {
        await apiClient.createProduct(productData);
        toast.success('Product added successfully');
      }

      form.reset();
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(error.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          <DialogDescription>
            {product ? 'Update product details below' : 'Fill in the product details below'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="manufacturer">Manufacturer</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
                <TabsTrigger value="technical">Medicine Info</TabsTrigger>
                <TabsTrigger value="stock">Stock</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter product name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter SKU" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter product description" rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter brand" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter model" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedCategoryId(value);
                          }} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
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
                    name="subcategory_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subcategory</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Subcategory" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subcategories.map((subcategory) => (
                              <SelectItem key={subcategory.id} value={subcategory.id}>
                                {subcategory.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="manufacturer" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="manufacturer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manufacturer (OEM)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter manufacturer/OEM company name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="country_of_origin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country of Origin</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem key={country.id} value={country.name}>
                                {country.name} ({country.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="supplier_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="pricing" className="space-y-4 mt-4">
                {/* Unit Management Section */}
                <div className="p-4 bg-teal-50 dark:bg-teal-950/20 rounded-lg border-2 border-teal-200 dark:border-teal-800">
                  <h3 className="text-sm font-semibold text-teal-900 dark:text-teal-100 mb-3">Unit Information</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="unit_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="gram">Gram (g)</SelectItem>
                              <SelectItem value="kilogram">Kilogram (kg)</SelectItem>
                              <SelectItem value="milliliter">Milliliter (ml)</SelectItem>
                              <SelectItem value="liter">Liter (L)</SelectItem>
                              <SelectItem value="piece">Piece (pc)</SelectItem>
                              <SelectItem value="strip">Strip</SelectItem>
                              <SelectItem value="packet">Packet</SelectItem>
                              <SelectItem value="box">Box</SelectItem>
                              <SelectItem value="bottle">Bottle</SelectItem>
                              <SelectItem value="bag">Bag</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="unit_size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Size</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 500, 1000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="unit_multiplier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Multiplier</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="1.0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Pricing Section */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="purchase_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purchase Price (৳) *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">Price at which you buy from supplier</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="selling_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Selling Price (৳) *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">Price at which you sell to customers</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="mrp_unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>MRP - Max Retail Price (৳)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">Maximum retail price (optional)</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cost_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cost Price (৳)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">Internal cost tracking</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Profit Margin Calculator */}
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 mb-2">Profit Margin</h3>
                  <div className="text-sm text-muted-foreground">
                    {(() => {
                      const purchase = parseFloat(form.watch('purchase_price')) || 0;
                      const selling = parseFloat(form.watch('selling_price')) || 0;
                      const margin = purchase > 0 ? ((selling - purchase) / purchase * 100).toFixed(2) : '0.00';
                      const profit = (selling - purchase).toFixed(2);
                      return (
                        <div className="space-y-1">
                          <p>Profit per unit: <span className="font-semibold text-emerald-600 dark:text-emerald-400">৳{profit}</span></p>
                          <p>Margin: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{margin}%</span></p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="technical" className="space-y-4 mt-4">
                {/* Batch & Expiry Information */}
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border-2 border-amber-200 dark:border-amber-800">
                  <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-3">Batch & Expiry Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="batch_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Batch Number</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., BT20240101" {...field} />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">Manufacturing batch identifier</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="expiry_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiry Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">Product expiry date</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <FormField
                      control={form.control}
                      name="manufacturing_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Manufacturing Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="shelf_life"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Shelf Life</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 2 years, 24 months" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Medicine Information */}
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                  <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">Medicine Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="active_ingredients"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Active Ingredients</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Paracetamol 500mg" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dosage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dosage</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 500mg, 10ml" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="indications"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>Indications / Uses</FormLabel>
                        <FormControl>
                          <Textarea placeholder="e.g., Pain relief, Fever reduction" rows={2} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="side_effects"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Side Effects</FormLabel>
                        <FormControl>
                          <Textarea placeholder="e.g., Drowsiness, Nausea (if any)" rows={2} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Storage & Prescription */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="storage_instructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Storage Instructions</FormLabel>
                        <FormControl>
                          <Textarea placeholder="e.g., Store in cool, dry place. Keep away from sunlight." rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="prescription_required"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Prescription Required</FormLabel>
                            <p className="text-xs text-muted-foreground">Check if this medicine requires a doctor's prescription</p>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight (kg)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dimensions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dimensions</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 10x5x2 cm" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="package_contents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Package Contents</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter package contents" rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </TabsContent>

              <TabsContent value="stock" className="space-y-4 mt-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="stock_quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Stock</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="min_stock_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Stock Level</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="max_stock_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Stock Level</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="reorder_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reorder Level</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter image URL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all border-0"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {product ? 'Update Product' : 'Add Product'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
