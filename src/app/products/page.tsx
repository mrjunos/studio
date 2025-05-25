
"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/shared/page-title";
import { PlusCircle, Edit, Trash2, Loader2, Image as ImageIcon, Layers, DollarSign } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ProductForm } from "./components/product-form";
import type { Product } from "@/lib/types";
import type { ProductFormInput } from "./actions";
import { getProducts, addProduct, updateProduct, deleteProduct } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const currencyFormatter = new Intl.NumberFormat('es-CO', { // Using Colombian pesos
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState(""); // Mantener por si se añade búsqueda en el futuro
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error: any) {
      toast({ 
        title: "Error al Cargar Productos", 
        description: error.message || "No se pudieron cargar los datos de los productos. Revisa la consola del servidor.", 
        variant: "destructive" 
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    startTransition(async () => {
      const result = await deleteProduct(productId);
      if (result.success) {
        toast({ title: "Producto Eliminado", description: "El producto ha sido eliminado exitosamente." });
        fetchProducts(); 
      } else {
        toast({ title: "Error", description: result.error || "Error al eliminar producto.", variant: "destructive" });
      }
    });
  };

  const handleSubmitProductForm = async (data: ProductFormInput) => {
    let result;
    if (editingProduct) {
      result = await updateProduct(editingProduct.id, data);
    } else {
      result = await addProduct(data);
    }
    
    if (result.success) {
      fetchProducts(); 
    }
    return result; 
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryBadgeVariant = (category: Product["category"]) => {
    switch (category) {
      case "Bebidas":
        return "default";
      case "Alimentos":
        return "secondary";
      case "Mercancía":
          return "outline";
      default:
        return "outline";
    }
  };
  

  return (
    <div className="p-6">
      <PageTitle 
        title="Gestión de Productos" 
        actions={
          <Button onClick={handleAddProduct} className="bg-primary hover:bg-primary/90">
            <PlusCircle className="mr-2 h-4 w-4" /> Añadir Producto
          </Button>
        } 
      />

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div 
          className="grid w-full gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3"
        >
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <Card key={product.id} className="shadow-md flex flex-col">
                <CardHeader className="flex flex-row items-start gap-4 p-4">
                  <div className="relative h-20 w-20 flex-shrink-0 rounded-md overflow-hidden border bg-muted">
                    {product.imageUrl ? (
                      <Image src={product.imageUrl} alt={product.name} layout="fill" objectFit="cover" data-ai-hint="product item" />
                    ) : (
                      <div className="flex items-center justify-center h-full w-full">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <CardTitle className="text-base mb-1 leading-tight">{product.name}</CardTitle>
                    <Badge 
                      variant={getCategoryBadgeVariant(product.category)} 
                      className="capitalize text-xs whitespace-normal text-center px-1.5 py-0.5 h-auto leading-normal"
                    >
                      {product.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 grid grid-cols-2 gap-x-4 gap-y-2 text-sm flex-grow">
                  <div className="flex items-center">
                     <DollarSign className="h-4 w-4 mr-1.5 text-muted-foreground"/>
                     <div>
                        <p className="text-xs text-muted-foreground">Precio</p>
                        <p className="font-semibold">{currencyFormatter.format(product.price)}</p>
                     </div>
                  </div>
                   <div className="flex items-center">
                     <Layers className="h-4 w-4 mr-1.5 text-muted-foreground"/>
                     <div>
                        <p className="text-xs text-muted-foreground">Stock</p>
                        <p className="font-semibold">{product.stock}</p>
                     </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 border-t flex justify-end gap-2 mt-auto">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEditProduct(product)} 
                    className="flex-1 text-xs" 
                    disabled={isPending}
                  >
                    <Edit className="mr-1 h-4 w-4" /> Editar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:bg-destructive/20 hover:text-destructive focus-visible:ring-destructive w-9 h-9 p-0 flex items-center justify-center" 
                        disabled={isPending}
                        aria-label="Eliminar producto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Esto eliminará permanentemente el producto "{product.name}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteProduct(product.id)}
                          disabled={isPending}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Eliminar"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="text-center h-24 col-span-full flex items-center justify-center">
               {searchTerm ? `No se encontraron productos para "${searchTerm}".` : "No se encontraron productos. ¡Intenta añadir algunos!"}
            </div>
          )}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Editar Producto" : "Añadir Nuevo Producto"}</DialogTitle>
            <DialogDescription>
              {editingProduct ? "Actualiza los detalles de este producto." : "Completa los detalles para el nuevo producto."}
            </DialogDescription>
          </DialogHeader>
          <ProductForm
            product={editingProduct}
            onSubmit={handleSubmitProductForm}
            onClose={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
