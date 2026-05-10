import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LoginPage } from "@/pages/login";
import { ProductDetailPage } from "@/pages/product-detail";
import { EditProductPage } from "@/pages/product-edit";
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
};

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ["bazaar://",'https://bazaar.pib.ar'],
  config: {
    screens: {
      Tabs: "",
      ProductDetail: "products/:productId",
    },
  },
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isHydrating = useAuthStore((state) => state.isHydrating);

  if (isHydrating) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brand[500]} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={accessToken ? "Tabs" : "Login"}
    >
      <Stack.Screen name="Login" component={LoginPage} />
      <Stack.Screen name="Tabs" component={TabsNavigator} />
      <Stack.Screen name="ProductDetail" component={ProductDetailPage} />
      <Stack.Screen name="EditProduct" component={EditProductPage} />
    </Stack.Navigator>
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
