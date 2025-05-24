// src/app/products/actions.ts
"use server";

import { suggestProductCategory, SuggestProductCategoryInput, SuggestProductCategoryOutput } from "@/ai/flows/suggest-product-category";
import { z } from "zod";
import type { Product, ProductCategory } from "@/lib/types";
import { productCategories } from "@/lib/types";
import { db } from "@/lib/firebase"; // Import Firestore instance
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import { revalidatePath } from 'next/cache';

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
  try {
    const productsCollection = collection(db, 'products');
    const productSnapshot = await getDocs(productsCollection);
    const productList = productSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<Product, 'id'> // Cast data and omit 'id'
    }));
    return productList;
  } catch (error: any) { // Added :any to access error.code
    let errorMessage = "Failed to fetch products. Please check server logs for details.";
    if (error.code === 'permission-denied') {
      errorMessage = "Firestore permission denied. Please check your security rules in the Firebase console.";
      console.error("Firestore permission denied while fetching products. Original error:", error);
    } else {
      console.error("Error fetching products:", error);
    }
    // For a better UX, especially if this function were called directly from a component
    // without a robust error handling layer, returning an object with an error field
    // might be preferable. However, throwing here is consistent with how ProductsPage handles it.
    throw new Error(errorMessage);
  }
}

export async function addProduct(data: ProductFormInput): Promise<{ success: boolean; product?: Product; error?: string }> {
  const validation = ProductSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.errors.map(e => e.message).join(', ') };
  }

  try {
    // Prepare data to be added to Firestore
    const productData = {
      name: validation.data.name,
      category: validation.data.category,
      price: validation.data.price,
      stock: validation.data.stock,
      imageUrl: validation.data.imageUrl || `https://placehold.co/400x300.png?text=${encodeURIComponent(validation.data.name)}`,
    };

    const docRef = await addDoc(collection(db, 'products'), productData);

    // Revalidate the products page to show the new product
    revalidatePath('/products');

    return { success: true, product: { id: docRef.id, ...productData as Omit<Product, 'id'> } };
  } catch (e: any) {
    console.error("Error adding document: ", e);
    let errorMessage = "Failed to add product.";
    if (e.code === 'permission-denied') {
      errorMessage = "Firestore permission denied. Please check your security rules.";
    }
    return { success: false, error: errorMessage };
  }
}

export async function updateProduct(id: string, data: ProductFormInput): Promise<{ success: boolean; product?: Product; error?: string }> {
  const validation = ProductSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.errors.map(e => e.message).join(', ') };
  }

  try {
    const productRef = doc(db, 'products', id);
    const productDoc = await getDoc(productRef);

    if (!productDoc.exists()) {
      return { success: false, error: "Product not found" };
    }

    // Prepare data for update
    const updatedData = {
      name: validation.data.name,
      category: validation.data.category,
      price: validation.data.price,
      stock: validation.data.stock,
      imageUrl: validation.data.imageUrl === '' ? `https://placehold.co/400x300.png?text=${encodeURIComponent(validation.data.name)}` : validation.data.imageUrl,
    };

    await updateDoc(productRef, updatedData);

    // Revalidate the products page to show the updated product
    revalidatePath('/products');

    // Fetch the updated document to return the full product data
    const updatedProductDoc = await getDoc(productRef);
    const updatedProduct = { id: updatedProductDoc.id, ...updatedProductDoc.data() as Omit<Product, 'id'> };

    return { success: true, product: updatedProduct };
  } catch (e: any) {
    console.error("Error updating document: ", e);
    let errorMessage = "Failed to update product.";
    if (e.code === 'permission-denied') {
      errorMessage = "Firestore permission denied. Please check your security rules.";
    }
    return { success: false, error: errorMessage };
  }
}

export async function deleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const productRef = doc(db, 'products', id);
    await deleteDoc(productRef);

    // Revalidate the products page to remove the deleted product
    revalidatePath('/products');

    return { success: true };
  } catch (e: any) {
    console.error("Error deleting document: ", e);
    let errorMessage = "Failed to delete product.";
    if (e.code === 'permission-denied') {
      errorMessage = "Firestore permission denied. Please check your security rules.";
    }
    return { success: false, error: errorMessage };
  }
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
    return { category: "Uncategorized" as ProductCategory }; // Default if AI suggests something outside our enum
  } catch (error) {
    console.error("AI Category Suggestion Error:", error);
    return { error: "Failed to suggest category. Please select manually." };
  }
}
