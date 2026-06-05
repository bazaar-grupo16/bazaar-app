export type NotificationStatus = "pending" | "sent" | "failed";

export type NotificationPayload = {
  deep_link?: string;
  order_id?: string;
  product_id?: string;
  product_name?: string;
  new_status?: string;
  current_stock?: number;
  threshold?: number;
  [key: string]: unknown;
};

export type Notification = {
  id: number;
  idempotency_key: string;
  type: string;
  recipient_id: string;
  title: string;
  body: string;
  payload: NotificationPayload;
  correlation_id: string | null;
  status: NotificationStatus;
  attempts: number;
  last_error: string | null;
  next_retry_at: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  read_at: string | null;
  is_read: boolean;
};

export type NotificationListResponse = {
  data: Notification[];
  total: number;
  limit: number;
  offset: number;
};

export type NotificationUnreadCountResponse = {
  unread_count: number;
};

export type PushTokenRequest = {
  expo_push_token: string;
  platform: string;
};

export type PushTokenResponse = PushTokenRequest & {
  id: number;
  recipient_id: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type PushTokenDeleteResponse = {
  disabled: boolean;
};
