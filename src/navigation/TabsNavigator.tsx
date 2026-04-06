import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { HomePage } from "@/pages/home";
import { SearchPage } from "@/pages/search";
import { CartPage } from "@/pages/cart";
import { ProfilePage } from "@/pages/profile";
import { colors } from "@/shared/styles";

export type TabsParamList = {
  Home: undefined;
  Search: undefined;
  Cart: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabsParamList>();

export function TabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.brand[500],
        tabBarInactiveTintColor: colors.gray[500],
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Home: "home-outline",
            Search: "search-outline",
            Cart: "cart-outline",
            Profile: "person-outline",
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomePage} options={{ tabBarLabel: "Home" }} />
      <Tab.Screen name="Search" component={SearchPage} options={{ tabBarLabel: "Búsqueda" }} />
      <Tab.Screen name="Cart" component={CartPage} options={{ tabBarLabel: "Carrito" }} />
      <Tab.Screen name="Profile" component={ProfilePage} options={{ tabBarLabel: "Perfil" }} />
    </Tab.Navigator>
  );
}
