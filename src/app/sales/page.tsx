
"use client";

import { useState, useEffect } from "react";
import { PageTitle } from "@/components/shared/page-title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Trash2, ShoppingCart, XCircle, Loader2 } from "lucide-react";
import type { Product, SaleItem } from "@/lib/types";
import { getProducts } from "@/app/products/actions"; // Assuming getProducts is available
import { useToast } from "@/hooks/use-toast";

interface CartItem extends SaleItem {
  productName: string;
  productPrice: number;
}

export default function SalesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchProductsData() {
      setIsLoadingProducts(true);
      try {
        const fetchedProducts = await getProducts();
        setProducts(fetchedProducts.filter(p => p.stock > 0)); // Only sellable products
      } catch (error) {
        toast({ title: "Error", description: "Could not load products for sale.", variant: "destructive" });
      }
      setIsLoadingProducts(false);
    }
    fetchProductsData();
  }, [toast]);

  const handleAddToCart = () => {
    if (!selectedProductId || quantity <= 0) {
      toast({ title: "Invalid Input", description: "Please select a product and enter a valid quantity.", variant: "destructive" });
      return;
    }

    const product = products.find(p => p.id === selectedProductId);
    if (!product) {
      toast({ title: "Product Not Found", variant: "destructive" });
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
        quantity, 
        priceAtSale: product.price, 
        productName: product.name,
        productPrice: product.price 
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
  
  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (newQuantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    if (newQuantity > product.stock) {
      toast({ title: "Insufficient Stock", description: `Only ${product.stock} units available.`, variant: "destructive"});
      setCart(cart.map(item => item.productId === productId ? { ...item, quantity: product.stock } : item));
      return;
    }
    setCart(cart.map(item => item.productId === productId ? { ...item, quantity: newQuantity } : item));
  }

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.productPrice * item.quantity, 0);
  };

  const handleProcessSale = async () => {
    if (cart.length === 0) {
      toast({ title: "Empty Cart", description: "Please add items to the cart before processing sale.", variant: "destructive" });
      return;
    }
    setIsProcessingSale(true);
    // Simulate API call for sale processing & inventory update
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    
    // This is where you would call a server action to:
    // 1. Create a Sale record in your database
    // 2. Update stock for each product sold
    
    toast({ title: "Sale Processed!", description: `Total: $${calculateTotal().toFixed(2)}. Inventory updated.` });
    setCart([]); // Clear cart
    // Potentially re-fetch products to update stock display if not handled reactively
    const fetchedProducts = await getProducts();
    setProducts(fetchedProducts.filter(p => p.stock > 0));
    setIsProcessingSale(false);
  };

  return (
    <>
      <PageTitle title="Sales Registration" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-md">
          <CardHeader>
            <CardTitle>Add Products to Sale</CardTitle>
            <CardDescription>Select products and quantities to add to the current sale.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div>
                <Label htmlFor="product">Product</Label>
                {isLoadingProducts ? <Loader2 className="h-5 w-5 animate-spin mt-2" /> : (
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger id="product">
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(product => (
                        <SelectItem key={product.id} value={product.id} disabled={product.stock === 0}>
                          {product.name} (Stock: {product.stock}) - ${product.price.toFixed(2)}
                        </SelectItem>
                      ))}
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
                />
              </div>
            </div>
            <Button onClick={handleAddToCart} disabled={isLoadingProducts || !selectedProductId || quantity <= 0} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Add to Cart
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1 shadow-md">
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
                          onChange={(e) => handleUpdateQuantity(item.productId, parseInt(e.target.value))}
                          min="1"
                          className="h-8 text-center"
                        />
                      </TableCell>
                      <TableCell className="text-right">${(item.productPrice * item.quantity).toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveFromCart(item.productId)} className="text-destructive hover:text-destructive/80">
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
              <div className="flex justify-between w-full text-lg font-semibold">
                <span>Total:</span>
                <span className="text-primary">${calculateTotal().toFixed(2)}</span>
              </div>
              <Button onClick={handleProcessSale} className="w-full mt-2" disabled={isProcessingSale}>
                {isProcessingSale ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
                Process Sale
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </>
  );
}
