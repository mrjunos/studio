
"use client";

import { useState, useEffect, useTransition } from "react";
import { PageTitle } from "@/components/shared/page-title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, XCircle, ShoppingCart, Loader2, History, Calendar as CalendarIcon } from "lucide-react";
import type { Product, Sale } from "@/lib/types";
import { getProducts } from "@/app/products/actions";
import { useToast } from "@/hooks/use-toast";
import { processSale, getSales, type CartItemForAction } from "./actions";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface CartItemClient extends CartItemForAction {
  // productName and productPrice are already in CartItemForAction via SaleItem
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export default function SalesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [cart, setCart] = useState<CartItemClient[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [selectedSaleDate, setSelectedSaleDate] = useState<Date | undefined>(undefined);

  const [salesHistory, setSalesHistory] = useState<Sale[]>([]);
  const [isLoadingSalesHistory, setIsLoadingSalesHistory] = useState(true);

  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const fetchPageData = async () => {
    setIsLoadingProducts(true);
    setIsLoadingSalesHistory(true);
    try {
      const [fetchedProducts, fetchedSales] = await Promise.all([
        getProducts(),
        getSales()
      ]);
      setProducts(fetchedProducts.filter(p => p.stock > 0)); // Only show products with stock for selection
      setSalesHistory(fetchedSales);
    } catch (error: any) {
      toast({ title: "Error Loading Page Data", description: error.message || "Could not load data.", variant: "destructive" });
    }
    setIsLoadingProducts(false);
    setIsLoadingSalesHistory(false);
  };

  useEffect(() => {
    fetchPageData();
  }, []);

  const handleAddToCart = () => {
    if (!selectedProductId || quantity <= 0) {
      toast({ title: "Invalid Input", description: "Please select a product and enter a valid quantity.", variant: "destructive" });
      return;
    }

    const product = products.find(p => p.id === selectedProductId);
    if (!product) {
      const originalProduct = products.concat(salesHistory.flatMap(s => s.items.map(i => ({...i, id: i.productId, category: 'Food', stock: 0, imageUrl: ''} as Product)))).find(p => p.id === selectedProductId);
      if (!originalProduct) {
        toast({ title: "Product Not Found", description: "The selected product is no longer available or valid.", variant: "destructive" });
        return;
      }
       toast({ title: "Product Issue", description: `${originalProduct.name} might be out of stock or data is stale. Refreshing products.`, variant: "destructive" });
       fetchPageData(); 
       return;
    }

    if (product.stock <= 0) {
        toast({ title: "Out of Stock", description: `${product.name} is currently out of stock.`, variant: "destructive"});
        return;
    }
    if (quantity > product.stock) {
      toast({ title: "Insufficient Stock", description: `Only ${product.stock} units of ${product.name} available.`, variant: "destructive"});
      return;
    }

    const existingCartItemIndex = cart.findIndex(item => item.productId === selectedProductId);
    if (existingCartItemIndex !== -1) {
      const updatedCart = [...cart];
      const newQuantity = updatedCart[existingCartItemIndex].quantity + quantity;
      if (newQuantity > product.stock) {
         toast({ title: "Insufficient Stock", description: `Cannot add ${quantity} more. Total ${newQuantity} would exceed stock of ${product.stock}.`, variant: "destructive"});
         return;
      }
      updatedCart[existingCartItemIndex].quantity = newQuantity;
      setCart(updatedCart);
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        quantity,
        priceAtSale: product.price,
      }]);
    }

    setSelectedProductId("");
    setQuantity(1);
    toast({ title: "Item Added", description: `${product.name} (x${quantity}) added to cart.` });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
    toast({ title: "Item Removed", description: `Item removed from cart.` });
  };

  const handleUpdateQuantity = (productId: string, newQuantityStr: string) => {
    const newQuantity = parseInt(newQuantityStr);
    const product = products.find(p => p.id === productId) || salesHistory.flatMap(s => s.items.map(i => ({...i, id: i.productId, category: 'Food', stock: 0, imageUrl: ''} as Product))).find(p => p.id === productId);

    if (!product) return; 

    if (isNaN(newQuantity) || newQuantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    if (newQuantity > product.stock) {
      toast({ title: "Insufficient Stock", description: `Only ${product.stock} units of ${product.name} available.`, variant: "destructive"});
      setCart(cart.map(item => item.productId === productId ? { ...item, quantity: product.stock } : item));
      return;
    }
    setCart(cart.map(item => item.productId === productId ? { ...item, quantity: newQuantity } : item));
  }

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.priceAtSale * item.quantity, 0);
  };

  const handleProcessSale = async () => {
    if (cart.length === 0) {
      toast({ title: "Empty Cart", description: "Please add items to the cart before processing sale.", variant: "destructive" });
      return;
    }

    const itemsForAction: CartItemForAction[] = cart.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        priceAtSale: item.priceAtSale,
    }));
    const total = calculateTotal();

    startTransition(async () => {
        const result = await processSale(itemsForAction, total, selectedSaleDate);
        if (result.success) {
            toast({ title: "Sale Processed!", description: `Sale ID: ${result.saleId}. Total: ${currencyFormatter.format(total)}. Inventory updated.` });
            setCart([]);
            setSelectedSaleDate(undefined); // Reset selected date
            fetchPageData(); 
        } else {
            let errorDesc = result.error || "Failed to process sale.";
            if (result.unavailableItems && result.unavailableItems.length > 0) {
                errorDesc += " Unavailable: " + result.unavailableItems.map(i => `${i.name} (only ${i.availableStock} left)`).join(', ');
            }
            toast({ title: "Sale Failed", description: errorDesc, variant: "destructive" });
            fetchPageData(); 
        }
    });
  };

  return (
    <div className="p-6 space-y-6">
      <PageTitle title="Sales Registration" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Add Products to Sale</CardTitle>
            <CardDescription>Select products and quantities to add to the current sale.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="product">Product</Label>
              {isLoadingProducts ? <Loader2 className="h-5 w-5 animate-spin mt-2" /> : (
                <Select value={selectedProductId} onValueChange={setSelectedProductId} disabled={isPending}>
                  <SelectTrigger id="product">
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(product => (
                      <SelectItem key={product.id} value={product.id} disabled={product.stock === 0}>
                        {product.name} (Stock: {product.stock}) - {currencyFormatter.format(product.price)}
                      </SelectItem>
                    ))}
                      {products.length === 0 && !isLoadingProducts && (
                      <SelectItem value="no-products" disabled>No products available or in stock.</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                min="1"
                disabled={isPending || isLoadingProducts}
              />
            </div>
            <Button onClick={handleAddToCart} disabled={isPending || isLoadingProducts || !selectedProductId || quantity <= 0} className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" /> Add to Cart
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" /> Current Sale
            </CardTitle>
            <CardDescription>Review items before completing the sale.</CardDescription>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto">
            {cart.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Cart is empty</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.map(item => (
                    <TableRow key={item.productId}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell className="text-center w-20">
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleUpdateQuantity(item.productId, e.target.value)}
                          min="1"
                          className="h-8 text-center"
                          disabled={isPending}
                        />
                      </TableCell>
                      <TableCell className="text-right">{currencyFormatter.format(item.priceAtSale * item.quantity)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveFromCart(item.productId)} className="text-destructive hover:text-destructive/80" disabled={isPending}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
          {cart.length > 0 && (
            <CardFooter className="flex flex-col gap-2 pt-4 border-t">
               <div className="w-full space-y-2 mb-2">
                <Label htmlFor="sale-date">Sale Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="sale-date"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedSaleDate && "text-muted-foreground"
                      )}
                      disabled={isPending}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedSaleDate ? format(selectedSaleDate, "PPP") : <span>Pick a date (defaults to now)</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedSaleDate}
                      onSelect={setSelectedSaleDate}
                      initialFocus
                      disabled={isPending}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex justify-between w-full text-lg font-semibold">
                <span>Total:</span>
                <span className="text-primary">{currencyFormatter.format(calculateTotal())}</span>
              </div>
              <Button onClick={handleProcessSale} className="w-full mt-2" disabled={isPending || isLoadingProducts}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
                Process Sale
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" /> Sales History
          </CardTitle>
          <CardDescription>A log of all completed sales.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingSalesHistory ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : salesHistory.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No sales recorded yet.</p>
          ) : (
            <div className="rounded-lg border shadow-sm overflow-hidden max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-center">Items Sold</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesHistory.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>{format(new Date(sale.saleDate), "PPp")}</TableCell>
                      <TableCell className="text-center">
                        {sale.items.reduce((sum, item) => sum + item.quantity, 0)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        {currencyFormatter.format(sale.totalAmount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
