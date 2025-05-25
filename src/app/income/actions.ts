
"use server";

import { z } from "zod";
import type { OtherIncome } from "@/lib/types";
import { db } from "@/lib/firebase"; // Changed from getDb
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, getDoc, Timestamp, orderBy, query } from "firebase/firestore";
import { revalidatePath } from 'next/cache';

const OtherIncomeSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  amount: z.number().positive("Amount must be a positive number"),
  incomeDate: z.date({ required_error: "Income date is required" }),
});

export type OtherIncomeFormInput = Omit<z.infer<typeof OtherIncomeSchema>, "id">; // For forms, ID is not input

// Helper to convert Firestore Timestamps to ISO strings for dates
const convertTimestampsToISO = (data: any) : any => {
  if (data && data.incomeDate instanceof Timestamp) {
    return { ...data, incomeDate: data.incomeDate.toDate().toISOString() };
  }
  return data;
};


export async function getOtherIncomes(): Promise<OtherIncome[]> {
  try {
    // 'db' is now directly available from the import
    const incomesCollection = collection(db, 'otherIncomes');
    // Order by incomeDate descending
    const q = query(incomesCollection, orderBy("incomeDate", "desc"));
    const incomeSnapshot = await getDocs(q);
    const incomeList = incomeSnapshot.docs.map(doc => {
      const data = doc.data();
      return convertTimestampsToISO({ id: doc.id, ...data }) as OtherIncome;
    });
    return incomeList;
  } catch (error: any) {
    console.error("Error fetching other incomes:", error);
    throw new Error(`Failed to fetch other incomes. ${error.code === 'permission-denied' ? 'Firestore permission denied.' : ''}`);
  }
}

export async function addOtherIncome(data: OtherIncomeFormInput): Promise<{ success: boolean; income?: OtherIncome; error?: string }> {
  const validation = OtherIncomeSchema.omit({ id: true }).safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.errors.map(e => e.message).join(', ') };
  }

  try {
    // 'db' is now directly available from the import
    const incomeData = {
      ...validation.data,
      incomeDate: Timestamp.fromDate(validation.data.incomeDate), // Store as Firestore Timestamp
    };
    const docRef = await addDoc(collection(db, 'otherIncomes'), incomeData);
    revalidatePath('/income');
    const newIncome = { id: docRef.id, ...validation.data, incomeDate: validation.data.incomeDate.toISOString() };
    return { success: true, income: newIncome as OtherIncome };
  } catch (e: any) {
    console.error("Error adding income document: ", e);
    return { success: false, error: `Failed to add income. ${e.code === 'permission-denied' ? 'Firestore permission denied.' : ''}` };
  }
}

export async function updateOtherIncome(id: string, data: OtherIncomeFormInput): Promise<{ success: boolean; income?: OtherIncome; error?: string }> {
  const validation = OtherIncomeSchema.omit({ id: true }).safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.errors.map(e => e.message).join(', ') };
  }

  try {
    // 'db' is now directly available from the import
    const incomeRef = doc(db, 'otherIncomes', id);
    const incomeDoc = await getDoc(incomeRef);

    if (!incomeDoc.exists()) {
      return { success: false, error: "Income entry not found" };
    }

    const updatedData = {
      ...validation.data,
      incomeDate: Timestamp.fromDate(validation.data.incomeDate), // Store as Firestore Timestamp
    };

    await updateDoc(incomeRef, updatedData);
    revalidatePath('/income');
    const updatedIncome = { id, ...validation.data, incomeDate: validation.data.incomeDate.toISOString() };
    return { success: true, income: updatedIncome as OtherIncome };
  } catch (e: any) {
    console.error("Error updating income document: ", e);
    return { success: false, error: `Failed to update income. ${e.code === 'permission-denied' ? 'Firestore permission denied.' : ''}` };
  }
}

export async function deleteOtherIncome(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 'db' is now directly available from the import
    const incomeRef = doc(db, 'otherIncomes', id);
    await deleteDoc(incomeRef);
    revalidatePath('/income');
    return { success: true };
  } catch (e: any) {
    console.error("Error deleting income document: ", e);
    return { success: false, error: `Failed to delete income. ${e.code === 'permission-denied' ? 'Firestore permission denied.' : ''}` };
  }
}
