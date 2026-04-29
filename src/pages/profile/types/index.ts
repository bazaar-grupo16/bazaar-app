export type Tab = "publicaciones" | "favoritos";

export type ProductCondition = "Nuevo" | "Usado" | "Reacondicionado";

export interface Product {
  id: string | number;
  title: string;
  description: string;
  price: number;
  image: string;
  condition?: ProductCondition;
  isFavorite?: boolean;
  sellerId: string;
  category: string;
  status: "active" | "inactive" | "out_of_stock";
  createdAt: string;
  updatedAt: string;
}

export interface Stat {
  label: string;
  value: string;
  color: string;
}