
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
import { PlusCircle, Loader2 } from "lucide-react";
import type { Product, InventoryAdjustment } from "@/lib/types";
import { getProducts } from "@/app/products/actions";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import { getInventoryAdjustments, addInventoryAdjustment, type InventoryAdjustmentFormInput } from "./actions";

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingAdjustments, setIsLoadingAdjustments] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantityChange, setQuantityChange] = useState<number | string>(""); 
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
      toast({ title: "Error", description: error.message || "No se pudieron cargar los datos de la página.", variant: "destructive" });
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
      toast({ title: "Entrada Inválida", description: "Por favor, selecciona un producto e ingresa un cambio de cantidad válido y diferente de cero.", variant: "destructive" });
      return;
    }
    
    const product = products.find(p => p.id === selectedProductId);
    if (!product) {
      toast({ title: "Producto No Encontrado", variant: "destructive" });
      return;
    }

    const numericQuantityChange = Number(quantityChange);
    if (isNaN(numericQuantityChange)) {
       toast({ title: "Cantidad Inválida", description: "El cambio de cantidad debe ser un número.", variant: "destructive" });
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
        toast({ title: "Inventario Ajustado", description: `El stock de ${product.name} cambió en ${numericQuantityChange}.` });
        fetchPageData(); 
        setIsDialogOpen(false);
      } else {
        toast({ title: "Ajuste Fallido", description: result.error || "Ocurrió un error inesperado.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="p-6">
      <PageTitle 
        title="Ajustes de Inventario" 
        actions={
          <Button onClick={handleAddAdjustmentDialog} className="bg-primary hover:bg-primary/90" disabled={isPending || isLoadingProducts}>
            <PlusCircle className="mr-2 h-4 w-4" /> Nuevo Ajuste
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
                <TableHead>Fecha</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Cambio Cantidad</TableHead>
                <TableHead>Razón</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adjustments.length > 0 ? (
                adjustments.map((adj) => (
                  <TableRow key={adj.id}>
                    <TableCell>{format(new Date(adj.adjustmentDate), "PPp", { locale: es })}</TableCell>
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
                    Aún no hay ajustes de inventario registrados.
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
            <DialogTitle>Nuevo Ajuste de Inventario</DialogTitle>
            <DialogDescription>
              Ajusta el nivel de stock de un producto. Usa valores negativos para disminuciones.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product-select">Producto</Label>
              {isLoadingProducts ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <Select value={selectedProductId} onValueChange={setSelectedProductId} disabled={isPending}>
                  <SelectTrigger id="product-select">
                    <SelectValue placeholder="Selecciona un producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} (Stock Actual: {product.stock})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity-change">Cambio de Cantidad</Label>
              <Input 
                id="quantity-change" 
                type="number"
                placeholder="Ej: 10 o -5"
                value={quantityChange}
                onChange={(e) => setQuantityChange(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Razón (Opcional)</Label>
              <Textarea 
                id="reason" 
                placeholder="Ej: Corrección de inventario, Mercancía dañada"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>Cancelar</Button>
            </DialogClose>
            <Button type="submit" onClick={handleSubmitAdjustment} disabled={isPending || isLoadingProducts}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Aplicar Ajuste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
