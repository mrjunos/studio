
"use server";

import { suggestProductCategory, SuggestProductCategoryInput, SuggestProductCategoryOutput } from "@/ai/flows/suggest-product-category";
import { z } from "zod";
import type { Product, ProductCategory } from "@/lib/types";
import { productCategories } from "@/lib/types"; // Imported from types.ts

// Dummy data store for products (replace with actual database logic)
let products: Product[] = [
  { id: "1", name: "Espresso", category: "Drinks", price: 2.50, stock: 100, imageUrl: "https://placehold.co/400x300.png?text=Espresso" },
  { id: "2", name: "Croissant", category: "Food", price: 3.00, stock: 50, imageUrl: "https://placehold.co/400x300.png?text=Croissant" },
  { id: "3", name: "Coffee Mug", category: "Merchandise", price: 12.00, stock: 20, imageUrl: "https://placehold.co/400x300.png?text=Mug" },
];

const ProductSchema = z.object({
  id: z.string().optional(), // Optional for new products
  name: z.string().min(2, "Product name must be at least 2 characters"),
  category: z.enum(productCategories),
  price: z.number().min(0.01, "Price must be positive"),
  stock: z.number().int().min(0, "Stock cannot be negative"),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

export type ProductFormInput = z.infer<typeof ProductSchema>;

export async function getProducts(): Promise<Product[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return products;
}

export async function addProduct(data: ProductFormInput): Promise<{ success: boolean; product?: Product; error?: string }> {
  const validation = ProductSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.errors.map(e => e.message).join(', ') };
  }

  const newProduct: Product = {
    ...validation.data,
    id: String(Date.now()), // Simple ID generation
    category: validation.data.category as ProductCategory, // Ensure type
    imageUrl: validation.data.imageUrl || `https://placehold.co/400x300.png?text=${encodeURIComponent(validation.data.name)}`,
  };
  products.push(newProduct);
  return { success: true, product: newProduct };
}

export async function updateProduct(id: string, data: ProductFormInput): Promise<{ success: boolean; product?: Product; error?: string }> {
  const validation = ProductSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.errors.map(e => e.message).join(', ') };
  }

  const productIndex = products.findIndex(p => p.id === id);
  if (productIndex === -1) {
    return { success: false, error: "Product not found" };
  }

  const updatedProduct: Product = {
    ...products[productIndex],
    ...validation.data,
    category: validation.data.category as ProductCategory,
    imageUrl: validation.data.imageUrl || products[productIndex].imageUrl || `https://placehold.co/400x300.png?text=${encodeURIComponent(validation.data.name)}`,
  };
  products[productIndex] = updatedProduct;
  return { success: true, product: updatedProduct };
}

export async function deleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
  products = products.filter(p => p.id !== id);
  return { success: true };
}

export async function handleSuggestCategory(productName: string): Promise<{ category?: ProductCategory; error?: string }> {
  if (!productName || productName.trim().length < 2) {
    return { error: "Product name must be at least 2 characters long." };
  }
  try {
    const input: SuggestProductCategoryInput = { productName };
    const result: SuggestProductCategoryOutput = await suggestProductCategory(input);
    // Ensure the suggested category is one of our valid types
    if (productCategories.includes(result.category as ProductCategory)) {
      return { category: result.category as ProductCategory };
    }
    return { category: "Uncategorized" }; // Default if AI suggests something outside our enum
  } catch (error) {
    console.error("AI Category Suggestion Error:", error);
    return { error: "Failed to suggest category. Please select manually." };
  }
}
