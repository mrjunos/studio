
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
import { getProducts } from "@/app/products/actions";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { getInventoryAdjustments, addInventoryAdjustment, type InventoryAdjustmentFormInput } from "./actions";

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingAdjustments, setIsLoadingAdjustments] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantityChange, setQuantityChange] = useState<number | string>(""); // Allow string for input
  const [reason, setReason] = useState<string>("");
  
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const fetchPageData = async () => {
    setIsLoadingProducts(true);
    setIsLoadingAdjustments(true);
    try {
      const [fetchedProducts, fetchedAdjustments] = await Promise.all([
        getProducts(),
        getInventoryAdjustments()
      ]);
      setProducts(fetchedProducts);
      setAdjustments(fetchedAdjustments);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Could not load page data.", variant: "destructive" });
    }
    setIsLoadingProducts(false);
    setIsLoadingAdjustments(false);
  };

  useEffect(() => {
    fetchPageData();
  }, []);

  const handleAddAdjustmentDialog = () => {
    setIsDialogOpen(true);
    setSelectedProductId("");
    setQuantityChange("");
    setReason("");
  };

  const handleSubmitAdjustment = async () => {
    if (!selectedProductId || quantityChange === "" || Number(quantityChange) === 0) {
      toast({ title: "Invalid Input", description: "Please select a product and enter a valid, non-zero quantity change.", variant: "destructive" });
      return;
    }
    
    const product = products.find(p => p.id === selectedProductId);
    if (!product) {
      toast({ title: "Product Not Found", variant: "destructive" });
      return;
    }

    const numericQuantityChange = Number(quantityChange);
    if (isNaN(numericQuantityChange)) {
       toast({ title: "Invalid Quantity", description: "Quantity change must be a number.", variant: "destructive" });
       return;
    }
    
    const adjustmentData: InventoryAdjustmentFormInput = {
        productId: selectedProductId,
        quantityChange: numericQuantityChange,
        reason: reason || undefined,
    };
    
    startTransition(async () => {
      const result = await addInventoryAdjustment(adjustmentData, product.name);
      if (result.success) {
        toast({ title: "Inventory Adjusted", description: `${product.name} stock changed by ${numericQuantityChange}.` });
        fetchPageData(); // Refresh both adjustments and product stock implicitly
        setIsDialogOpen(false);
      } else {
        toast({ title: "Adjustment Failed", description: result.error || "An unexpected error occurred.", variant: "destructive" });
      }
    });
  };

  return (
    <>
      <PageTitle 
        title="Inventory Adjustments" 
        actions={
          <Button onClick={handleAddAdjustmentDialog} className="bg-primary hover:bg-primary/90" disabled={isPending || isLoadingProducts}>
            <PlusCircle className="mr-2 h-4 w-4" /> New Adjustment
          </Button>
        } 
      />

      {(isLoadingProducts || isLoadingAdjustments) && adjustments.length === 0 ? (
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {adjustments.length > 0 ? (
                adjustments.map((adj) => (
                  <TableRow key={adj.id}>
                    <TableCell>{format(new Date(adj.adjustmentDate), "PPp")}</TableCell>
                    <TableCell className="font-medium">{adj.productName}</TableCell>
                    <TableCell className={`text-right font-semibold ${adj.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {adj.quantityChange > 0 ? `+${adj.quantityChange}` : adj.quantityChange}
                    </TableCell>
                    <TableCell>{adj.reason || "N/A"}</TableCell>
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
                <Select value={selectedProductId} onValueChange={setSelectedProductId} disabled={isPending}>
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
                onChange={(e) => setQuantityChange(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea 
                id="reason" 
                placeholder="e.g., Stocktake correction, Damaged goods"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>Cancel</Button>
            </DialogClose>
            <Button type="submit" onClick={handleSubmitAdjustment} disabled={isPending || isLoadingProducts}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Apply Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
