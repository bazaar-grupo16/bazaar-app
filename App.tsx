import { NavigationContainer } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Linking from "expo-linking";
import { linking, RootNavigator } from "@/navigation";
import { bootstrapAuthSession } from "@/shared/auth";
import { navigationRef } from "@/shared/navigation";

export default function App() {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    void bootstrapAuthSession();
  }, []);

  // Listen for deep links from Mercado Pago redirects (back_urls)
  useEffect(() => {
    const handleDeepLink = ({ url }: { url: string }) => {
      // Log for debugging
      console.log("[Deep Link] Received URL:", url);
    };

    const subscription = Linking.addEventListener("url", handleDeepLink);

    // Check for initial URL (app was closed)
    Linking.getInitialURL()
      .then((url) => {
        if (url !== null) {
          console.log("[Deep Link] Initial URL:", url);
        }
      })
      .catch((err) => {
        console.error("[Deep Link] Error reading initial URL:", err);
      });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer ref={navigationRef} linking={linking}>
          <StatusBar style="auto" />
          <RootNavigator />
        </NavigationContainer>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
