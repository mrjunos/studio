
"use server";

import { z } from "zod";
import type { Expense, ExpenseCategory } from "@/lib/types";
import { expenseCategories } from "@/lib/types";
import { getDb } from "@/lib/firebase"; // Use getDb
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, getDoc, Timestamp, orderBy, query } from "firebase/firestore";
import { revalidatePath } from 'next/cache';

// TODO: Implement server-side authentication check for all write operations.

const ExpenseSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "La descripción es obligatoria"),
  amount: z.number().positive("El monto debe ser un número positivo"),
  category: z.enum(expenseCategories as [ExpenseCategory, ...ExpenseCategory[]], { required_error: "La categoría es obligatoria" }),
  expenseDate: z.date({ required_error: "La fecha del gasto es obligatoria" }),
});

export type ExpenseFormInput = Omit<z.infer<typeof ExpenseSchema>, "id">;

const convertTimestampsToISO = (data: any) : any => {
  if (data && data.expenseDate instanceof Timestamp) {
    return { ...data, expenseDate: data.expenseDate.toDate().toISOString() };
  }
  return data;
};


export async function getExpenses(): Promise<Expense[]> {
  try {
    const db = getDb();
    const expensesCollection = collection(db, 'expenses');
    const q = query(expensesCollection, orderBy("expenseDate", "desc"));
    const expenseSnapshot = await getDocs(q);
    const expenseList = expenseSnapshot.docs.map(doc => {
      const data = doc.data();
      return convertTimestampsToISO({ id: doc.id, ...data }) as Expense;
    });
    return expenseList;
  } catch (error: any) {
    console.error("Error al obtener gastos:", error);
    let errorMessage = `Error al obtener gastos. ${error.code === 'permission-denied' ? 'Permiso denegado en Firestore.' : ''}`;
    if (error.message && (error.message.includes("Firebase app is not configured") || error.message.includes("Firebase projectId is not defined"))) {
      errorMessage = "La aplicación Firebase no está configurada correctamente. Verifica las variables de entorno.";
    }
    throw new Error(errorMessage);
  }
}

export async function addExpense(data: ExpenseFormInput): Promise<{ success: boolean; expense?: Expense; error?: string }> {
  // Placeholder: Add server-side auth check here
  const validation = ExpenseSchema.omit({ id: true }).safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.errors.map(e => e.message).join(', ') };
  }

  try {
    const db = getDb();
    const expenseData = {
      ...validation.data,
      expenseDate: Timestamp.fromDate(validation.data.expenseDate),
    };
    const docRef = await addDoc(collection(db, 'expenses'), expenseData);
    revalidatePath('/expenses');
    revalidatePath('/'); 
    const newExpense = { id: docRef.id, ...validation.data, expenseDate: validation.data.expenseDate.toISOString() };
    return { success: true, expense: newExpense as Expense };
  } catch (e: any) {
    console.error("Error al añadir documento de gasto: ", e);
    let errorMessage = `Error al añadir gasto. ${e.code === 'permission-denied' ? 'Permiso denegado en Firestore.' : ''}`;
     if (e.message && (e.message.includes("Firebase app is not configured") || e.message.includes("Firebase projectId is not defined"))) {
      errorMessage = "La aplicación Firebase no está configurada correctamente. Verifica las variables de entorno.";
    }
    return { success: false, error: errorMessage };
  }
}

export async function updateExpense(id: string, data: ExpenseFormInput): Promise<{ success: boolean; expense?: Expense; error?: string }> {
  // Placeholder: Add server-side auth check here
  const validation = ExpenseSchema.omit({ id: true }).safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.errors.map(e => e.message).join(', ') };
  }

  try {
    const db = getDb();
    const expenseRef = doc(db, 'expenses', id);
    const expenseDoc = await getDoc(expenseRef);

    if (!expenseDoc.exists()) {
      return { success: false, error: "Entrada de gasto no encontrada" };
    }

    const updatedData = {
      ...validation.data,
      expenseDate: Timestamp.fromDate(validation.data.expenseDate),
    };

    await updateDoc(expenseRef, updatedData);
    revalidatePath('/expenses');
    revalidatePath('/');
    const updatedExpense = { id, ...validation.data, expenseDate: validation.data.expenseDate.toISOString() };
    return { success: true, expense: updatedExpense as Expense };
  } catch (e: any) {
    console.error("Error al actualizar documento de gasto: ", e);
    let errorMessage = `Error al actualizar gasto. ${e.code === 'permission-denied' ? 'Permiso denegado en Firestore.' : ''}`;
     if (e.message && (e.message.includes("Firebase app is not configured") || e.message.includes("Firebase projectId is not defined"))) {
      errorMessage = "La aplicación Firebase no está configurada correctamente. Verifica las variables de entorno.";
    }
    return { success: false, error: errorMessage };
  }
}

export async function deleteExpense(id: string): Promise<{ success: boolean; error?: string }> {
  // Placeholder: Add server-side auth check here
  try {
    const db = getDb();
    const expenseRef = doc(db, 'expenses', id);
    await deleteDoc(expenseRef);
    revalidatePath('/expenses');
    revalidatePath('/');
    return { success: true };
  } catch (e: any) {
    console.error("Error al eliminar documento de gasto: ", e);
    let errorMessage = `Error al eliminar gasto. ${e.code === 'permission-denied' ? 'Permiso denegado en Firestore.' : ''}`;
    if (e.message && (e.message.includes("Firebase app is not configured") || e.message.includes("Firebase projectId is not defined"))) {
      errorMessage = "La aplicación Firebase no está configurada correctamente. Verifica las variables de entorno.";
    }
    return { success: false, error: errorMessage };
  }
}

    