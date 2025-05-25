
export type ProductCategory = "Drinks" | "Food" | "Merchandise";
export const productCategories: ProductCategory[] = ["Drinks", "Food", "Merchandise"];

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  stock: number;
  imageUrl?: string;
}

export interface SaleItem {
  productId: string;
  productName: string; // Denormalized for easier display in sale records
  quantity: number;
  priceAtSale: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  totalAmount: number;
  saleDate: string; // Store as ISO string or Firestore Timestamp, handle conversion
}

export interface InventoryAdjustment {
  id:string;
  productId: string;
  productName: string; // Denormalized for display convenience
  quantityChange: number;
  reason?: string;
  adjustmentDate: string; // Store as ISO string or Firestore Timestamp
}

export interface OtherIncome {
  id: string;
  description: string;
  amount: number;
  incomeDate: string; // Store as ISO string or Firestore Timestamp
}

export type ExpenseCategory = "Supplies" | "Utilities" | "Rent" | "Marketing" | "Wages" | "Other";
export const expenseCategories: ExpenseCategory[] = ["Supplies", "Utilities", "Rent", "Marketing", "Wages", "Other"];

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  expenseDate: string; // Store as ISO string or Firestore Timestamp
}


export interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
}

export interface DailySalesData {
  date: string; // Formatted date string for chart label (e.g., "Jul 20")
  total: number; // Total sales for that day
}

export interface LowStockItemForDashboard {
  id: string;
  name: string;
  stock: number;
}
