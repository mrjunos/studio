
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Lightbulb, Loader2, Save } from "lucide-react";
import type { Product, ProductCategory } from "@/lib/types";
import { productCategories } from "@/lib/types"; 
import { type ProductFormInput, handleSuggestCategory } from "../actions";
import { useState, useTransition } from "react";
import Image from "next/image";

const ProductFormSchema = z.object({
  name: z.string().min(2, "El nombre del producto debe tener al menos 2 caracteres"),
  category: z.enum(productCategories as [ProductCategory, ...ProductCategory[]], { required_error: "La categoría es obligatoria"}),
  price: z.coerce.number().min(0.01, "El precio debe ser positivo"),
  stock: z.coerce.number().int().min(0, "El stock no puede ser negativo"),
  imageUrl: z.string().url("Debe ser una URL válida").optional().or(z.literal('')),
});


interface ProductFormProps {
  product?: Product | null;
  onSubmit: (data: ProductFormInput) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
}

export function ProductForm({ product, onSubmit, onClose }: ProductFormProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isSuggesting, setIsSuggesting] = useState(false);

  const form = useForm<ProductFormInput>({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: {
      name: product?.name || "",
      category: product?.category || undefined,
      price: product?.price || 0,
      stock: product?.stock || 0,
      imageUrl: product?.imageUrl || "",
    },
  });

  const currentImageUrl = form.watch("imageUrl") || (product?.imageUrl || "");

  async function processSubmit(data: ProductFormInput) {
    startTransition(async () => {
      const result = await onSubmit(data);
      if (result.success) {
        toast({
          title: product ? "Producto Actualizado" : "Producto Añadido",
          description: `${data.name} ha sido ${product ? 'actualizado' : 'añadido'} exitosamente.`,
        });
        onClose();
      } else {
        toast({
          title: "Error",
          description: result.error || "Ocurrió un error inesperado.",
          variant: "destructive",
        });
      }
    });
  }

  async function onSuggestCategory() {
    const productName = form.getValues("name");
    if (!productName) {
      toast({
        title: "Falta Nombre del Producto",
        description: "Por favor, ingresa un nombre de producto para sugerir una categoría.",
        variant: "destructive",
      });
      return;
    }
    setIsSuggesting(true);
    startTransition(async () => {
      const result = await handleSuggestCategory(productName);
      if (result.category) {
        form.setValue("category", result.category, { shouldValidate: true });
        toast({
          title: "Categoría Sugerida",
          description: `Categoría sugerida: ${result.category}`,
        });
      } else {
        toast({
          title: "Sugerencia Fallida",
          description: result.error || "No se pudo sugerir una categoría.",
          variant: "destructive",
        });
      }
      setIsSuggesting(false);
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(processSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Producto</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Latte, Croissant, Bolsa de Café" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoría</FormLabel>
              <div className="flex items-center gap-2">
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {productCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={onSuggestCategory}
                  disabled={isSuggesting || isPending}
                  aria-label="Sugerir Categoría"
                >
                  {isSuggesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}
                </Button>
              </div>
              <FormDescription>
                Selecciona la categoría o usa el bombillo para una sugerencia IA.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio ($)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock Actual</FormLabel>
                <FormControl>
                  <Input type="number" step="1" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL de Imagen (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="https://ejemplo.com/imagen.png" {...field} />
              </FormControl>
              {currentImageUrl && (
                 <div className="mt-2 relative w-32 h-32 rounded-md overflow-hidden border">
                    <Image src={currentImageUrl} alt="Vista Previa del Producto" layout="fill" objectFit="cover" data-ai-hint="product image" />
                 </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending || isSuggesting}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {product ? "Guardar Cambios" : "Añadir Producto"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
