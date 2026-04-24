export type ProductStatus = "active" | "inactive" | "out_of_stock";

export type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  sellerId: string;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
  images?: string[];
};

export type ProductListResponse = {
  data: Product[];
  total: number;
  limit: number;
  offset: number;
};

export type ProductResponse = {
  data: Product;
};

export type ProductListParams = {
  limit?: number;
  offset?: number;
  searchQuery?: string;
  category?: string;
  sellerId?: string;
  includeInactive?: boolean;
  sortBy?: "price" | "created_at" | "title";
  order?: "asc" | "desc";
};
