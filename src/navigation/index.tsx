import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LoginPage } from "@/pages/login";
import { ProductDetailPage } from "@/pages/product-detail";
import { TabsNavigator } from "./TabsNavigator";
import type { LinkingOptions } from "@react-navigation/native";

export type RootStackParamList = {
  Login: undefined;
  Tabs: undefined;
  ProductDetail: {
    productId: string;
  };
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
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginPage} />
      <Stack.Screen name="Tabs" component={TabsNavigator} />
      <Stack.Screen name="ProductDetail" component={ProductDetailPage} />
    </Stack.Navigator>
  );
}
