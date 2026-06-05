import { apiDelete, apiGet, apiPatch, apiPost } from "@/shared/api";
import type {
  Notification,
  NotificationListResponse,
  NotificationUnreadCountResponse,
  PushTokenDeleteResponse,
  PushTokenRequest,
  PushTokenResponse,
} from "../model/types";

export function getNotifications(limit = 20, offset = 0) {
  return apiGet<NotificationListResponse>(
    `/notifications/me?limit=${limit}&offset=${offset}`,
  );
}

export function getUnreadNotificationCount() {
  return apiGet<NotificationUnreadCountResponse>("/notifications/me/unread-count");
}

export function markNotificationAsRead(notificationId: number) {
  return apiPatch<Notification, Record<string, never>>(
    `/notifications/${notificationId}/read`,
    {},
  );
}

export function markAllNotificationsAsRead() {
  return apiPatch<{ updated_count: number }, Record<string, never>>(
    "/notifications/read-all",
    {},
  );
}

export function registerPushToken(data: PushTokenRequest) {
  return apiPost<PushTokenResponse, PushTokenRequest>(
    "/notifications/push-tokens",
    data,
  );
}

export function unregisterPushToken(expoPushToken: string) {
  return apiDelete<PushTokenDeleteResponse>(
    `/notifications/push-tokens/${encodeURIComponent(expoPushToken)}`,
  );
}
