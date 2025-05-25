
'use server';

import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, getDoc, type Timestamp, limit, orderBy } from "firebase/firestore";
import type { Sale, Product, RecentSaleForDashboard, LowStockItemForDashboard } from "@/lib/types";

export async function getDashboardMetrics(): Promise<{
  success: boolean;
  totalSales?: number;
  otherIncomeTotal?: number;
  topSellingProduct?: { name: string; quantity: number } | null;
  activeProductsCount?: number;
  recentSales?: RecentSaleForDashboard[];
  lowStockItems?: LowStockItemForDashboard[];
  error?: string;
}> {
  try {
    const firestoreDb = db;

    // Calculate Total Sales & Prepare for Top Selling Product
    const salesCollectionRef = collection(firestoreDb, 'sales');
    const salesSnapshot = await getDocs(salesCollectionRef);
    let currentTotalSales = 0;
    const productSalesCount: { [productId: string]: number } = {};

    salesSnapshot.forEach(doc => {
      const saleData = doc.data() as Omit<Sale, 'id' | 'saleDate'> & { saleDate: Timestamp };
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
          currentTopSellingProduct = { name: "Unknown Product", quantity: maxQuantity };
        }
      }
    }

    // Fetch Recent Sales
    const recentSalesQuery = query(
      collection(firestoreDb, 'sales'),
      orderBy('saleDate', 'desc'),
      limit(5)
    );
    const recentSalesSnapshot = await getDocs(recentSalesQuery);
    const currentRecentSales: RecentSaleForDashboard[] = recentSalesSnapshot.docs.map(docSnap => {
      const data = docSnap.data() as Omit<Sale, 'id' | 'saleDate'> & { saleDate: Timestamp };
      return {
        id: docSnap.id,
        saleDate: data.saleDate.toDate().toISOString(),
        totalAmount: data.totalAmount,
        itemCount: data.items.reduce((sum, item) => sum + item.quantity, 0),
      };
    });

    // Fetch Low Stock Items
    const lowStockQuery = query(
      collection(firestoreDb, 'products'),
      where('stock', '>', 0),
      where('stock', '<', 10),
      orderBy('stock', 'asc'),
      limit(5)
    );
    const lowStockSnapshot = await getDocs(lowStockQuery);
    const currentLowStockItems: LowStockItemForDashboard[] = lowStockSnapshot.docs.map(docSnap => {
      const data = docSnap.data() as Product;
      return {
        id: docSnap.id,
        name: data.name,
        stock: data.stock,
      };
    });

    return {
      success: true,
      totalSales: currentTotalSales,
      otherIncomeTotal: currentOtherIncomeTotal,
      activeProductsCount: currentActiveProductsCount,
      topSellingProduct: currentTopSellingProduct,
      recentSales: currentRecentSales,
      lowStockItems: currentLowStockItems,
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
