
"use server";

import { z } from "zod";
import type { InventoryAdjustment } from "@/lib/types";
import { getDb } from "@/lib/firebase"; // Use getDb
import { collection, getDocs, addDoc, doc, getDoc, Timestamp, increment, writeBatch, orderBy, query } from "firebase/firestore";
import { revalidatePath } from 'next/cache';

// TODO: Implement server-side authentication check for all write operations.

const InventoryAdjustmentSchema = z.object({
  productId: z.string().min(1, "El ID del producto es obligatorio"),
  productName: z.string().min(1, "El nombre del producto es obligatorio"), 
  quantityChange: z.number().int().refine(val => val !== 0, "El cambio de cantidad no puede ser cero"),
  reason: z.string().optional(),
  adjustmentDate: z.date({ required_error: "La fecha de ajuste es obligatoria" }),
});

export type InventoryAdjustmentFormInput = Omit<z.infer<typeof InventoryAdjustmentSchema>, "id" | "productName" | "adjustmentDate"> & { productId: string };


const convertTimestampsToISO = (data: any) : any => {
  if (data && data.adjustmentDate instanceof Timestamp) {
    return { ...data, adjustmentDate: data.adjustmentDate.toDate().toISOString() };
  }
  return data;
};

export async function getInventoryAdjustments(): Promise<InventoryAdjustment[]> {
  try {
    const db = getDb();
    const adjustmentsCollection = collection(db, 'inventoryAdjustments');
    const q = query(adjustmentsCollection, orderBy("adjustmentDate", "desc"));
    const adjustmentSnapshot = await getDocs(q);
    const adjustmentList = adjustmentSnapshot.docs.map(doc => {
      const data = doc.data();
      return convertTimestampsToISO({ id: doc.id, ...data }) as InventoryAdjustment;
    });
    return adjustmentList;
  } catch (error: any) {
    console.error("Error al obtener ajustes de inventario:", error);
    let errorMessage = `Error al obtener ajustes de inventario. ${error.code === 'permission-denied' ? 'Permiso denegado en Firestore.' : ''}`;
    if (error.message && (error.message.includes("Firebase app is not configured") || error.message.includes("Firebase projectId is not defined"))) {
      errorMessage = "La aplicación Firebase no está configurada correctamente. Verifica las variables de entorno.";
    }
    throw new Error(errorMessage);
  }
}

export async function addInventoryAdjustment(data: InventoryAdjustmentFormInput, productName: string): Promise<{ success: boolean; adjustment?: InventoryAdjustment; error?: string }> {
  // Placeholder: Add server-side auth check here
  const fullData = { ...data, productName, adjustmentDate: new Date() }; 
  const validation = InventoryAdjustmentSchema.omit({id: true}).safeParse(fullData);

  if (!validation.success) {
    return { success: false, error: validation.error.errors.map(e => e.message).join(', ') };
  }

  const { productId, quantityChange } = validation.data;

  try {
    const db = getDb();
    const productRef = doc(db, 'products', productId);
    const adjustmentCollectionRef = collection(db, 'inventoryAdjustments');

    const productDoc = await getDoc(productRef);
    if (!productDoc.exists()) {
      return { success: false, error: "Producto no encontrado." };
    }

    const currentStock = productDoc.data()?.stock || 0;
    if (currentStock + quantityChange < 0) {
      return { success: false, error: "El ajuste resulta en stock negativo, lo cual no está permitido." };
    }

    const batch = writeBatch(db);

    const adjustmentDataForFirestore = {
      ...validation.data,
      adjustmentDate: Timestamp.fromDate(validation.data.adjustmentDate),
    };
    const newAdjustmentRef = doc(adjustmentCollectionRef); 
    batch.set(newAdjustmentRef, adjustmentDataForFirestore);

    batch.update(productRef, { stock: increment(quantityChange) });

    await batch.commit();

    revalidatePath('/inventory');
    revalidatePath('/products'); 
    revalidatePath('/'); 

    const newAdjustment = {
        id: newAdjustmentRef.id,
        ...validation.data,
        adjustmentDate: validation.data.adjustmentDate.toISOString()
    };
    return { success: true, adjustment: newAdjustment as InventoryAdjustment };

  } catch (e: any) {
    console.error("Error al añadir ajuste de inventario: ", e);
    let errorMessage = `Error al añadir ajuste de inventario. ${e.code === 'permission-denied' ? 'Permiso denegado en Firestore.' : ''}`;
    if (e.message && (e.message.includes("Firebase app is not configured") || e.message.includes("Firebase projectId is not defined"))) {
      errorMessage = "La aplicación Firebase no está configurada correctamente. Verifica las variables de entorno.";
    }
    return { success: false, error: errorMessage };
  }
}

    