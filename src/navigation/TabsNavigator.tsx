import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { HomePage } from "@/pages/home";
import { OrdersPage } from "@/pages/orders";
import { PublishPage } from "@/pages/publish";
import { CartPage } from "@/pages/cart";
import { ProfilePage } from "@/pages/profile";
import { colors, spacing, typography } from "@/shared/styles";

export type TabsParamList = {
  Home: undefined;
  Orders: undefined;
  Publish: undefined;
  Cart: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabsParamList>();

const TAB_CONTENT_HEIGHT = 100;

function PublishTabButton({
  onPress,
}: {
  onPress: (() => void) | undefined;
}) {
  return (
    <TouchableOpacity
      style={[styles.publishWrapper, { paddingBottom: spacing.xs }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.publishCircle}>
        <Ionicons name="add" size={28} color={colors.white} />
      </View>
      <Text style={styles.publishLabel}>Publicar</Text>
    </TouchableOpacity>
  );
}

export function TabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.brand[500],
        tabBarInactiveTintColor: colors.gray[400],
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: {
          height: TAB_CONTENT_HEIGHT,
          paddingBottom: spacing.xs,
          paddingTop: spacing.xs,
          borderTopWidth: 1,
          borderTopColor: colors.gray[200],
          backgroundColor: colors.white,
        },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Home: "home-outline",
            Orders: "cube-outline",
            Cart: "cart-outline",
            Profile: "person-outline",
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomePage} options={{ tabBarLabel: "Inicio" }} />
      <Tab.Screen name="Orders" component={OrdersPage} options={{ tabBarLabel: "Pedidos" }} />
      <Tab.Screen
        name="Publish"
        component={PublishPage}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: () => null,
          tabBarButton: ({ onPress }) => (
            <PublishTabButton
              onPress={onPress as (() => void) | undefined}
            />
          ),
        }}
      />
      <Tab.Screen name="Cart" component={CartPage} options={{ tabBarLabel: "Carrito" }} />
      <Tab.Screen name="Profile" component={ProfilePage} options={{ tabBarLabel: "Perfil" }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabLabel: {
    fontSize: 11,
    fontWeight: typography.weight.semibold,
  },
  publishWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: TAB_CONTENT_HEIGHT,
    transform: [{ translateY: -30 }],
  },
  publishCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.brand[500],
    alignItems: "center",
    justifyContent: "center",
    marginTop: 0,
  },
  publishLabel: {
    fontSize: 11,
    fontWeight: typography.weight.semibold,
    color: colors.gray[400],
    marginTop: 2,
  },
});
