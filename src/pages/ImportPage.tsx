import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Upload, 
  Download, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Package,
  Users,
  Truck,
  Database
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/integrations/api/client';

type ImportType = 'products' | 'suppliers' | 'customers' | 'opening-stock';

interface ImportResult {
  success: boolean;
  message: string;
  imported?: number;
  failed?: number;
  errors?: string[];
}

const ImportPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.roles.some(role => role.role === 'admin');

  const [importType, setImportType] = useState<ImportType>('products');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const importOptions = [
    {
      value: 'products',
      label: 'Products',
      icon: Package,
      description: 'Import products with SKU, name, category, prices, etc.',
    },
    {
      value: 'suppliers',
      label: 'Suppliers',
      icon: Truck,
      description: 'Import supplier information including contact details',
    },
    {
      value: 'customers',
      label: 'Customers',
      icon: Users,
      description: 'Import customer data for sales management',
    },
    {
      value: 'opening-stock',
      label: 'Opening Stock',
      icon: Database,
      description: 'Import initial stock quantities for products',
    },
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast.error('Please select a valid CSV file');
        return;
      }
      setSelectedFile(file);
      setResult(null);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await apiClient.downloadImportTemplate(importType);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${importType}-template.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Template downloaded successfully');
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Failed to download template');
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to import');
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      let response: any;
      
      switch (importType) {
        case 'products':
          response = await apiClient.importProductsCSV(selectedFile);
          break;
        case 'suppliers':
          response = await apiClient.importSuppliersCSV(selectedFile);
          break;
        case 'customers':
          response = await apiClient.importCustomersCSV(selectedFile);
          break;
        case 'opening-stock':
          response = await apiClient.importOpeningStockCSV(selectedFile);
          break;
      }

      setResult({
        success: true,
        message: response.message || 'Import completed successfully',
        imported: response.imported || 0,
        failed: response.failed || 0,
        errors: response.errors || [],
      });

      toast.success(`Successfully imported ${response.imported || 0} record(s)`);
      setSelectedFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (error: any) {
      console.error('Error importing file:', error);
      setResult({
        success: false,
        message: error.response?.data?.detail || 'Import failed',
        errors: error.response?.data?.errors || [error.message],
      });
      toast.error('Import failed. Please check the errors below.');
    } finally {
      setImporting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Upload className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
          <p className="text-muted-foreground">
            Only administrators can access the import tools.
          </p>
        </div>
      </div>
    );
  }

  const selectedOption = importOptions.find(opt => opt.value === importType);
  const Icon = selectedOption?.icon || FileText;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 p-8 rounded-2xl border-2 border-teal-200/20 shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="relative flex items-center gap-4">
          <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
            <Icon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-2">CSV Import</h1>
            <p className="text-white/90 text-base">Import data in bulk using CSV files</p>
          </div>
        </div>
      </div>

      {/* Import Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Import Type</CardTitle>
          <CardDescription>
            Choose what type of data you want to import
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {importOptions.map((option) => {
              const OptionIcon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    setImportType(option.value as ImportType);
                    setSelectedFile(null);
                    setResult(null);
                  }}
                  className={`p-4 border rounded-lg text-left transition-all hover:shadow-md ${
                    importType === option.value
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      importType === option.value ? 'bg-primary text-white' : 'bg-muted'
                    }`}>
                      <OptionIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{option.label}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Template Download */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            Download Template
          </CardTitle>
          <CardDescription>
            Download a template CSV file with the correct format for {selectedOption?.label.toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleDownloadTemplate} variant="outline" className="w-full gap-2">
            <Download className="h-4 w-4" />
            Download {selectedOption?.label} Template
          </Button>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload CSV File</CardTitle>
          <CardDescription>
            Select your prepared CSV file to import
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file-input">CSV File</Label>
            <Input
              id="file-input"
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              disabled={importing}
            />
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Important Notes</AlertTitle>
            <AlertDescription className="text-sm space-y-1">
              <ul className="list-disc list-inside">
                <li>Ensure your CSV matches the template format exactly</li>
                <li>Use UTF-8 encoding for special characters</li>
                <li>Remove any empty rows at the end of the file</li>
                <li>Existing records may be updated based on unique identifiers (e.g., SKU)</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleImport}
            disabled={!selectedFile || importing}
            className="w-full gap-2 bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all border-0 disabled:opacity-50"
            size="lg"
          >
            <Upload className="h-4 w-4" />
            {importing ? 'Importing...' : `Import ${selectedOption?.label}`}
          </Button>
        </CardContent>
      </Card>

      {/* Import Result */}
      {result && (
        <Card className={result.success ? 'border-green-500' : 'border-red-500'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Import Successful
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  Import Failed
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">{result.message}</p>
            
            {result.imported !== undefined && (
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-semibold">{result.imported}</span> imported
                </div>
                {result.failed !== undefined && result.failed > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="font-semibold">{result.failed}</span> failed
                  </div>
                )}
              </div>
            )}

            {result.errors && result.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Errors:</h4>
                <div className="max-h-48 overflow-y-auto border rounded-md p-3 bg-red-50">
                  <ul className="space-y-1 text-sm text-red-800">
                    {result.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sample Data Format */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Data Format</CardTitle>
          <CardDescription>
            Example of how your CSV data should be structured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {importType === 'products' && (
            <div className="text-sm space-y-2">
              <p className="font-semibold">Required columns:</p>
              <code className="block bg-muted p-3 rounded-md overflow-x-auto">
                sku,name,category,subcategory,unit_type,unit_size,purchase_price,selling_price,min_stock_threshold
              </code>
              <p className="text-muted-foreground mt-2">Example:</p>
              <code className="block bg-muted p-3 rounded-md overflow-x-auto text-xs">
                MED001,Paracetamol 500mg,Medicine,Pain Relief,piece,100,5.50,8.00,50
              </code>
            </div>
          )}
          {importType === 'suppliers' && (
            <div className="text-sm space-y-2">
              <p className="font-semibold">Required columns:</p>
              <code className="block bg-muted p-3 rounded-md overflow-x-auto">
                name,contact_person,email,phone,address
              </code>
              <p className="text-muted-foreground mt-2">Example:</p>
              <code className="block bg-muted p-3 rounded-md overflow-x-auto text-xs">
                ABC Pharma,John Doe,john@abcpharma.com,+1234567890,123 Main St
              </code>
            </div>
          )}
          {importType === 'customers' && (
            <div className="text-sm space-y-2">
              <p className="font-semibold">Required columns:</p>
              <code className="block bg-muted p-3 rounded-md overflow-x-auto">
                name,email,phone,address
              </code>
              <p className="text-muted-foreground mt-2">Example:</p>
              <code className="block bg-muted p-3 rounded-md overflow-x-auto text-xs">
                Jane Smith,jane@email.com,+0987654321,456 Oak Ave
              </code>
            </div>
          )}
          {importType === 'opening-stock' && (
            <div className="text-sm space-y-2">
              <p className="font-semibold">Required columns:</p>
              <code className="block bg-muted p-3 rounded-md overflow-x-auto">
                product_sku,store_name,opening_qty
              </code>
              <p className="text-muted-foreground mt-2">Example:</p>
              <code className="block bg-muted p-3 rounded-md overflow-x-auto text-xs">
                MED001,Main Store,500
              </code>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportPage;


