
"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { PageTitle } from "@/components/shared/page-title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, XCircle, ShoppingCart, Loader2, History, Calendar as CalendarIcon, Edit, Ban } from "lucide-react";
import type { Product, Sale } from "@/lib/types";
import { getProducts } from "@/app/products/actions";
import { useToast } from "@/hooks/use-toast";
import { processSale, getSales, updateSale, type CartItemForAction } from "./actions";
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
  const [allProductsForLookup, setAllProductsForLookup] = useState<Product[]>([]); // To find product details for editing old sales
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

  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const saleCardRef = useRef<HTMLDivElement>(null);


  const fetchPageData = async () => {
    setIsLoadingProducts(true);
    setIsLoadingSalesHistory(true);
    try {
      const [fetchedProducts, fetchedSales] = await Promise.all([
        getProducts(), // This usually filters by stock > 0
        getSales()
      ]);
      // Store all fetched products for lookup, even if out of stock, for editing purposes.
      // getProducts() might need adjustment if it strictly filters out 0-stock items and we need them for lookup.
      // For now, assume getProducts gives all products or we handle missing products gracefully.
      setAllProductsForLookup(fetchedProducts); 
      setProducts(fetchedProducts.filter(p => p.stock > 0 || cart.some(ci => ci.productId === p.id))); // Keep products in cart even if stock becomes 0
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
  
  // Refetch products when cart changes to potentially re-include items that went out of stock but are in cart
  useEffect(() => {
    if (!isLoadingProducts) { // Avoid refetching if initial load is happening
        const productsInCartIds = cart.map(item => item.productId);
        const newAvailableProducts = allProductsForLookup.filter(p => p.stock > 0 || productsInCartIds.includes(p.id));
        setProducts(newAvailableProducts);
    }
  }, [cart, allProductsForLookup, isLoadingProducts]);


  const handleAddToCart = () => {
    if (!isLoggedIn) {
      toast({ title: "Acción no permitida", description: "Debes iniciar sesión para añadir al carrito.", variant: "destructive" });
      return;
    }
    if (!selectedProductId || quantity <= 0) {
      toast({ title: "Entrada Inválida", description: "Por favor, selecciona un producto e ingresa una cantidad válida.", variant: "destructive" });
      return;
    }

    const product = allProductsForLookup.find(p => p.id === selectedProductId); // Use allProductsForLookup
    if (!product) {
       toast({ title: "Producto No Encontrado", description: "El producto seleccionado no es válido.", variant: "destructive" });
       fetchPageData();
       return;
    }
    
    const existingCartItem = cart.find(item => item.productId === selectedProductId);
    const quantityInCart = existingCartItem?.quantity || 0;

    if (!isEditing && product.stock <= 0) { // For new sales, don't add if stock is 0
        toast({ title: "Agotado", description: `${product.name} está actualmente agotado.`, variant: "destructive"});
        return;
    }
    if (!isEditing && (quantity + quantityInCart) > product.stock) {
      toast({ title: "Stock Insuficiente", description: `Solo hay ${product.stock - quantityInCart} unidades de ${product.name} disponibles para añadir.`, variant: "destructive"});
      return;
    }
     // For editing, allow original quantity even if current stock is lower, but cap increases to current_stock - (current_cart_qty - original_sale_qty)
    if (isEditing && existingCartItem) {
        const originalSale = salesHistory.find(s => s.id === editingSaleId);
        const originalItemInSale = originalSale?.items.find(i => i.productId === selectedProductId);
        const originalQuantityInSale = originalItemInSale?.quantity || 0;

        if (quantity > originalQuantityInSale && (quantity - originalQuantityInSale) > product.stock) {
             toast({ title: "Stock Insuficiente para Aumentar", description: `Solo puedes aumentar en ${product.stock} unidades más de ${product.name} sobre la cantidad original de la venta.`, variant: "destructive"});
             return;
        }
    } else if (isEditing && !existingCartItem && quantity > product.stock) { // Adding a new item while editing
        toast({ title: "Stock Insuficiente", description: `Solo hay ${product.stock} unidades de ${product.name} disponibles.`, variant: "destructive"});
        return;
    }


    if (existingCartItem) {
      const updatedCart = cart.map(item => 
        item.productId === selectedProductId 
          ? { ...item, quantity: item.quantity + quantity } 
          : item
      );
      setCart(updatedCart);
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        quantity,
        priceAtSale: product.price, // Use current price when adding new
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

  const handleUpdateQuantityInCart = (productId: string, newQuantityStr: string) => {
    const newQuantity = parseInt(newQuantityStr);
    const product = allProductsForLookup.find(p => p.id === productId);

    if (!product) return;

    if (isNaN(newQuantity) || newQuantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    
    // Similar stock check logic as in handleAddToCart, considering edit mode
    if (isEditing) {
        const originalSale = salesHistory.find(s => s.id === editingSaleId);
        const originalItemInSale = originalSale?.items.find(i => i.productId === productId);
        const originalQuantityInSale = originalItemInSale?.quantity || 0;

        if (newQuantity > originalQuantityInSale && (newQuantity - originalQuantityInSale) > product.stock) {
            toast({ title: "Stock Insuficiente para Aumentar", description: `Solo puedes aumentar en ${product.stock} unidades sobre la cantidad original. Stock actual: ${product.stock}. Original en venta: ${originalQuantityInSale}.`, variant: "destructive"});
            // Optionally set to max possible: originalQuantityInSale + product.stock
            setCart(cart.map(item => item.productId === productId ? { ...item, quantity: Math.min(newQuantity, originalQuantityInSale + product.stock) } : item));
            return;
        }
    } else { // Not editing, standard stock check
        if (newQuantity > product.stock) {
            toast({ title: "Stock Insuficiente", description: `Solo hay ${product.stock} unidades de ${product.name} disponibles.`, variant: "destructive"});
            setCart(cart.map(item => item.productId === productId ? { ...item, quantity: product.stock } : item));
            return;
        }
    }
    setCart(cart.map(item => item.productId === productId ? { ...item, quantity: newQuantity } : item));
  }

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.priceAtSale * item.quantity, 0);
  };

  const resetSaleForm = () => {
    setCart([]);
    setSelectedSaleDate(undefined);
    setSelectedProductId("");
    setQuantity(1);
    setIsEditing(false);
    setEditingSaleId(null);
  }

  const handleSaveSale = async () => {
     if (!isLoggedIn) {
      toast({ title: "Acción no permitida", description: "Debes iniciar sesión para gestionar ventas.", variant: "destructive" });
      return;
    }
    if (cart.length === 0) {
      toast({ title: "Carrito Vacío", description: "Por favor, añade artículos al carrito.", variant: "destructive" });
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
        let result;
        if (isEditing && editingSaleId) {
            result = await updateSale(editingSaleId, itemsForAction, total, selectedSaleDate);
            if (result.success) {
                toast({ title: "¡Venta Actualizada!", description: `Venta ID: ${editingSaleId} actualizada. Total: ${currencyFormatter.format(total)}.` });
            }
        } else {
            result = await processSale(itemsForAction, total, selectedSaleDate);
             if (result.success && result.saleId) {
                toast({ title: "¡Venta Procesada!", description: `ID Venta: ${result.saleId}. Total: ${currencyFormatter.format(total)}. Inventario actualizado.` });
            }
        }

        if (result.success) {
            resetSaleForm();
            fetchPageData();
        } else {
            let errorDesc = result.error || `Error al ${isEditing ? 'actualizar' : 'procesar'} la venta.`;
            // This part is specific to processSale, updateSale does not return unavailableItems currently
            if ('unavailableItems' in result && result.unavailableItems && result.unavailableItems.length > 0) {
                errorDesc += " No disponibles: " + result.unavailableItems.map(i => `${i.name} (solo quedan ${i.availableStock})`).join(', ');
            }
            toast({ title: "Operación Fallida", description: errorDesc, variant: "destructive" });
            if (!isEditing) fetchPageData(); // Refresh products if it was a new sale attempt that failed due to stock
        }
    });
  };
  
  const handleEditSaleClick = (sale: Sale) => {
    if (!isLoggedIn) {
      toast({ title: "Acción no permitida", description: "Debes iniciar sesión para editar ventas.", variant: "destructive" });
      return;
    }
    setEditingSaleId(sale.id);
    setIsEditing(true);
    // When loading a sale for edit, ensure products in the sale are available in the 'products' state for selection/display, even if stock is 0.
    // The `useEffect` reacting to `cart` changes helps here.
    setCart(sale.items.map(item => ({...item}))); // Create new objects for cart items
    setSelectedSaleDate(new Date(sale.saleDate));
    toast({ title: "Editando Venta", description: `Cargada la venta ID: ${sale.id} para edición.`});
    if (saleCardRef.current) {
      saleCardRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }

  const handleCancelEdit = () => {
    resetSaleForm();
    toast({ title: "Edición Cancelada"});
  }


  return (
    <div className="p-6 space-y-6">
      <PageTitle title="Registro de Ventas" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-md" ref={saleCardRef}>
          <CardHeader>
            <CardTitle>{isEditing ? "Editando Venta" : "Añadir Productos a la Venta"}</CardTitle>
            <CardDescription>
              {isEditing 
                ? `Modifica los artículos y detalles de la venta ID: ${editingSaleId}. Los cambios de stock no se aplican retroactivamente.`
                : "Selecciona productos y cantidades para añadir a la venta actual."
              }
            </CardDescription>
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
                    {products
                        .sort((a,b) => a.name.localeCompare(b.name)) // Sort products alphabetically
                        .map(product => (
                      <SelectItem 
                        key={product.id} 
                        value={product.id} 
                        disabled={!isEditing && product.stock === 0} // Allow selecting 0-stock if editing (could be part of original sale)
                      >
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
              <ShoppingCart className="h-5 w-5 text-primary" /> {isEditing ? `Detalles de Venta (ID: ${editingSaleId})` : "Venta Actual"}
            </CardTitle>
            <CardDescription>Revisa los artículos antes de {isEditing ? 'actualizar' : 'completar'} la venta.</CardDescription>
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
                          onChange={(e) => handleUpdateQuantityInCart(item.productId, e.target.value)}
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
                <Label htmlFor="sale-date">Fecha de Venta</Label>
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
                      disabledDays={isEditing ? [] : { before: new Date(0) }} // Allow any date if editing, only past/present for new. Or remove restriction.
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
              <div className="flex w-full gap-2 mt-2">
                {isEditing && (
                  <Button onClick={handleCancelEdit} variant="outline" className="flex-1" disabled={isPending}>
                     <Ban className="mr-2 h-4 w-4" /> Cancelar Edición
                  </Button>
                )}
                <Button onClick={handleSaveSale} className="flex-1" disabled={!isLoggedIn || isPending || isLoadingProducts}>
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
                  {isEditing ? "Actualizar Venta" : "Procesar Venta"}
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" /> Historial de Ventas
          </CardTitle>
          <CardDescription>Un registro de todas las ventas completadas. Haz clic en "Editar" para modificar una venta.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingSalesHistory ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : salesHistory.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Aún no hay ventas registradas.</p>
          ) : (
            <div className="rounded-lg border shadow-sm overflow-hidden max-h-[40rem] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-center">Artículos</TableHead>
                    <TableHead className="text-right">Monto Total</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
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
                      <TableCell className="text-right">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEditSaleClick(sale)}
                            disabled={!isLoggedIn || isPending}
                            className="hover:bg-accent hover:text-accent-foreground"
                        >
                           <Edit className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" /> Editar
                        </Button>
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

