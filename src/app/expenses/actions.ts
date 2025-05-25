
"use server";

import { z } from "zod";
import type { Expense, ExpenseCategory } from "@/lib/types";
import { expenseCategories } from "@/lib/types";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, getDoc, Timestamp, orderBy, query } from "firebase/firestore";
import { revalidatePath } from 'next/cache';

const ExpenseSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  amount: z.number().positive("Amount must be a positive number"),
  category: z.enum(expenseCategories, { required_error: "Category is required" }),
  expenseDate: z.date({ required_error: "Expense date is required" }),
});

export type ExpenseFormInput = Omit<z.infer<typeof ExpenseSchema>, "id">;

// Helper to convert Firestore Timestamps to ISO strings for dates
const convertTimestampsToISO = (data: any) : any => {
  if (data && data.expenseDate instanceof Timestamp) {
    return { ...data, expenseDate: data.expenseDate.toDate().toISOString() };
  }
  return data;
};


export async function getExpenses(): Promise<Expense[]> {
  try {
    const expensesCollection = collection(db, 'expenses');
    const q = query(expensesCollection, orderBy("expenseDate", "desc"));
    const expenseSnapshot = await getDocs(q);
    const expenseList = expenseSnapshot.docs.map(doc => {
      const data = doc.data();
      return convertTimestampsToISO({ id: doc.id, ...data }) as Expense;
    });
    return expenseList;
  } catch (error: any) {
    console.error("Error fetching expenses:", error);
    throw new Error(`Failed to fetch expenses. ${error.code === 'permission-denied' ? 'Firestore permission denied.' : ''}`);
  }
}

export async function addExpense(data: ExpenseFormInput): Promise<{ success: boolean; expense?: Expense; error?: string }> {
  const validation = ExpenseSchema.omit({ id: true }).safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.errors.map(e => e.message).join(', ') };
  }

  try {
    const expenseData = {
      ...validation.data,
      expenseDate: Timestamp.fromDate(validation.data.expenseDate),
    };
    const docRef = await addDoc(collection(db, 'expenses'), expenseData);
    revalidatePath('/expenses');
    // Also revalidate dashboard if expenses affect it
    revalidatePath('/'); 
    const newExpense = { id: docRef.id, ...validation.data, expenseDate: validation.data.expenseDate.toISOString() };
    return { success: true, expense: newExpense as Expense };
  } catch (e: any) {
    console.error("Error adding expense document: ", e);
    return { success: false, error: `Failed to add expense. ${e.code === 'permission-denied' ? 'Firestore permission denied.' : ''}` };
  }
}

export async function updateExpense(id: string, data: ExpenseFormInput): Promise<{ success: boolean; expense?: Expense; error?: string }> {
  const validation = ExpenseSchema.omit({ id: true }).safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.errors.map(e => e.message).join(', ') };
  }

  try {
    const expenseRef = doc(db, 'expenses', id);
    const expenseDoc = await getDoc(expenseRef);

    if (!expenseDoc.exists()) {
      return { success: false, error: "Expense entry not found" };
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
    console.error("Error updating expense document: ", e);
    return { success: false, error: `Failed to update expense. ${e.code === 'permission-denied' ? 'Firestore permission denied.' : ''}` };
  }
}

export async function deleteExpense(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const expenseRef = doc(db, 'expenses', id);
    await deleteDoc(expenseRef);
    revalidatePath('/expenses');
    revalidatePath('/');
    return { success: true };
  } catch (e: any) {
    console.error("Error deleting expense document: ", e);
    return { success: false, error: `Failed to delete expense. ${e.code === 'permission-denied' ? 'Firestore permission denied.' : ''}` };
  }
}
