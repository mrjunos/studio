
"use server";

import { z } from "zod";
import type { Sale, Product } from "@/lib/types";
import { db } from "@/lib/firebase"; 
import { collection, addDoc, doc, getDoc, writeBatch, Timestamp, increment, getDocs, query, orderBy } from "firebase/firestore";
import { revalidatePath } from 'next/cache';

// TODO: Implement server-side authentication check for all write operations.

const SaleItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  quantity: z.number().int().positive("La cantidad debe ser un número entero positivo"),
  priceAtSale: z.number().positive("El precio de venta debe ser positivo"),
});

const ProcessSaleInputSchema = z.object({
  items: z.array(SaleItemSchema).min(1, "El carrito no puede estar vacío."),
  totalAmount: z.number().positive("El monto total debe ser positivo"),
});

export type CartItemForAction = z.infer<typeof SaleItemSchema>;

const convertSaleTimestampsToISO = (data: any): any => {
  if (data && data.saleDate instanceof Timestamp) {
    return { ...data, saleDate: data.saleDate.toDate().toISOString() };
  }
  return data;
};

export async function getSales(): Promise<Sale[]> {
  try {
    const salesCollection = collection(db, 'sales');
    const q = query(salesCollection, orderBy("saleDate", "desc"));
    const salesSnapshot = await getDocs(q);
    const salesList = salesSnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return convertSaleTimestampsToISO({ id: docSnap.id, ...data }) as Sale;
    });
    return salesList;
  } catch (error: any) {
    console.error("Error al obtener ventas:", error);
    throw new Error(`Error al obtener historial de ventas. ${error.code === 'permission-denied' ? 'Permiso denegado en Firestore.' : ''}`);
  }
}


export async function processSale(
  cartItems: CartItemForAction[],
  totalAmount: number,
  customSaleDate?: Date 
): Promise<{ success: boolean; saleId?: string; error?: string; unavailableItems?: {productId: string, name: string, availableStock: number}[] }> {
  // Placeholder: Add server-side auth check here
  const validation = ProcessSaleInputSchema.safeParse({ items: cartItems, totalAmount });
  if (!validation.success) {
    return { success: false, error: validation.error.errors.map(e => e.message).join(', ') };
  }

  try {
    const batch = writeBatch(db);
    const unavailableItems: {productId: string, name: string, availableStock: number}[] = [];

    for (const item of cartItems) {
      const productRef = doc(db, 'products', item.productId);
      const productDoc = await getDoc(productRef);

      if (!productDoc.exists()) {
        return { success: false, error: `Producto ${item.productName} no encontrado.` };
      }
      const productData = productDoc.data() as Product; 
      if (productData.stock < item.quantity) {
        unavailableItems.push({ productId: item.productId, name: item.productName, availableStock: productData.stock });
      }
      batch.update(productRef, { stock: increment(-item.quantity) });
    }

    if (unavailableItems.length > 0) {
      return { success: false, error: "Uno o más artículos tienen stock insuficiente.", unavailableItems };
    }

    const saleData = {
      items: cartItems,
      totalAmount,
      saleDate: customSaleDate ? Timestamp.fromDate(customSaleDate) : Timestamp.now(),
    };
    const salesCollectionRef = collection(db, 'sales');
    const newSaleRef = doc(salesCollectionRef); 
    batch.set(newSaleRef, saleData);

    await batch.commit();

    revalidatePath('/products'); 
    revalidatePath('/sales'); 
    revalidatePath('/'); 

    return { success: true, saleId: newSaleRef.id };

  } catch (e: any) {
    console.error("Error al procesar venta: ", e);
    let errorMessage = "Error al procesar la venta.";
    if (e.code === 'permission-denied') {
      errorMessage = "Permiso denegado en Firestore. Revisa tus reglas de seguridad.";
    } else if (e.message.includes("stock") || e.message.includes("product")) { 
        errorMessage = e.message;
    }
    return { success: false, error: errorMessage };
  }
}
