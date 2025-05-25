
'use server';

import { getDb } from "@/lib/firebase"; // Use getDb
import { collection, getDocs, query, where, doc, getDoc, type Timestamp, limit, orderBy } from "firebase/firestore";
import type { Sale, Product, DailySalesData, LowStockItemForDashboard, Expense, OtherIncome } from "@/lib/types";
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

export async function getDashboardMetrics(): Promise<{
  success: boolean;
  totalSales?: number; // All time
  totalExpenses?: number; // All time
  totalOtherIncome?: number; // All time
  balance?: number;
  salesLast30Days?: number; // Sum of sales in the last 30 days
  topSellingProduct?: { name: string; quantity: number } | null;
  activeProductsCount?: number;
  recentSales?: DailySalesData[]; // For the chart (daily breakdown of last 30 days)
  lowStockItems?: LowStockItemForDashboard[];
  expensesLast30Days?: number;
  transactionsLast30Days?: number;
  averageTicketLast30Days?: number;
  error?: string;
}> {
  try {
    const firestoreDb = getDb();
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 29); // Inclusive of today

    // --- Sales Data (Used for multiple metrics) ---
    const salesCollectionRef = collection(firestoreDb, 'sales');
    const allSalesSnapshot = await getDocs(salesCollectionRef);
    let currentTotalSales = 0;
    const productSalesCount: { [productId: string]: number } = {};
    const salesDataForMetrics: Array<Omit<Sale, 'id' | 'saleDate'> & { saleDate: Timestamp }> = [];

    allSalesSnapshot.forEach(docSnap => {
      const saleData = docSnap.data() as Omit<Sale, 'id' | 'saleDate'> & { saleDate: Timestamp };
      salesDataForMetrics.push(saleData);
      currentTotalSales += saleData.totalAmount || 0;
      saleData.items.forEach(item => {
        productSalesCount[item.productId] = (productSalesCount[item.productId] || 0) + item.quantity;
      });
    });

    // --- Top Selling Product (All Time) ---
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
          currentTopSellingProduct = { name: "Producto Desconocido", quantity: maxQuantity };
        }
      }
    }

    // --- Other Income Total (All Time) ---
    const otherIncomesCollectionRef = collection(firestoreDb, 'otherIncomes');
    const otherIncomesSnapshot = await getDocs(otherIncomesCollectionRef);
    let currentOtherIncomeTotal = 0;
    otherIncomesSnapshot.forEach(docSnap => {
      currentOtherIncomeTotal += (docSnap.data() as OtherIncome).amount || 0;
    });

    // --- Total Expenses (All Time) & Expenses (Last 30 Days) ---
    const expensesCollectionRef = collection(firestoreDb, 'expenses');
    const expensesSnapshot = await getDocs(expensesCollectionRef);
    let currentTotalExpenses = 0;
    let currentExpensesLast30Days = 0;
    expensesSnapshot.forEach(docSnap => {
      const expense = docSnap.data() as Omit<Expense, 'id' | 'expenseDate'> & { expenseDate: Timestamp };
      currentTotalExpenses += expense.amount || 0;
      const expenseDate = expense.expenseDate.toDate();
      if (expenseDate >= startOfDay(thirtyDaysAgo) && expenseDate <= endOfDay(today)) {
        currentExpensesLast30Days += expense.amount || 0;
      }
    });

    // --- Calculate Balance (All Time) ---
    const currentBalance = (currentTotalSales + currentOtherIncomeTotal) - currentTotalExpenses;

    // --- Active Products Count ---
    const activeProductsQuery = query(collection(firestoreDb, 'products'), where("stock", ">", 0));
    const activeProductsSnapshot = await getDocs(activeProductsQuery);
    const currentActiveProductsCount = activeProductsSnapshot.size;

    // --- Sales Data for Last 30 Days (Chart, Total, Count, Avg Ticket) ---
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
      date: format(day, 'MMM d', { locale: es }), // Format for X-axis labels
      total: dailySalesMap[format(day, 'yyyy-MM-dd')] || 0,
    }));
    
    const salesLast30DaysTotal = currentRecentSalesChartData.reduce((sum, day) => sum + day.total, 0);
    const currentTransactionsLast30Days = salesInLast30Days.length;
    const currentAverageTicketLast30Days = currentTransactionsLast30Days > 0 ? salesLast30DaysTotal / currentTransactionsLast30Days : 0;

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
      totalExpenses: currentTotalExpenses,
      totalOtherIncome: currentOtherIncomeTotal,
      balance: currentBalance,
      salesLast30Days: salesLast30DaysTotal,
      activeProductsCount: currentActiveProductsCount,
      topSellingProduct: currentTopSellingProduct,
      recentSales: currentRecentSalesChartData,
      lowStockItems: currentLowStockItems,
      expensesLast30Days: currentExpensesLast30Days,
      transactionsLast30Days: currentTransactionsLast30Days,
      averageTicketLast30Days: currentAverageTicketLast30Days,
    };

  } catch (error: any) {
    console.error("Error al obtener métricas del dashboard:", error);
    let errorMessage = "Error al obtener métricas del dashboard. Por favor revisa los logs del servidor.";
    if (error.code === 'permission-denied') {
      errorMessage = "Permiso denegado en Firestore. Por favor revisa tus reglas de seguridad.";
    } else if (error.message && (error.message.includes("Firebase app is not configured") || error.message.includes("Firebase projectId is not defined"))) {
      errorMessage = "La aplicación Firebase no está configurada correctamente. Verifica las variables de entorno.";
    }
    return { success: false, error: errorMessage };
  }
}

    