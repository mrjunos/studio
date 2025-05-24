
export type ProductCategory = "Drinks" | "Food" | "Merchandise" | "Uncategorized";

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
  quantity: number;
  priceAtSale: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  totalAmount: number;
  saleDate: Date;
}

export interface InventoryAdjustment {
  id:string;
  productId: string;
  productName?: string; // For display convenience
  quantityChange: number;
  reason?: string;
  adjustmentDate: Date;
}

export interface OtherIncome {
  id: string;
  description: string;
  amount: number;
  incomeDate: Date;
}

export interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
}
