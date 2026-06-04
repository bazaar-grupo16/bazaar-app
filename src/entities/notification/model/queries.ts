import { useQuery } from "@tanstack/react-query";
import { useSessionUserId } from "@/shared/auth";
import { getNotifications, getUnreadNotificationCount } from "../api/notification";

export const notificationKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  list: (limit: number, offset: number) =>
    [...notificationKeys.lists(), { limit, offset }] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
};

export function useNotifications(limit = 20, offset = 0) {
  const userId = useSessionUserId();
  return useQuery({
    queryKey: notificationKeys.list(limit, offset),
    queryFn: () => getNotifications(limit, offset),
    enabled: !!userId,
  });
}

export function useUnreadNotificationCount() {
  const userId = useSessionUserId();
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: getUnreadNotificationCount,
    enabled: !!userId,
    refetchInterval: 30000,
  });
}
