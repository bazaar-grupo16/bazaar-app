import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LoginPage } from "@/pages/login";
import { ProductDetailPage } from "@/pages/product-detail";
import { EditProductPage } from "@/pages/product-edit";
import { CheckoutPage } from "@/pages/checkout";
import { PaymentPage } from "@/pages/payment";
import { OrderPollingPage } from "@/pages/order-polling";
import { OrderResultPage } from "@/pages/order-result";
import { OrderDetailPage } from "@/pages/order-detail";
import { PinUnlockPage } from "@/pages/pin-unlock";
import { TabsNavigator } from "./TabsNavigator";
import type { LinkingOptions } from "@react-navigation/native";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useAuthStore } from "@/shared/auth";
import { colors } from "@/shared/styles";

export type RootStackParamList = {
  Login: undefined;
  Tabs: undefined;
  ProductDetail: { productId: string };
  EditProduct: { productId: string };
  Checkout: undefined;
  Payment: { orderId: string; initPoint: string };
  OrderPolling: { orderId: string };
  OrderResult: { orderId: string };
  OrderDetail: { orderId: string; fromCheckout?: boolean; fromSales?: boolean };
};

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ["bazaar://",'https://bazaar.pib.ar'],
  config: {
    screens: {
      Tabs: "",
      ProductDetail: "products/:productId",
      OrderPolling: "order-polling/:orderId",
      OrderResult: "order-result/:orderId",
      OrderDetail: "orders/:orderId",
    },
  },
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isHydrating = useAuthStore((state) => state.isHydrating);
  const isPinUnlockRequired = useAuthStore((state) => state.isPinUnlockRequired);

  if (isHydrating) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brand[500]} />
      </View>
    );
  }

  if (isPinUnlockRequired) {
    return <PinUnlockPage />;
  }

  return (
    // Render different navigator trees depending on auth state so
    // the app responds immediately when `accessToken` changes.
    accessToken ? (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={TabsNavigator} />
        <Stack.Screen name="ProductDetail" component={ProductDetailPage} />
        <Stack.Screen name="EditProduct" component={EditProductPage} />
        <Stack.Screen name="Checkout" component={CheckoutPage} />
        <Stack.Screen name="Payment" component={PaymentPage} />
        <Stack.Screen name="OrderPolling" component={OrderPollingPage} />
        <Stack.Screen name="OrderResult" component={OrderResultPage} />
        <Stack.Screen name="OrderDetail" component={OrderDetailPage} />
      </Stack.Navigator>
    ) : (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={TabsNavigator} />
        <Stack.Screen name="Login" component={LoginPage} />
        <Stack.Screen name="ProductDetail" component={ProductDetailPage} />
      </Stack.Navigator>
    )
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
});
