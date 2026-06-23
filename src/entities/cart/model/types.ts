export type Price = {
  value: string;
  updatedAt: string;
};

export type CartItemStatus = "active" | "inactive" | "out_of_stock";

export type CartItem = {
  productId: string;
  title: string;
  unitPrice: Price;
  quantity: number;
  stock: number;
  status: CartItemStatus;
  isBlocked: boolean;
  addedAt: string;
};

export type Cart = {
  userId: string;
  items: CartItem[];
  totalPrice: Price;
};

export type CartResponse = {
  data: Cart;
};

export type CartItemResponse = {
  data: CartItem;
};
