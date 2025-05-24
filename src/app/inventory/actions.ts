
"use server";

import { z } from "zod";
import type { InventoryAdjustment } from "@/lib/types";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, doc, updateDoc, getDoc, Timestamp, increment, writeBatch, orderBy, query } from "firebase/firestore";
import { revalidatePath } from 'next/cache';

const InventoryAdjustmentSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  productName: z.string().min(1, "Product name is required"), // Denormalized
  quantityChange: z.number().int().refine(val => val !== 0, "Quantity change cannot be zero"),
  reason: z.string().optional(),
  adjustmentDate: z.date({ required_error: "Adjustment date is required" }),
});

export type InventoryAdjustmentFormInput = Omit<z.infer<typeof InventoryAdjustmentSchema>, "id" | "productName"> & { productId: string };


// Helper to convert Firestore Timestamps to ISO strings for dates
const convertTimestampsToISO = (data: any) : any => {
  if (data && data.adjustmentDate instanceof Timestamp) {
    return { ...data, adjustmentDate: data.adjustmentDate.toDate().toISOString() };
  }
  return data;
};

export async function getInventoryAdjustments(): Promise<InventoryAdjustment[]> {
  try {
    const adjustmentsCollection = collection(db, 'inventoryAdjustments');
    const q = query(adjustmentsCollection, orderBy("adjustmentDate", "desc"));
    const adjustmentSnapshot = await getDocs(q);
    const adjustmentList = adjustmentSnapshot.docs.map(doc => {
      const data = doc.data();
      return convertTimestampsToISO({ id: doc.id, ...data }) as InventoryAdjustment;
    });
    return adjustmentList;
  } catch (error: any) {
    console.error("Error fetching inventory adjustments:", error);
    throw new Error(`Failed to fetch inventory adjustments. ${error.code === 'permission-denied' ? 'Firestore permission denied.' : ''}`);
  }
}

export async function addInventoryAdjustment(data: InventoryAdjustmentFormInput, productName: string): Promise<{ success: boolean; adjustment?: InventoryAdjustment; error?: string }> {
  const fullData = { ...data, productName, adjustmentDate: new Date() }; // Use current date for adjustment
  const validation = InventoryAdjustmentSchema.omit({id: true}).safeParse(fullData);

  if (!validation.success) {
    return { success: false, error: validation.error.errors.map(e => e.message).join(', ') };
  }

  const { productId, quantityChange } = validation.data;

  const productRef = doc(db, 'products', productId);
  const adjustmentCollectionRef = collection(db, 'inventoryAdjustments');

  try {
    const productDoc = await getDoc(productRef);
    if (!productDoc.exists()) {
      return { success: false, error: "Product not found." };
    }

    const currentStock = productDoc.data()?.stock || 0;
    if (currentStock + quantityChange < 0) {
      return { success: false, error: "Adjustment results in negative stock, which is not allowed." };
    }

    const batch = writeBatch(db);

    // 1. Add inventory adjustment record
    const adjustmentDataForFirestore = {
      ...validation.data,
      adjustmentDate: Timestamp.fromDate(validation.data.adjustmentDate),
    };
    const newAdjustmentRef = doc(adjustmentCollectionRef); // Auto-generate ID
    batch.set(newAdjustmentRef, adjustmentDataForFirestore);
    
    // 2. Update product stock
    batch.update(productRef, { stock: increment(quantityChange) });

    await batch.commit();

    revalidatePath('/inventory');
    revalidatePath('/products'); // Product stock changed

    const newAdjustment = { 
        id: newAdjustmentRef.id, 
        ...validation.data, 
        adjustmentDate: validation.data.adjustmentDate.toISOString() 
    };
    return { success: true, adjustment: newAdjustment as InventoryAdjustment };

  } catch (e: any) {
    console.error("Error adding inventory adjustment: ", e);
    return { success: false, error: `Failed to add inventory adjustment. ${e.code === 'permission-denied' ? 'Firestore permission denied.' : ''}` };
  }
}
