
"use server";

import { z } from "zod";
import type { OtherIncome } from "@/lib/types";
import { db } from "@/lib/firebase"; 
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, getDoc, Timestamp, orderBy, query } from "firebase/firestore";
import { revalidatePath } from 'next/cache';

// TODO: Implement server-side authentication check for all write operations.

const OtherIncomeSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "La descripción es obligatoria"),
  amount: z.number().positive("El monto debe ser un número positivo"),
  incomeDate: z.date({ required_error: "La fecha del ingreso es obligatoria" }),
});

export type OtherIncomeFormInput = Omit<z.infer<typeof OtherIncomeSchema>, "id">; 

const convertTimestampsToISO = (data: any) : any => {
  if (data && data.incomeDate instanceof Timestamp) {
    return { ...data, incomeDate: data.incomeDate.toDate().toISOString() };
  }
  return data;
};


export async function getOtherIncomes(): Promise<OtherIncome[]> {
  try {
    const incomesCollection = collection(db, 'otherIncomes');
    const q = query(incomesCollection, orderBy("incomeDate", "desc"));
    const incomeSnapshot = await getDocs(q);
    const incomeList = incomeSnapshot.docs.map(doc => {
      const data = doc.data();
      return convertTimestampsToISO({ id: doc.id, ...data }) as OtherIncome;
    });
    return incomeList;
  } catch (error: any) {
    console.error("Error al obtener otros ingresos:", error);
    throw new Error(`Error al obtener otros ingresos. ${error.code === 'permission-denied' ? 'Permiso denegado en Firestore.' : ''}`);
  }
}

export async function addOtherIncome(data: OtherIncomeFormInput): Promise<{ success: boolean; income?: OtherIncome; error?: string }> {
  // Placeholder: Add server-side auth check here
  const validation = OtherIncomeSchema.omit({ id: true }).safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.errors.map(e => e.message).join(', ') };
  }

  try {
    const incomeData = {
      ...validation.data,
      incomeDate: Timestamp.fromDate(validation.data.incomeDate), 
    };
    const docRef = await addDoc(collection(db, 'otherIncomes'), incomeData);
    revalidatePath('/income');
    revalidatePath('/');
    const newIncome = { id: docRef.id, ...validation.data, incomeDate: validation.data.incomeDate.toISOString() };
    return { success: true, income: newIncome as OtherIncome };
  } catch (e: any) {
    console.error("Error al añadir documento de ingreso: ", e);
    return { success: false, error: `Error al añadir ingreso. ${e.code === 'permission-denied' ? 'Permiso denegado en Firestore.' : ''}` };
  }
}

export async function updateOtherIncome(id: string, data: OtherIncomeFormInput): Promise<{ success: boolean; income?: OtherIncome; error?: string }> {
  // Placeholder: Add server-side auth check here
  const validation = OtherIncomeSchema.omit({ id: true }).safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.errors.map(e => e.message).join(', ') };
  }

  try {
    const incomeRef = doc(db, 'otherIncomes', id);
    const incomeDoc = await getDoc(incomeRef);

    if (!incomeDoc.exists()) {
      return { success: false, error: "Entrada de ingreso no encontrada" };
    }

    const updatedData = {
      ...validation.data,
      incomeDate: Timestamp.fromDate(validation.data.incomeDate), 
    };

    await updateDoc(incomeRef, updatedData);
    revalidatePath('/income');
    revalidatePath('/');
    const updatedIncome = { id, ...validation.data, incomeDate: validation.data.incomeDate.toISOString() };
    return { success: true, income: updatedIncome as OtherIncome };
  } catch (e: any) {
    console.error("Error al actualizar documento de ingreso: ", e);
    return { success: false, error: `Error al actualizar ingreso. ${e.code === 'permission-denied' ? 'Permiso denegado en Firestore.' : ''}` };
  }
}

export async function deleteOtherIncome(id: string): Promise<{ success: boolean; error?: string }> {
  // Placeholder: Add server-side auth check here
  try {
    const incomeRef = doc(db, 'otherIncomes', id);
    await deleteDoc(incomeRef);
    revalidatePath('/income');
    revalidatePath('/');
    return { success: true };
  } catch (e: any) {
    console.error("Error al eliminar documento de ingreso: ", e);
    return { success: false, error: `Error al eliminar ingreso. ${e.code === 'permission-denied' ? 'Permiso denegado en Firestore.' : ''}` };
  }
}
