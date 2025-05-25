
'use server';

import { db } from "@/lib/firebase"; // Changed from getDb
import { collection, getDocs, type Timestamp } from "firebase/firestore";
import type { Sale } from "@/lib/types"; // Sale type might not be directly needed if only metrics are returned

export async function getDashboardMetrics(): Promise<{
  success: boolean;
  totalSales?: number;
  otherIncomeTotal?: number;
  // Placeholder for other metrics to be implemented later
  // topSellingProduct?: { name: string; quantity: number };
  // activeProductsCount?: number;
  error?: string;
}> {
  try {
    // 'db' is now directly available from the import
    // Calculate Total Sales
    const salesCollectionRef = collection(db, 'sales');
    const salesSnapshot = await getDocs(salesCollectionRef);
    let currentTotalSales = 0;
    salesSnapshot.forEach(doc => {
      const saleData = doc.data();
      currentTotalSales += saleData.totalAmount || 0;
    });

    // Calculate Other Income Total
    const otherIncomesCollectionRef = collection(db, 'otherIncomes');
    const otherIncomesSnapshot = await getDocs(otherIncomesCollectionRef);
    let currentOtherIncomeTotal = 0;
    otherIncomesSnapshot.forEach(doc => {
      const incomeData = doc.data();
      currentOtherIncomeTotal += incomeData.amount || 0;
    });

    return {
      success: true,
      totalSales: currentTotalSales,
      otherIncomeTotal: currentOtherIncomeTotal
    };

  } catch (error: any) {
    console.error("Error fetching dashboard metrics:", error);
    let errorMessage = "Failed to fetch dashboard metrics. Please check server logs.";
    if (error.code === 'permission-denied') {
      errorMessage = "Firestore permission denied. Please check your security rules.";
    }
    return { success: false, error: errorMessage };
  }
}
