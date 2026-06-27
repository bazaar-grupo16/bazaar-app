import { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import type { RootStackParamList } from "@/navigation";
import { useOrdersHistory, useSalesHistory, getStatusColor, type OrderResponse, type OrderStatus, type OrderItemResponse } from "@/entities/order";
import { colors, spacing, typography, radius } from "@/shared/styles";
import { useAuthStore } from "@/shared/auth";

type Section = "compras" | "ventas";
type FilterOption = { label: string; value: OrderStatus | null };

const TERMINAL_ORDER_STATUSES: OrderStatus[] = [
  "CANCELADA", "PAGO_RECHAZADO", "REEMBOLSO_EN_PROCESO", "REEMBOLSO_PROCESADO",
];
type SaleItemCard = {
  order: OrderResponse;
  item: OrderItemResponse;
};

const PURCHASE_FILTERS: FilterOption[] = [
  { label: "Todas", value: null },
  { label: "Pendiente de pago", value: "PENDIENTE_DE_PAGO" },
  { label: "Confirmada", value: "CONFIRMADA" },
  { label: "En preparación", value: "EN_PREPARACION" },
  { label: "Enviada", value: "ENVIADA" },
  { label: "Entregada", value: "ENTREGADA" },
  { label: "Cancelada", value: "CANCELADA" },
  { label: "Pago rechazado", value: "PAGO_RECHAZADO" },
  { label: "Reembolso en proceso", value: "REEMBOLSO_EN_PROCESO" },
  { label: "Reembolso procesado", value: "REEMBOLSO_PROCESADO" },
];

const SALE_FILTERS: FilterOption[] = [
  { label: "Todas", value: null },
  { label: "Confirmada", value: "CONFIRMADA" },
  { label: "En preparación", value: "EN_PREPARACION" },
  { label: "Enviada", value: "ENVIADA" },
  { label: "Entregada", value: "ENTREGADA" },
  { label: "Cancelada", value: "CANCELADA" },
];

export function OrdersPage() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isGuest = !useAuthStore((s) => s.accessToken);
  const [section, setSection] = useState<Section>("compras");
  const [purchaseStatus, setPurchaseStatus] = useState<OrderStatus | null>(null);
  const [saleStatus, setSaleStatus] = useState<OrderStatus | null>(null);

  const {
    data: purchaseData,
    isLoading: purchaseLoading,
    isRefetching: purchaseRefetching,
    refetch: refetchPurchases,
  } = useOrdersHistory(1, 50, purchaseStatus ?? undefined);

  const {
    data: salesData,
    isLoading: salesLoading,
    isRefetching: salesRefetching,
    refetch: refetchSales,
  } = useSalesHistory(1, 50, saleStatus ?? undefined);

  const orders = purchaseData?.orders ?? [];
  const sales = (salesData?.orders ?? []).flatMap((order) =>
    order.items.map((item) => ({ order, item })),
  );

  const renderPurchaseItem = useCallback(
    ({ item }: { item: OrderResponse }) => {
      const date = new Date(item.created_at).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      return (
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate("OrderDetail", { orderId: item.order_id })}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.orderId}>#{item.order_id.split("-")[0]}</Text>
            <Text style={styles.orderDate}>{date}</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={[styles.orderStatus, { color: getStatusColor(item.aggregated_status) }]}>
              {(item.aggregated_status).replace(/_/g, " ")}
            </Text>
            <Text style={styles.orderTotal}>${item.total_amount.toFixed(2)}</Text>
          </View>
        </TouchableOpacity>
      );
    },
    [navigation]
  );

  const renderSaleItem = useCallback(
    ({ item }: { item: SaleItemCard }) => {
      const date = new Date(item.order.created_at).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const displayStatus = TERMINAL_ORDER_STATUSES.includes(item.order.status)
        ? item.order.status
        : item.item.status;
      return (
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate("OrderDetail", { orderId: item.order.order_id, fromSales: true })}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.orderId}>#{item.order.order_id.split("-")[0]}</Text>
            <Text style={styles.orderDate}>{date}</Text>
          </View>
          <View style={styles.cardBody}>
            <View style={styles.saleInfo}>
              <Text style={styles.productName} numberOfLines={1}>
                {item.item.product_name}
              </Text>
              <Text style={[styles.saleStatus, { color: getStatusColor(displayStatus) }]}>
                {displayStatus.replace(/_/g, " ")}
              </Text>
            </View>
            <Text style={styles.orderTotal}>${(item.item.unit_price * item.item.quantity).toFixed(2)}</Text>
          </View>
        </TouchableOpacity>
      );
    },
    [navigation]
  );

  if (isGuest) {
    return (
      <View style={styles.fill}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.pageTitle}>Pedidos</Text>
        </View>
        <View style={styles.guestContainer}>
          <Ionicons name="cube-outline" size={64} color={colors.gray[300]} />
          <Text style={styles.guestTitle}>Iniciá sesión para ver tus pedidos</Text>
          <Text style={styles.guestText}>
            Accedé a tu historial de compras y ventas con tu cuenta.
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate("Login" as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.loginButtonText}>Iniciar sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const filters = section === "compras" ? PURCHASE_FILTERS : SALE_FILTERS;
  const selectedStatus = section === "compras" ? purchaseStatus : saleStatus;
  const setStatus = section === "compras" ? setPurchaseStatus : setSaleStatus;

  const filtersHeader = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filtersRow}
      contentContainerStyle={styles.filters}
    >
      {filters.map((f) => {
        const active = selectedStatus === f.value;
        return (
          <TouchableOpacity
            key={f.label}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => setStatus(f.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const isLoading = section === "compras" ? purchaseLoading : salesLoading;
  const isRefetching = section === "compras" ? purchaseRefetching : salesRefetching;
  const refetch = section === "compras" ? refetchPurchases : refetchSales;
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };
  return (
    <View style={styles.fill}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.pageTitle}>Pedidos</Text>
      </View>

      <View style={styles.sectionTabs}>
        {(["compras", "ventas"] as Section[]).map((s) => (
          <TouchableOpacity
            key={s}
            style={styles.sectionTab}
            onPress={() => setSection(s)}
            activeOpacity={0.7}
          >
            <Text style={[styles.sectionTabLabel, section === s && styles.sectionTabLabelActive]}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
            {section === s && <View style={styles.sectionTabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <>
          {filtersHeader}
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.brand[500]} />
          </View>
        </>
      ) : section === "compras" ? (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.order_id}
          renderItem={renderPurchaseItem}
          ListHeaderComponent={filtersHeader}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="cube-outline" size={64} color={colors.gray[300]} />
              <Text style={styles.emptyTitle}>
                {selectedStatus ? "Sin compras en este estado" : "Todavía no tenés pedidos"}
              </Text>
              <Text style={styles.emptyText}>
                {selectedStatus
                  ? "Probá con otro filtro"
                  : "Cuando realices una compra, tus pedidos van a aparecer acá."}
              </Text>
            </View>
          }
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + spacing.md, flexGrow: 1 }]}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      ) : (
        <FlatList
          data={sales}
          keyExtractor={(item) => `${item.order.order_id}:${item.item.id}`}
          renderItem={renderSaleItem}
          ListHeaderComponent={filtersHeader}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="storefront-outline" size={64} color={colors.gray[300]} />
              <Text style={styles.emptyTitle}>
                {selectedStatus ? "Sin ventas en este estado" : "Todavía no tenés ventas"}
              </Text>
              <Text style={styles.emptyText}>
                {selectedStatus
                  ? "Probá con otro filtro"
                  : "Cuando alguien compre tus productos, aparecerán acá."}
              </Text>
            </View>
          }
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + spacing.md, flexGrow: 1 }]}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  pageTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
  },
  sectionTabs: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    paddingHorizontal: spacing.md,
  },
  sectionTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    position: "relative",
  },
  sectionTabLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.gray[400],
  },
  sectionTabLabelActive: {
    color: colors.brand[500],
  },
  sectionTabIndicator: {
    position: "absolute",
    bottom: 0,
    left: "25%",
    right: "25%",
    height: 2,
    backgroundColor: colors.brand[500],
    borderRadius: 99,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.gray[900],
    textAlign: "center",
  },
  emptyText: {
    fontSize: typography.size.md,
    color: colors.gray[500],
    textAlign: "center",
    lineHeight: 22,
  },
  filtersRow: {
    flexGrow: 0,
    backgroundColor: colors.white,
  },
  filters: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.white,
  },
  chipActive: {
    backgroundColor: colors.brand[500],
    borderColor: colors.brand[500],
  },
  chipText: {
    fontSize: typography.size.sm,
    color: colors.gray[500],
    fontWeight: typography.weight.semibold,
  },
  chipTextActive: {
    color: colors.white,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  orderId: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
  },
  orderDate: {
    fontSize: typography.size.sm,
    color: colors.gray[500],
  },
  cardBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  saleInfo: {
    flex: 1,
    gap: 4,
  },
  orderStatus: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.gray[600],
  },
  saleStatus: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.gray[600],
  },
  productName: {
    fontSize: typography.size.sm,
    color: colors.gray[500],
  },
  orderTotal: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
  },
  guestContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  guestTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.gray[900],
    textAlign: "center",
  },
  guestText: {
    fontSize: typography.size.md,
    color: colors.gray[500],
    textAlign: "center",
    lineHeight: 22,
  },
  loginButton: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    backgroundColor: colors.brand[500],
    borderRadius: radius.md,
  },
  loginButtonText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.white,
  },
});
