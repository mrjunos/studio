
// Define productCategories as a const array first
export const productCategories = ["Bolsa de Café", "Aji"] as const;

// Derive ProductCategory type from the const array
export type ProductCategory = typeof productCategories[number];

export interface Product {
  id: string;
  name: string;
  category: ProductCategory; // This will now correctly use the derived union type
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
