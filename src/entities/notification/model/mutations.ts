import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  markAllNotificationsAsRead,
  markNotificationAsRead,
  registerPushToken,
  unregisterPushToken,
} from "../api/notification";
import type { PushTokenRequest } from "./types";
import { notificationKeys } from "./queries";

function invalidateNotifications(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => invalidateNotifications(queryClient),
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => invalidateNotifications(queryClient),
  });
}

export function useRegisterPushToken() {
  return useMutation({
    mutationFn: (data: PushTokenRequest) => registerPushToken(data),
  });
}

export function useUnregisterPushToken() {
  return useMutation({
    mutationFn: unregisterPushToken,
  });
}
