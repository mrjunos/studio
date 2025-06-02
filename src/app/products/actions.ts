
// src/app/products/actions.ts
"use server";

import { suggestProductCategory, type SuggestProductCategoryInput, type SuggestProductCategoryOutput } from "@/ai/flows/suggest-product-category";
import { z } from "zod";
import type { Product, ProductCategory } from "@/lib/types";
import { productCategories } from "@/lib/types"; 
import { getDb } from "@/lib/firebase"; // Use getDb
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import { revalidatePath } from 'next/cache';

// TODO: Implement server-side authentication check for all write operations.
// Example: Check request headers for an ID token and verify it with Firebase Admin SDK.

const ProductSchema = z.object({
  id: z.string().optional(), 
  name: z.string().min(2, "El nombre del producto debe tener al menos 2 caracteres"),
  category: z.enum(productCategories as [ProductCategory, ...ProductCategory[]], { required_error: "La categoría es obligatoria"}),
  price: z.number().min(0.01, "El precio debe ser positivo"),
  stock: z.number().int().min(0, "El stock no puede ser negativo"),
  imageUrl: z.string().url("Debe ser una URL válida").optional().or(z.literal('')),
});

export type ProductFormInput = z.infer<typeof ProductSchema>;

export async function getProducts(): Promise<Product[]> {
  try {
    const db = getDb();
    const productsCollection = collection(db, 'products');
    const productSnapshot = await getDocs(productsCollection);
    const productList = productSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<Product, 'id'> 
    }));
    return productList;
  } catch (error: any) { 
    console.error("Error al obtener productos:", error);
    let errorMessage = "Error al obtener productos. Revisa los logs del servidor.";
    if (error.code === 'permission-denied') {
      errorMessage = "Permiso denegado en Firestore. Revisa tus reglas de seguridad en la consola de Firebase.";
    } else if (error.message && (error.message.includes("Firebase app is not configured") || error.message.includes("Firebase projectId is not defined") || error.message.includes("Firebase app initialization failed"))) {
      errorMessage = "La aplicación Firebase no está configurada correctamente o falló al inicializar. Verifica las variables de entorno y los logs del servidor.";
    }
    throw new Error(errorMessage);
  }
}

export async function addProduct(data: ProductFormInput): Promise<{ success: boolean; product?: Product; error?: string }> {
  // Placeholder: Add server-side auth check here
  const validation = ProductSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.errors.map(e => e.message).join(', ') };
  }

  try {
    const db = getDb();
    const productData = {
      name: validation.data.name,
      category: validation.data.category,
      price: validation.data.price,
      stock: validation.data.stock,
      imageUrl: validation.data.imageUrl || `https://placehold.co/400x300.png?text=${encodeURIComponent(validation.data.name)}`,
    };

    const docRef = await addDoc(collection(db, 'products'), productData);
    revalidatePath('/products');
    revalidatePath('/'); 

    return { success: true, product: { id: docRef.id, ...productData as Omit<Product, 'id'> } };
  } catch (e: any) {
    console.error("Error al añadir documento: ", e);
    let errorMessage = "Error al añadir producto.";
    if (e.code === 'permission-denied') {
      errorMessage = "Permiso denegado en Firestore. Revisa tus reglas de seguridad.";
    } else if (e.message && (e.message.includes("Firebase app is not configured") || e.message.includes("Firebase projectId is not defined") || e.message.includes("Firebase app initialization failed"))) {
      errorMessage = "La aplicación Firebase no está configurada correctamente o falló al inicializar. Verifica las variables de entorno y los logs del servidor.";
    }
    return { success: false, error: errorMessage };
  }
}

export async function updateProduct(id: string, data: ProductFormInput): Promise<{ success: boolean; product?: Product; error?: string }> {
  // Placeholder: Add server-side auth check here
  const validation = ProductSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.errors.map(e => e.message).join(', ') };
  }

  try {
    const db = getDb();
    const productRef = doc(db, 'products', id);
    const productDoc = await getDoc(productRef);

    if (!productDoc.exists()) {
      return { success: false, error: "Producto no encontrado" };
    }

    const updatedData = {
      name: validation.data.name,
      category: validation.data.category,
      price: validation.data.price,
      stock: validation.data.stock,
      imageUrl: validation.data.imageUrl === '' ? `https://placehold.co/400x300.png?text=${encodeURIComponent(validation.data.name)}` : validation.data.imageUrl,
    };

    await updateDoc(productRef, updatedData);
    revalidatePath('/products');
    revalidatePath('/'); 

    const updatedProductDoc = await getDoc(productRef); // Re-fetch to get potentially server-modified data
    const updatedProduct = { id: updatedProductDoc.id, ...updatedProductDoc.data() as Omit<Product, 'id'> };

    return { success: true, product: updatedProduct };
  } catch (e: any) {
    console.error("Error al actualizar documento: ", e);
    let errorMessage = "Error al actualizar producto.";
    if (e.code === 'permission-denied') {
      errorMessage = "Permiso denegado en Firestore. Revisa tus reglas de seguridad.";
    } else if (e.message && (e.message.includes("Firebase app is not configured") || e.message.includes("Firebase projectId is not defined") || e.message.includes("Firebase app initialization failed"))) {
      errorMessage = "La aplicación Firebase no está configurada correctamente o falló al inicializar. Verifica las variables de entorno y los logs del servidor.";
    }
    return { success: false, error: errorMessage };
  }
}

export async function deleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
  // Placeholder: Add server-side auth check here
  try {
    const db = getDb();
    const productRef = doc(db, 'products', id);
    await deleteDoc(productRef);
    revalidatePath('/products');
    revalidatePath('/'); 
    return { success: true };
  } catch (e: any) {
    console.error("Error al eliminar documento: ", e);
    let errorMessage = "Error al eliminar producto.";
    if (e.code === 'permission-denied') {
      errorMessage = "Permiso denegado en Firestore. Revisa tus reglas de seguridad.";
    } else if (e.message && (e.message.includes("Firebase app is not configured") || e.message.includes("Firebase projectId is not defined") || e.message.includes("Firebase app initialization failed"))) {
      errorMessage = "La aplicación Firebase no está configurada correctamente o falló al inicializar. Verifica las variables de entorno y los logs del servidor.";
    }
    return { success: false, error: errorMessage };
  }
}

export async function handleSuggestCategory(productName: string): Promise<{ category?: ProductCategory; error?: string }> {
  if (!productName || productName.trim().length < 2) {
    return { error: "El nombre del producto debe tener al menos 2 caracteres." };
  }
  try {
    const input: SuggestProductCategoryInput = { productName };
    const result: SuggestProductCategoryOutput = await suggestProductCategory(input);
    if (productCategories.includes(result.category as ProductCategory)) {
      return { category: result.category as ProductCategory };
    }
    // If the category from AI is not in our predefined list, we could either return it as is,
    // or return an error/undefined. For now, let's return it, but this might need refinement.
    return { category: result.category as ProductCategory };
  } catch (error) {
    console.error("Error en sugerencia de categoría por IA:", error);
    return { error: "Error al sugerir categoría. Por favor, selecciona manualmente." };
  }
}
    