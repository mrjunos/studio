
export type ProductCategory = "Bolsa de Café" | "Aji";

export const productCategories: ProductCategory[] = ["Bolsa de Café", "Aji"];

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

export interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
}

export interface RecentSaleForDashboard {
  id: string;
  saleDate: string; // ISO string
  totalAmount: number;
  itemCount: number;
}

export interface LowStockItemForDashboard {
  id: string;
  name: string;
  stock: number;
}
