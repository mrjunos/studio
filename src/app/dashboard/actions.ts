
'use server';

import { db } from "@/lib/firebase";
import { collection, getDocs, type Timestamp } from "firebase/firestore";
import type { Sale } from "@/lib/types";

export async function getDashboardMetrics(): Promise<{
  success: boolean;
  totalSales?: number;
  // Placeholder for other metrics to be implemented later
  // otherIncomeTotal?: number;
  // topSellingProduct?: { name: string; quantity: number };
  // activeProductsCount?: number;
  error?: string;
}> {
  try {
    // Calculate Total Sales
    const salesCollectionRef = collection(db, 'sales');
    const salesSnapshot = await getDocs(salesCollectionRef);
    let currentTotalSales = 0;
    salesSnapshot.forEach(doc => {
      // Firestore returns Timestamps for date fields, ensure totalAmount is correctly accessed.
      const saleData = doc.data(); 
      currentTotalSales += saleData.totalAmount || 0;
    });

    return { success: true, totalSales: currentTotalSales };

  } catch (error: any) {
    console.error("Error fetching dashboard metrics:", error);
    let errorMessage = "Failed to fetch dashboard metrics. Please check server logs.";
    if (error.code === 'permission-denied') {
      errorMessage = "Firestore permission denied. Please check your security rules.";
    }
    return { success: false, error: errorMessage };
  }
}
