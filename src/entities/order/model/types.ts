export type ShippingAddress = {
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
};

export type CreateOrderRequest = {
  shipping_address: ShippingAddress;
};

export type OrderCreatedResponse = {
  order_id: string;
  status: string;
  preference_id?: string | null;
  init_point?: string | null;
};

export type OrderItemResponse = {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
};

export type OrderResponse = {
  order_id: string;
  user_id: string;
  status: OrderStatus;
  shipping_address: Record<string, unknown>;
  total_amount: number;
  tracking_code?: string | null;
  preference_id?: string | null;
  init_point?: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItemResponse[];
};

export type OrderListResponse = {
  orders: OrderResponse[];
  total: number;
  page: number;
  size: number;
};

export type OrderStatus =
  | "PENDIENTE_DE_PAGO"
  | "CONFIRMADA"
  | "EN_PREPARACION"
  | "ENVIADA"
  | "ENTREGADA"
  | "PAGO_RECHAZADO"
  | "CANCELADA"
  | "REEMBOLSO_EN_PROCESO"
  | "REEMBOLSO_PROCESADO";
