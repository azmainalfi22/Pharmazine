import { useState } from "react";
import { Search, Package, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, differenceInDays } from "date-fns";

interface MedicineBatch {
  id: string;
  product_id: string;
  batch_number: string;
  manufacture_date: string;
  expiry_date: string;
  manufacturer_id: string;
  quantity_received: number;
  quantity_remaining: number;
  quantity_sold: number;
  purchase_price: number;
  mrp: number;
  selling_price: number;
  rack_number: string;
  is_active: boolean;
  is_expired: boolean;
  created_at: string;
}

interface BatchTabProps {
  batches: MedicineBatch[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export default function BatchTab({ batches, loading, searchTerm, setSearchTerm }: BatchTabProps) {
  const getExpiryStatus = (expiryDate: string) => {
    const daysToExpiry = differenceInDays(new Date(expiryDate), new Date());
    
    if (daysToExpiry < 0) {
      return { status: "Expired", color: "destructive", days: daysToExpiry };
    } else if (daysToExpiry <= 30) {
      return { status: "Critical", color: "destructive", days: daysToExpiry };
    } else if (daysToExpiry <= 60) {
      return { status: "Warning", color: "default", days: daysToExpiry };
    } else if (daysToExpiry <= 90) {
      return { status: "Info", color: "secondary", days: daysToExpiry };
    } else {
      return { status: "Good", color: "secondary", days: daysToExpiry };
    }
  };

  const filteredBatches = batches.filter(b => 
    b.batch_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.rack_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );


  return (
    <div className="space-y-4">
      {/* Batch List */}
      <Card className="pharmacy-card">
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Medicine Batches
              </CardTitle>
              <CardDescription>Track medicine batches with expiry dates and inventory levels</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search batches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pharmacy-input"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : filteredBatches.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm ? "No batches found matching your search" : "No batches yet. Batches are created automatically when you make purchases."}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch Number</TableHead>
                    <TableHead>Manufacture Date</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead className="text-right">Received</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead className="text-right">Sold</TableHead>
                    <TableHead className="text-right">Purchase Price</TableHead>
                    <TableHead className="text-right">MRP</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBatches.map((batch) => {
                    const expiryStatus = getExpiryStatus(batch.expiry_date);
                    return (
                      <TableRow key={batch.id}>
                        <TableCell className="font-medium">
                          <Badge variant="outline" className="pharmacy-badge">
                            {batch.batch_number}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {batch.manufacture_date 
                            ? format(new Date(batch.manufacture_date), "dd MMM yyyy")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {format(new Date(batch.expiry_date), "dd MMM yyyy")}
                            {expiryStatus.days <= 90 && expiryStatus.days > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {expiryStatus.days}d left
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{batch.quantity_received}</TableCell>
                        <TableCell className="text-right font-medium">
                          <span className={batch.quantity_remaining <= 10 ? "text-orange-600" : ""}>
                            {batch.quantity_remaining}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {batch.quantity_sold}
                        </TableCell>
                        <TableCell className="text-right">
                          ${(batch.purchase_price || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${(batch.mrp || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {batch.rack_number ? (
                            <Badge variant="outline" className="pharmacy-badge">
                              {batch.rack_number}
                            </Badge>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant={expiryStatus.color as "default" | "destructive" | "secondary"}
                            className="pharmacy-badge"
                          >
                            {expiryStatus.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

