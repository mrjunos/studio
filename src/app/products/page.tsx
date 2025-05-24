
"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/shared/page-title";
import { PlusCircle, Edit, Trash2, Loader2, Search, Image as ImageIcon, Package2,DollarSign, Layers } from "lucide-react";
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
} from "@/components/ui/dialog";
import { ProductForm } from "./components/product-form";
import type { Product } from "@/lib/types";
import type { ProductFormInput } from "./actions";
import { getProducts, addProduct, updateProduct, deleteProduct } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error: any) {
      toast({ 
        title: "Error Fetching Products", 
        description: error.message || "Could not load product data. Check server console for details.", 
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
        toast({ title: "Product Deleted", description: "The product has been successfully deleted." });
        fetchProducts(); // Refresh list
      } else {
        toast({ title: "Error", description: result.error || "Failed to delete product.", variant: "destructive" });
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
      fetchProducts(); // Refresh list
    }
    return result; // This will be handled by ProductForm for toast messages
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryBadgeVariant = (category: Product["category"]) => {
    switch (category) {
      case "Bolsa de Café":
        return "default";
      case "Aji":
        return "secondary";
      // Add other specific categories here if needed
      default:
        return "outline";
    }
  };

  return (
    <>
      <PageTitle 
        title="Product Management" 
        actions={
          <Button onClick={handleAddProduct} className="bg-primary hover:bg-primary/90">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Product
          </Button>
        } 
      />

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="rounded-lg border shadow-sm overflow-hidden hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="relative h-12 w-12 rounded-md overflow-hidden border bg-muted">
                          {product.imageUrl ? (
                            <Image src={product.imageUrl} alt={product.name} layout="fill" objectFit="cover" data-ai-hint="product item" />
                          ) : (
                            <div className="flex items-center justify-center h-full w-full">
                              <ImageIcon className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        <Badge variant={getCategoryBadgeVariant(product.category)} className="capitalize">
                          {product.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{product.stock}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEditProduct(product)} className="mr-2 hover:text-accent" disabled={isPending}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="hover:text-destructive" disabled={isPending}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the product "{product.name}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteProduct(product.id)}
                                disabled={isPending}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      {searchTerm ? `No products found for "${searchTerm}".` : "No products found. Try adding some!"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <Card key={product.id} className="shadow-md">
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
                  <CardContent className="p-4 pt-0 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div className="flex items-center">
                       <DollarSign className="h-4 w-4 mr-1.5 text-muted-foreground"/>
                       <div>
                          <p className="text-xs text-muted-foreground">Price</p>
                          <p className="font-semibold">${product.price.toFixed(2)}</p>
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
                  <CardFooter className="p-4 border-t flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditProduct(product)} className="text-xs flex-1 sm:flex-none" disabled={isPending}>
                      <Edit className="mr-1 h-3.5 w-3.5" /> Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="text-xs flex-1 sm:flex-none" disabled={isPending}>
                          <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the product "{product.name}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteProduct(product.id)}
                            disabled={isPending}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="text-center h-24 col-span-full flex items-center justify-center">
                 {searchTerm ? `No products found for "${searchTerm}".` : "No products found. Try adding some!"}
              </div>
            )}
          </div>
        </>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
            <DialogDescription>
              {editingProduct ? "Update the details of this product." : "Fill in the details for the new product."}
            </DialogDescription>
          </DialogHeader>
          <ProductForm
            product={editingProduct}
            onSubmit={handleSubmitProductForm}
            onClose={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
