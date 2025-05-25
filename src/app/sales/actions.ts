
"use server";

import { z } from "zod";
import type { Sale, SaleItem, Product } from "@/lib/types";
import { getDb } from "@/lib/firebase"; // Use getDb
import { collection, addDoc, doc, getDoc, writeBatch, Timestamp, increment, getDocs, query, orderBy } from "firebase/firestore";
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

// Helper to convert Firestore Timestamps to ISO strings for dates
const convertSaleTimestampsToISO = (data: any): any => {
  if (data && data.saleDate instanceof Timestamp) {
    return { ...data, saleDate: data.saleDate.toDate().toISOString() };
  }
  return data;
};

export async function getSales(): Promise<Sale[]> {
  try {
    const db = getDb();
    const salesCollection = collection(db, 'sales');
    const q = query(salesCollection, orderBy("saleDate", "desc"));
    const salesSnapshot = await getDocs(q);
    const salesList = salesSnapshot.docs.map(doc => {
      const data = doc.data();
      // Calculate total items for display if needed, or do it client-side
      // const totalItems = data.items.reduce((sum, item) => sum + item.quantity, 0);
      return convertSaleTimestampsToISO({ id: doc.id, ...data }) as Sale;
    });
    return salesList;
  } catch (error: any) {
    console.error("Error fetching sales:", error);
    throw new Error(`Failed to fetch sales history. ${error.code === 'permission-denied' ? 'Firestore permission denied.' : ''}`);
  }
}


export async function processSale(
  cartItems: CartItemForAction[],
  totalAmount: number
): Promise<{ success: boolean; saleId?: string; error?: string; unavailableItems?: {productId: string, name: string, availableStock: number}[] }> {

  const validation = ProcessSaleInputSchema.safeParse({ items: cartItems, totalAmount });
  if (!validation.success) {
    return { success: false, error: validation.error.errors.map(e => e.message).join(', ') };
  }

  try {
    const db = getDb();
    const batch = writeBatch(db);
    const unavailableItems: {productId: string, name: string, availableStock: number}[] = [];

    // Validate stock and prepare batch updates for products
    for (const item of cartItems) {
      const productRef = doc(db, 'products', item.productId);
      const productDoc = await getDoc(productRef);

      if (!productDoc.exists()) {
        return { success: false, error: `Product ${item.productName} not found.` };
      }
      const productData = productDoc.data() as Product; // Assuming Product type includes stock
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
    revalidatePath('/sales'); // To reflect new sale in history

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
