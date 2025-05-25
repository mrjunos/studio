
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
import { es } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

interface CartItemClient extends CartItemForAction {
}

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
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
  const { isLoggedIn } = useAuth();

  const fetchPageData = async () => {
    setIsLoadingProducts(true);
    setIsLoadingSalesHistory(true);
    try {
      const [fetchedProducts, fetchedSales] = await Promise.all([
        getProducts(),
        getSales()
      ]);
      setProducts(fetchedProducts.filter(p => p.stock > 0)); 
      setSalesHistory(fetchedSales);
    } catch (error: any) {
      toast({ title: "Error al Cargar Datos de la Página", description: error.message || "No se pudieron cargar los datos.", variant: "destructive" });
    }
    setIsLoadingProducts(false);
    setIsLoadingSalesHistory(false);
  };

  useEffect(() => {
    fetchPageData();
  }, []);

  const handleAddToCart = () => {
    if (!isLoggedIn) {
      toast({ title: "Acción no permitida", description: "Debes iniciar sesión para añadir al carrito.", variant: "destructive" });
      return;
    }
    if (!selectedProductId || quantity <= 0) {
      toast({ title: "Entrada Inválida", description: "Por favor, selecciona un producto e ingresa una cantidad válida.", variant: "destructive" });
      return;
    }

    const product = products.find(p => p.id === selectedProductId);
    if (!product) {
      const originalProduct = products.concat(salesHistory.flatMap(s => s.items.map(i => ({...i, id: i.productId, category: 'Alimentos', stock: 0, imageUrl: ''} as Product)))).find(p => p.id === selectedProductId);
      if (!originalProduct) {
        toast({ title: "Producto No Encontrado", description: "El producto seleccionado ya no está disponible o no es válido.", variant: "destructive" });
        return;
      }
       toast({ title: "Problema con Producto", description: `${originalProduct.name} podría estar agotado o los datos están desactualizados. Refrescando productos.`, variant: "destructive" });
       fetchPageData(); 
       return;
    }

    if (product.stock <= 0) {
        toast({ title: "Agotado", description: `${product.name} está actualmente agotado.`, variant: "destructive"});
        return;
    }
    if (quantity > product.stock) {
      toast({ title: "Stock Insuficiente", description: `Solo hay ${product.stock} unidades de ${product.name} disponibles.`, variant: "destructive"});
      return;
    }

    const existingCartItemIndex = cart.findIndex(item => item.productId === selectedProductId);
    if (existingCartItemIndex !== -1) {
      const updatedCart = [...cart];
      const newQuantity = updatedCart[existingCartItemIndex].quantity + quantity;
      if (newQuantity > product.stock) {
         toast({ title: "Stock Insuficiente", description: `No se pueden añadir ${quantity} más. El total ${newQuantity} excedería el stock de ${product.stock}.`, variant: "destructive"});
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
    toast({ title: "Artículo Añadido", description: `${product.name} (x${quantity}) añadido al carrito.` });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
    toast({ title: "Artículo Eliminado", description: `Artículo eliminado del carrito.` });
  };

  const handleUpdateQuantity = (productId: string, newQuantityStr: string) => {
    const newQuantity = parseInt(newQuantityStr);
    const product = products.find(p => p.id === productId) || salesHistory.flatMap(s => s.items.map(i => ({...i, id: i.productId, category: 'Alimentos', stock: 0, imageUrl: ''} as Product))).find(p => p.id === productId);

    if (!product) return; 

    if (isNaN(newQuantity) || newQuantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    if (newQuantity > product.stock) {
      toast({ title: "Stock Insuficiente", description: `Solo hay ${product.stock} unidades de ${product.name} disponibles.`, variant: "destructive"});
      setCart(cart.map(item => item.productId === productId ? { ...item, quantity: product.stock } : item));
      return;
    }
    setCart(cart.map(item => item.productId === productId ? { ...item, quantity: newQuantity } : item));
  }

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.priceAtSale * item.quantity, 0);
  };

  const handleProcessSale = async () => {
     if (!isLoggedIn) {
      toast({ title: "Acción no permitida", description: "Debes iniciar sesión para procesar ventas.", variant: "destructive" });
      return;
    }
    if (cart.length === 0) {
      toast({ title: "Carrito Vacío", description: "Por favor, añade artículos al carrito antes de procesar la venta.", variant: "destructive" });
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
            toast({ title: "¡Venta Procesada!", description: `ID Venta: ${result.saleId}. Total: ${currencyFormatter.format(total)}. Inventario actualizado.` });
            setCart([]);
            setSelectedSaleDate(undefined); 
            fetchPageData(); 
        } else {
            let errorDesc = result.error || "Error al procesar la venta.";
            if (result.unavailableItems && result.unavailableItems.length > 0) {
                errorDesc += " No disponibles: " + result.unavailableItems.map(i => `${i.name} (solo quedan ${i.availableStock})`).join(', ');
            }
            toast({ title: "Venta Fallida", description: errorDesc, variant: "destructive" });
            fetchPageData(); 
        }
    });
  };

  return (
    <div className="p-6 space-y-6">
      <PageTitle title="Registro de Ventas" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Añadir Productos a la Venta</CardTitle>
            <CardDescription>Selecciona productos y cantidades para añadir a la venta actual.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="product">Producto</Label>
              {isLoadingProducts ? <Loader2 className="h-5 w-5 animate-spin mt-2" /> : (
                <Select value={selectedProductId} onValueChange={setSelectedProductId} disabled={!isLoggedIn || isPending}>
                  <SelectTrigger id="product">
                    <SelectValue placeholder="Selecciona un producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(product => (
                      <SelectItem key={product.id} value={product.id} disabled={product.stock === 0}>
                        {product.name} (Stock: {product.stock}) - {currencyFormatter.format(product.price)}
                      </SelectItem>
                    ))}
                      {products.length === 0 && !isLoadingProducts && (
                      <SelectItem value="no-products" disabled>No hay productos disponibles o en stock.</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <Label htmlFor="quantity">Cantidad</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                min="1"
                disabled={!isLoggedIn || isPending || isLoadingProducts}
              />
            </div>
            <Button onClick={handleAddToCart} disabled={!isLoggedIn || isPending || isLoadingProducts || !selectedProductId || quantity <= 0} className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" /> Añadir al Carrito
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" /> Venta Actual
            </CardTitle>
            <CardDescription>Revisa los artículos antes de completar la venta.</CardDescription>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto">
            {cart.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">El carrito está vacío</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Artículo</TableHead>
                    <TableHead className="text-center">Cant.</TableHead>
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
                          disabled={!isLoggedIn || isPending}
                        />
                      </TableCell>
                      <TableCell className="text-right">{currencyFormatter.format(item.priceAtSale * item.quantity)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveFromCart(item.productId)} className="text-destructive hover:text-destructive/80" disabled={!isLoggedIn ||isPending}>
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
                <Label htmlFor="sale-date">Fecha de Venta (Opcional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="sale-date"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedSaleDate && "text-muted-foreground"
                      )}
                      disabled={!isLoggedIn || isPending}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedSaleDate ? format(selectedSaleDate, "PPP", { locale: es }) : <span>Elige una fecha (defecto: ahora)</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedSaleDate}
                      onSelect={setSelectedSaleDate}
                      initialFocus
                      disabled={!isLoggedIn || isPending}
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex justify-between w-full text-lg font-semibold">
                <span>Total:</span>
                <span className="text-primary">{currencyFormatter.format(calculateTotal())}</span>
              </div>
              <Button onClick={handleProcessSale} className="w-full mt-2" disabled={!isLoggedIn || isPending || isLoadingProducts}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
                Procesar Venta
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" /> Historial de Ventas
          </CardTitle>
          <CardDescription>Un registro de todas las ventas completadas.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingSalesHistory ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : salesHistory.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Aún no hay ventas registradas.</p>
          ) : (
            <div className="rounded-lg border shadow-sm overflow-hidden max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-center">Artículos Vendidos</TableHead>
                    <TableHead className="text-right">Monto Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesHistory.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>{format(new Date(sale.saleDate), "PPp", { locale: es })}</TableCell>
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
