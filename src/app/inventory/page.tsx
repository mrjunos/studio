
"use client";

import { useState, useEffect, useTransition } from "react";
import { PageTitle } from "@/components/shared/page-title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { PlusCircle, Edit, Trash2, Loader2 } from "lucide-react";
import type { Product, InventoryAdjustment } from "@/lib/types";
import { getProducts } from "@/app/products/actions"; // Assuming getProducts is available
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Mock data for adjustments - replace with server actions and DB
let mockAdjustments: InventoryAdjustment[] = [];

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>(mockAdjustments);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantityChange, setQuantityChange] = useState<number>(0);
  const [reason, setReason] = useState<string>("");
  
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchProductsData() {
      setIsLoadingProducts(true);
      try {
        const fetchedProducts = await getProducts();
        setProducts(fetchedProducts);
      } catch (error) {
        toast({ title: "Error", description: "Could not load products for inventory adjustment.", variant: "destructive" });
      }
      setIsLoadingProducts(false);
    }
    fetchProductsData();
    // In a real app, fetch adjustments as well
    setAdjustments(mockAdjustments.sort((a,b) => b.adjustmentDate.getTime() - a.adjustmentDate.getTime()));
  }, [toast]);

  const handleAddAdjustment = () => {
    setIsDialogOpen(true);
    setSelectedProductId("");
    setQuantityChange(0);
    setReason("");
  };

  const handleSubmitAdjustment = async () => {
    if (!selectedProductId || quantityChange === 0) {
      toast({ title: "Invalid Input", description: "Please select a product and enter a valid quantity change.", variant: "destructive" });
      return;
    }
    
    const product = products.find(p => p.id === selectedProductId);
    if (!product) {
      toast({ title: "Product Not Found", variant: "destructive" });
      return;
    }
    
    // Optimistic UI update / Server action simulation
    setIsSubmitting(true);
    startTransition(async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newAdjustment: InventoryAdjustment = {
        id: String(Date.now()),
        productId: selectedProductId,
        productName: product.name,
        quantityChange: quantityChange,
        reason: reason,
        adjustmentDate: new Date(),
      };

      // In a real app, you would call a server action here which updates the product stock
      // and records the adjustment.
      // For mock:
      const productIndex = products.findIndex(p => p.id === selectedProductId);
      if (productIndex > -1) {
        const updatedProducts = [...products];
        updatedProducts[productIndex].stock += quantityChange;
        if (updatedProducts[productIndex].stock < 0) {
          // This check should ideally be on the server or more robustly handled
           toast({ title: "Stock Error", description: "Adjustment results in negative stock. Not allowed.", variant: "destructive" });
           setIsSubmitting(false);
           return;
        }
        setProducts(updatedProducts);
      }

      mockAdjustments = [newAdjustment, ...mockAdjustments].sort((a,b) => b.adjustmentDate.getTime() - a.adjustmentDate.getTime());
      setAdjustments(mockAdjustments);

      toast({ title: "Inventory Adjusted", description: `${product.name} stock changed by ${quantityChange}.` });
      setIsDialogOpen(false);
      setIsSubmitting(false);
    });
  };

  return (
    <>
      <PageTitle 
        title="Inventory Adjustments" 
        actions={
          <Button onClick={handleAddAdjustment} className="bg-primary hover:bg-primary/90">
            <PlusCircle className="mr-2 h-4 w-4" /> New Adjustment
          </Button>
        } 
      />

      {isLoadingProducts && adjustments.length === 0 ? (
         <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-lg border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Quantity Change</TableHead>
                <TableHead>Reason</TableHead>
                {/* <TableHead className="text-right">Actions</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {adjustments.length > 0 ? (
                adjustments.map((adj) => (
                  <TableRow key={adj.id}>
                    <TableCell>{format(new Date(adj.adjustmentDate), "PPp")}</TableCell>
                    <TableCell className="font-medium">{adj.productName || products.find(p=>p.id === adj.productId)?.name || 'N/A'}</TableCell>
                    <TableCell className={`text-right font-semibold ${adj.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {adj.quantityChange > 0 ? `+${adj.quantityChange}` : adj.quantityChange}
                    </TableCell>
                    <TableCell>{adj.reason || "N/A"}</TableCell>
                    {/* <TableCell className="text-right">
                       <Button variant="ghost" size="icon" className="mr-2 hover:text-accent disabled:opacity-50" disabled>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="hover:text-destructive disabled:opacity-50" disabled>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell> */}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                    No inventory adjustments recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Inventory Adjustment</DialogTitle>
            <DialogDescription>
              Adjust the stock level for a product. Use negative values for decreases.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product-select">Product</Label>
              {isLoadingProducts ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger id="product-select">
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} (Current Stock: {product.stock})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity-change">Quantity Change</Label>
              <Input 
                id="quantity-change" 
                type="number"
                placeholder="e.g., 10 or -5"
                value={quantityChange}
                onChange={(e) => setQuantityChange(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea 
                id="reason" 
                placeholder="e.g., Stocktake correction, Damaged goods"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button>
            </DialogClose>
            <Button type="submit" onClick={handleSubmitAdjustment} disabled={isSubmitting || isLoadingProducts}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Apply Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
