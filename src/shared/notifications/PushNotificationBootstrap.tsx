import { useEffect } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import { useQueryClient } from "@tanstack/react-query";

import { notificationKeys, registerPushToken } from "@/entities/notification";
import { useAuthStore } from "@/shared/auth";

const EAS_PROJECT_ID = "e732a3a7-c154-452b-9582-f87ac91ba8c9";

type ExpoPermissionStatus = {
  granted?: boolean;
  status?: string;
  ios?: {
    status?: Notifications.IosAuthorizationStatus;
  };
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function hasNotificationPermission(permissions: ExpoPermissionStatus) {
  return (
    permissions.granted === true ||
    permissions.status === "granted" ||
    permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const currentPermissions = await Notifications.getPermissionsAsync();
  let granted = hasNotificationPermission(currentPermissions as ExpoPermissionStatus);
  if (!granted) {
    const requestedPermissions = await Notifications.requestPermissionsAsync();
    granted = hasNotificationPermission(requestedPermissions as ExpoPermissionStatus);
  }
  if (!granted) {
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: EAS_PROJECT_ID,
  });
  return token.data;
}

export function PushNotificationBootstrap() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;
    registerForPushNotificationsAsync()
      .then((token) => {
        if (!token || cancelled) return;
        return registerPushToken({
          expo_push_token: token,
          platform: Platform.OS,
        });
      })
      .catch((error) => {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[Push] Could not register push token", error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  useEffect(() => {
    const receivedSubscription = Notifications.addNotificationReceivedListener(() => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    });
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
        const deepLink = response.notification.request.content.data?.deep_link;
        if (typeof deepLink === "string") {
          void Linking.openURL(deepLink);
        }
      },
    );

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [queryClient]);

  return null;
}
