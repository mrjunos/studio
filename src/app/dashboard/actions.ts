
'use server';

import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, getDoc, type Timestamp, limit, orderBy } from "firebase/firestore";
import type { Sale, Product, DailySalesData, LowStockItemForDashboard } from "@/lib/types";
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, isSameDay } from 'date-fns';

export async function getDashboardMetrics(): Promise<{
  success: boolean;
  totalSales?: number;
  otherIncomeTotal?: number;
  topSellingProduct?: { name: string; quantity: number } | null;
  activeProductsCount?: number;
  recentSales?: DailySalesData[];
  lowStockItems?: LowStockItemForDashboard[];
  error?: string;
}> {
  try {
    const firestoreDb = db;

    // --- Total Sales & Top Selling Product ---
    const salesCollectionRef = collection(firestoreDb, 'sales');
    const allSalesSnapshot = await getDocs(salesCollectionRef);
    let currentTotalSales = 0;
    const productSalesCount: { [productId: string]: number } = {};
    const salesDataForMetrics: Array<Omit<Sale, 'id' | 'saleDate'> & { saleDate: Timestamp }> = [];

    allSalesSnapshot.forEach(doc => {
      const saleData = doc.data() as Omit<Sale, 'id' | 'saleDate'> & { saleDate: Timestamp };
      salesDataForMetrics.push(saleData);
      currentTotalSales += saleData.totalAmount || 0;
      saleData.items.forEach(item => {
        productSalesCount[item.productId] = (productSalesCount[item.productId] || 0) + item.quantity;
      });
    });

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

    // --- Other Income Total ---
    const otherIncomesCollectionRef = collection(firestoreDb, 'otherIncomes');
    const otherIncomesSnapshot = await getDocs(otherIncomesCollectionRef);
    let currentOtherIncomeTotal = 0;
    otherIncomesSnapshot.forEach(doc => {
      currentOtherIncomeTotal += doc.data().amount || 0;
    });

    // --- Active Products Count ---
    const activeProductsQuery = query(collection(firestoreDb, 'products'), where("stock", ">", 0));
    const activeProductsSnapshot = await getDocs(activeProductsQuery);
    const currentActiveProductsCount = activeProductsSnapshot.size;

    // --- Recent Sales for Chart (Last 30 Days) ---
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 29); // Inclusive of today, so 29 days back + today = 30 days
    
    const last30DaysInterval = eachDayOfInterval({ start: thirtyDaysAgo, end: today });
    const dailySalesMap: { [key: string]: number } = {};

    last30DaysInterval.forEach(day => {
      dailySalesMap[format(day, 'yyyy-MM-dd')] = 0;
    });
    
    const salesInLast30Days = salesDataForMetrics.filter(sale => {
        const saleDate = sale.saleDate.toDate();
        return saleDate >= startOfDay(thirtyDaysAgo) && saleDate <= endOfDay(today);
    });

    salesInLast30Days.forEach(sale => {
      const saleDayStr = format(sale.saleDate.toDate(), 'yyyy-MM-dd');
      if (dailySalesMap.hasOwnProperty(saleDayStr)) {
        dailySalesMap[saleDayStr] += sale.totalAmount;
      }
    });

    const currentRecentSalesChartData: DailySalesData[] = last30DaysInterval.map(day => ({
      date: format(day, 'MMM d'), // Format as "Jul 21"
      total: dailySalesMap[format(day, 'yyyy-MM-dd')] || 0,
    }));


    // --- Low Stock Items ---
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
      recentSales: currentRecentSalesChartData,
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
