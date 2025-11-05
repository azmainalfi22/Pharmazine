import { useState } from "react";
import { QrCode, Printer, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { API_CONFIG, getAuthHeaders } from "@/config/api";

interface BarcodeGenerationForm {
  product_id: string;
  batch_id?: string;
  quantity: number;
  printer_name?: string;
  paper_size: string;
}

export default function BarcodeTab() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<BarcodeGenerationForm>({
    product_id: "",
    batch_id: "",
    quantity: 1,
    printer_name: "",
    paper_size: "label"
  });
  const [generatedBarcode, setGeneratedBarcode] = useState<string | null>(null);
  const [generatedQRCode, setGeneratedQRCode] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!form.product_id) {
      toast.error("Product ID is required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.PHARMACY_BASE}/generate-barcode`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(form)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.barcode_data) {
          setGeneratedBarcode(`data:image/png;base64,${data.barcode_data}`);
        }
        if (data.qr_code_data) {
          setGeneratedQRCode(`data:image/png;base64,${data.qr_code_data}`);
        }
        toast.success(data.message || "Barcode generated successfully");
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to generate barcode");
      }
    } catch (error) {
      toast.error("Error generating barcode");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Unable to open print window");
      return;
    }

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Barcode</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              display: flex;
              flex-direction: column;
              align-items: center;
              font-family: Arial, sans-serif;
            }
            .barcode-container {
              text-align: center;
              margin: 20px 0;
            }
            img {
              max-width: 100%;
              margin: 10px 0;
            }
            h3 {
              margin: 10px 0;
            }
            @media print {
              button {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="barcode-container">
            ${generatedBarcode ? `
              <div>
                <h3>Barcode</h3>
                <img src="${generatedBarcode}" alt="Barcode" />
              </div>
            ` : ''}
            ${generatedQRCode ? `
              <div>
                <h3>QR Code</h3>
                <img src="${generatedQRCode}" alt="QR Code" />
              </div>
            ` : ''}
          </div>
          <button onclick="window.print()">Print</button>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  };

  const handleDownload = (type: 'barcode' | 'qr') => {
    const image = type === 'barcode' ? generatedBarcode : generatedQRCode;
    if (!image) {
      toast.error("No image to download");
      return;
    }

    const link = document.createElement('a');
    link.href = image;
    link.download = `${type}-${form.product_id}-${Date.now()}.png`;
    link.click();
    toast.success(`${type === 'barcode' ? 'Barcode' : 'QR Code'} downloaded successfully`);
  };

  return (
    <div className="space-y-6">
      <Card className="pharmacy-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            Barcode & QR Code Generator
          </CardTitle>
          <CardDescription>
            Generate barcodes and QR codes for products and batches
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Input Form */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Generation Settings</h3>
              
              <div>
                <Label>Product ID *</Label>
                <Input
                  value={form.product_id}
                  onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                  placeholder="Enter product ID"
                  className="pharmacy-input"
                />
              </div>

              <div>
                <Label>Batch ID (Optional)</Label>
                <Input
                  value={form.batch_id}
                  onChange={(e) => setForm({ ...form, batch_id: e.target.value })}
                  placeholder="Enter batch ID (optional)"
                  className="pharmacy-input"
                />
              </div>

              <div>
                <Label>Paper Size</Label>
                <Select
                  value={form.paper_size}
                  onValueChange={(value) => setForm({ ...form, paper_size: value })}
                >
                  <SelectTrigger className="pharmacy-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="label">Label (Default)</SelectItem>
                    <SelectItem value="a4">A4</SelectItem>
                    <SelectItem value="a5">A5</SelectItem>
                    <SelectItem value="a6">A6</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Quantity to Generate</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
                  className="pharmacy-input"
                />
              </div>

              <Button 
                className="pharmacy-button w-full" 
                onClick={handleGenerate}
                disabled={loading}
              >
                <QrCode className="w-4 h-4 mr-2" />
                {loading ? "Generating..." : "Generate Codes"}
              </Button>
            </div>

            {/* Preview Area */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Preview</h3>
              
              {!generatedBarcode && !generatedQRCode ? (
                <div className="border-2 border-dashed rounded-lg p-12 text-center text-muted-foreground">
                  <QrCode className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>Generated codes will appear here</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {generatedBarcode && (
                    <div className="border rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-center mb-2">
                        <Label>Barcode</Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload('barcode')}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                      <div className="flex justify-center p-4 bg-gray-50 rounded">
                        <img src={generatedBarcode} alt="Barcode" className="max-w-full" />
                      </div>
                    </div>
                  )}

                  {generatedQRCode && (
                    <div className="border rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-center mb-2">
                        <Label>QR Code</Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload('qr')}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                      <div className="flex justify-center p-4 bg-gray-50 rounded">
                        <img src={generatedQRCode} alt="QR Code" className="max-w-full" />
                      </div>
                    </div>
                  )}

                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={handlePrint}
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print Codes
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card className="pharmacy-card bg-blue-50/50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base">How to Use</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>• <strong>Product ID:</strong> Enter the unique product identifier or SKU</p>
          <p>• <strong>Batch ID:</strong> Optionally include batch information in the code</p>
          <p>• <strong>Paper Size:</strong> Choose the appropriate paper size for printing</p>
          <p>• <strong>Quantity:</strong> Specify how many labels to print</p>
          <p className="pt-2 border-t">
            <strong>Note:</strong> Both barcode and QR code will be generated. QR codes can store 
            more information and are recommended for products with detailed metadata or tracking requirements.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

