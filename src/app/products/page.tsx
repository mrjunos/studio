
"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/shared/page-title";
import { PlusCircle, Edit, Trash2, Loader2, ImageIcon, Coffee, Layers, Warehouse } from "lucide-react"; // Added Warehouse
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
import { Card } from "@/components/ui/card"; // Card is used for each product item

const currencyFormatter = new Intl.NumberFormat('es-CO', {
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
  // const [searchTerm, setSearchTerm] = useState(""); // Comentado según la última UI
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

  // Filtrado comentado según la última UI
  // const filteredProducts = products.filter(product =>
  //   product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //   product.category.toLowerCase().includes(searchTerm.toLowerCase())
  // );
  const filteredProducts = products;


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
        <div className="w-full space-y-4"> {/* Asegurando w-full aquí */}
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <Card 
                key={product.id} 
                className="w-full overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer" 
                onClick={() => handleEditProduct(product)}
              >
                <div className="flex items-center p-3 sm:p-4 gap-4">
                  <div className="relative h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 rounded-md overflow-hidden border bg-muted">
                    {product.imageUrl ? (
                      <Image src={product.imageUrl} alt={product.name} layout="fill" objectFit="cover" data-ai-hint="product item coffee" />
                    ) : (
                      <div className="flex items-center justify-center h-full w-full">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="flex-grow min-w-0">
                    <p className="text-base sm:text-lg font-semibold leading-tight truncate" title={product.name}>{product.name}</p>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <Coffee className="mr-1.5 h-3.5 w-3.5 flex-shrink-0" />
                      <span>{product.category}</span>
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-sm text-right space-y-1 ml-4">
                    <div className="flex items-center justify-end">
                       <Warehouse className="mr-1.5 h-4 w-4 text-muted-foreground" />
                       <span className="font-medium tabular-nums">{product.stock}</span>
                    </div>
                    <span className="text-primary font-semibold tabular-nums">{currencyFormatter.format(product.price)}</span>
                  </div>
                  
                  <div className="flex-shrink-0 ml-2 sm:ml-4">
                    <AlertDialog onOpenChange={(open) => { if (!open) { /* Prevents card click when closing dialog */ } }}>
                      <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:bg-destructive/10 h-9 w-9 p-0 flex-shrink-0"
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
                          <AlertDialogCancel disabled={isPending} onClick={(e) => e.stopPropagation()}>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={(e) => {
                               e.stopPropagation();
                               handleDeleteProduct(product.id);
                            }}
                            disabled={isPending}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Eliminar"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-12 col-span-full flex flex-col items-center justify-center h-80 border border-dashed rounded-lg">
               <Layers className="h-16 w-16 text-muted-foreground mb-4" />
               <p className="text-xl font-semibold text-muted-foreground mb-1">No Hay Productos Registrados Aún</p>
               <p className="text-sm text-muted-foreground mb-4">Empieza añadiendo tu primer producto para gestionar tu inventario.</p>
               <Button onClick={handleAddProduct} className="bg-primary hover:bg-primary/90">
                 <PlusCircle className="mr-2 h-4 w-4" /> Añadir Primer Producto
               </Button>
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
