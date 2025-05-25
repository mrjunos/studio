
'use server';

import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, getDoc, type Timestamp } from "firebase/firestore";
import type { Sale, Product } from "@/lib/types";

export async function getDashboardMetrics(): Promise<{
  success: boolean;
  totalSales?: number;
  otherIncomeTotal?: number;
  topSellingProduct?: { name: string; quantity: number } | null;
  activeProductsCount?: number;
  error?: string;
}> {
  try {
    const firestoreDb = db; // Use the imported db instance

    // Calculate Total Sales
    const salesCollectionRef = collection(firestoreDb, 'sales');
    const salesSnapshot = await getDocs(salesCollectionRef);
    let currentTotalSales = 0;
    const productSalesCount: { [productId: string]: number } = {};

    salesSnapshot.forEach(doc => {
      const saleData = doc.data() as Omit<Sale, 'id' | 'saleDate'> & { saleDate: Timestamp }; // Assume saleDate is Timestamp from Firestore
      currentTotalSales += saleData.totalAmount || 0;
      saleData.items.forEach(item => {
        productSalesCount[item.productId] = (productSalesCount[item.productId] || 0) + item.quantity;
      });
    });

    // Calculate Other Income Total
    const otherIncomesCollectionRef = collection(firestoreDb, 'otherIncomes');
    const otherIncomesSnapshot = await getDocs(otherIncomesCollectionRef);
    let currentOtherIncomeTotal = 0;
    otherIncomesSnapshot.forEach(doc => {
      const incomeData = doc.data();
      currentOtherIncomeTotal += incomeData.amount || 0;
    });

    // Calculate Active Products Count
    const activeProductsQuery = query(collection(firestoreDb, 'products'), where("stock", ">", 0));
    const activeProductsSnapshot = await getDocs(activeProductsQuery);
    const currentActiveProductsCount = activeProductsSnapshot.size;

    // Determine Top Selling Product
    let currentTopSellingProduct: { name: string; quantity: number } | null = null;
    if (Object.keys(productSalesCount).length > 0) {
      let maxQuantity = 0;
      let topProductId = '';
      for (const productId in productSalesCount) {
        if (productSalesCount[productId] > maxQuantity) {
          maxQuantity = productSalesCount[productId];
          topProductId = productId;
        }
      }

      if (topProductId) {
        const productRef = doc(firestoreDb, 'products', topProductId);
        const productDoc = await getDoc(productRef);
        if (productDoc.exists()) {
          currentTopSellingProduct = {
            name: (productDoc.data() as Product).name,
            quantity: maxQuantity,
          };
        } else {
          // Product might have been deleted, handle as needed
          currentTopSellingProduct = { name: "Unknown Product", quantity: maxQuantity };
        }
      }
    }

    return {
      success: true,
      totalSales: currentTotalSales,
      otherIncomeTotal: currentOtherIncomeTotal,
      activeProductsCount: currentActiveProductsCount,
      topSellingProduct: currentTopSellingProduct,
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
