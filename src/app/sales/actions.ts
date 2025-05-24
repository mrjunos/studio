
"use server";

import { z } from "zod";
import type { Sale, SaleItem, Product } from "@/lib/types";
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, getDoc, writeBatch, Timestamp, increment } from "firebase/firestore";
import { revalidatePath } from 'next/cache';

const SaleItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  quantity: z.number().int().positive(),
  priceAtSale: z.number().positive(),
});

const ProcessSaleInputSchema = z.object({
  items: z.array(SaleItemSchema).min(1, "Cart cannot be empty."),
  totalAmount: z.number().positive(),
});

export type CartItemForAction = z.infer<typeof SaleItemSchema>;

export async function processSale(
  cartItems: CartItemForAction[], 
  totalAmount: number
): Promise<{ success: boolean; saleId?: string; error?: string; unavailableItems?: {productId: string, name: string, availableStock: number}[] }> {
  
  const validation = ProcessSaleInputSchema.safeParse({ items: cartItems, totalAmount });
  if (!validation.success) {
    return { success: false, error: validation.error.errors.map(e => e.message).join(', ') };
  }

  const batch = writeBatch(db);
  const unavailableItems: {productId: string, name: string, availableStock: number}[] = [];

  try {
    // Validate stock and prepare batch updates for products
    for (const item of cartItems) {
      const productRef = doc(db, 'products', item.productId);
      const productDoc = await getDoc(productRef);

      if (!productDoc.exists()) {
        return { success: false, error: `Product ${item.productName} not found.` };
      }
      const productData = productDoc.data() as Product;
      if (productData.stock < item.quantity) {
        unavailableItems.push({ productId: item.productId, name: item.productName, availableStock: productData.stock });
      }
      batch.update(productRef, { stock: increment(-item.quantity) });
    }

    if (unavailableItems.length > 0) {
      return { success: false, error: "One or more items have insufficient stock.", unavailableItems };
    }

    // Create sale record
    const saleData = {
      items: cartItems,
      totalAmount,
      saleDate: Timestamp.now(), // Use Firestore Timestamp for current time
    };
    const salesCollectionRef = collection(db, 'sales');
    const newSaleRef = doc(salesCollectionRef); // Auto-generate ID for the sale
    batch.set(newSaleRef, saleData);

    // Commit all operations
    await batch.commit();

    revalidatePath('/products'); // To reflect updated stock
    // revalidatePath('/sales'); // If there was a sales history page

    return { success: true, saleId: newSaleRef.id };

  } catch (e: any) {
    console.error("Error processing sale: ", e);
    let errorMessage = "Failed to process sale.";
    if (e.code === 'permission-denied') {
      errorMessage = "Firestore permission denied. Please check your security rules.";
    } else if (e.message.includes("stock") || e.message.includes("product")) { // Basic check for custom errors
        errorMessage = e.message;
    }
    return { success: false, error: errorMessage };
  }
}
