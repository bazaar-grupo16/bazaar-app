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
  status?: string;
};

export type OrderStatusHistoryEntry = {
  item_id?: string | null;
  previous_status?: string | null;
  new_status: string;
  timestamp: string;
  origin: string;
  tracking_code?: string | null;
};

export type OrderResponse = {
  order_id: string;
  user_id: string;
  status: OrderStatus;
  aggregated_status?: string | null;
  shipping_address: Record<string, unknown>;
  total_amount: number;
  tracking_code?: string | null;
  preference_id?: string | null;
  init_point?: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItemResponse[];
  status_history?: OrderStatusHistoryEntry[];
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
