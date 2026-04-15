export type Price = {
  value: string;
  updatedAt: string;
};

export type CartItemStatus = "active" | "inactive";

export type CartItem = {
  productId: number;
  title: string;
  unitPrice: Price;
  quantity: number;
  stock: number;
  status: CartItemStatus;
  addedAt: string;
};

export type Cart = {
  userId: number;
  items: CartItem[];
  totalPrice: Price;
};

export type CartResponse = {
  data: Cart;
};

export type CartItemResponse = {
  data: CartItem;
};
