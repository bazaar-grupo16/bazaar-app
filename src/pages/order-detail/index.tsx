import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import type { RootStackParamList } from "@/navigation";
import { useOrder } from "@/entities/order";
import { Button } from "@/shared/ui";
import { colors, spacing, typography, radius } from "@/shared/styles";

type OrderDetailRouteProp = RouteProp<RootStackParamList, "OrderDetail">;

export function OrderDetailPage() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<OrderDetailRouteProp>();
  const { orderId } = route.params;

  const { data: order, isLoading } = useOrder(orderId, false);

  if (isLoading) {
    return (
      <View style={[styles.fill, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Button variant="ghost" onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
          </Button>
          <Text style={styles.pageTitle}>Detalle de Orden</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.brand[500]} />
        </View>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.fill, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Button variant="ghost" onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
          </Button>
          <Text style={styles.pageTitle}>Detalle de Orden</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorText}>No se pudo cargar la orden.</Text>
        </View>
      </View>
    );
  }

  const date = new Date(order.created_at).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View style={[styles.fill, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Button variant="ghost" onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
        </Button>
        <Text style={styles.pageTitle}>Detalle de Orden</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
        <View style={styles.section}>
          <Text style={styles.orderId}>Orden #{order.order_id.split("-")[0]}</Text>
          <Text style={styles.orderDate}>{date}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{order.status.replace(/_/g, " ")}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dirección de Envío</Text>
          <Text style={styles.addressText}>
            {String(order.shipping_address.street)}{"\n"}
            {String(order.shipping_address.city)}, {String(order.shipping_address.state)}{"\n"}
            {String(order.shipping_address.zip_code)} - {String(order.shipping_address.country)}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          {order.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.product_name}</Text>
                <Text style={styles.itemQuantity}>Cantidad: {item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>${(item.unit_price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${order.total_amount.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  pageTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: typography.size.md,
    color: colors.gray[500],
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  orderId: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  orderDate: {
    fontSize: typography.size.sm,
    color: colors.gray[500],
    marginBottom: spacing.sm,
  },
  statusBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.brand[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  statusText: {
    color: colors.brand[700],
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  sectionTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.gray[800],
    marginBottom: spacing.sm,
  },
  addressText: {
    fontSize: typography.size.md,
    color: colors.gray[600],
    lineHeight: 22,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.gray[900],
    marginBottom: 2,
  },
  itemQuantity: {
    fontSize: typography.size.sm,
    color: colors.gray[500],
  },
  itemPrice: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
    paddingTop: spacing.sm,
  },
  totalLabel: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
  },
  totalValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.brand[600],
  },
});
