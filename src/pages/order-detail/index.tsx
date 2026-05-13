import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import type { RootStackParamList } from "@/navigation";
import { useOrder, useSaleDetail, useUpdateOrderStatus, useCancelOrder, useCancelSaleItem, useSaleItems } from "@/entities/order";
import type { OrderStatus } from "@/entities/order";
import { Button } from "@/shared/ui";
import { colors, spacing, typography, radius } from "@/shared/styles";

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  CONFIRMADA: "EN_PREPARACION",
  EN_PREPARACION: "ENVIADA",
  ENVIADA: "ENTREGADA",
};

const BUYER_CANCELLABLE: OrderStatus[] = ["PENDIENTE_DE_PAGO", "CONFIRMADA", "EN_PREPARACION"];
const SELLER_ITEM_CANCELLABLE: OrderStatus[] = ["CONFIRMADA", "EN_PREPARACION"];

const NEXT_STATUS_LABEL: Partial<Record<OrderStatus, string>> = {
  CONFIRMADA: "Marcar en preparación",
  EN_PREPARACION: "Marcar como enviada",
  ENVIADA: "Marcar como entregada",
};

type OrderDetailRouteProp = RouteProp<RootStackParamList, "OrderDetail">;

export function OrderDetailPage() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<OrderDetailRouteProp>();
  const { orderId, fromCheckout, fromSales } = route.params;

  const handleBack = () => {
    if (fromCheckout) {
      navigation.navigate("Tabs");
    } else {
      navigation.goBack();
    }
  };

  const buyerQuery = useOrder(fromSales ? undefined : orderId, false);
  const sellerQuery = useSaleDetail(fromSales ? orderId : undefined);
  const { data: order, isLoading } = fromSales ? sellerQuery : buyerQuery;
  const { mutate: advanceStatus, isPending: isAdvancing } = useUpdateOrderStatus(orderId);
  const { mutate: cancelOrderMutate, isPending: isCancelling } = useCancelOrder(orderId);
  const { mutate: cancelItem, isPending: isCancellingItem, variables: cancellingItemId } = useCancelSaleItem(orderId);
  const { data: saleItemsData } = useSaleItems(fromSales ? orderId : undefined);

  const saleItemsById = saleItemsData?.items
    ? Object.fromEntries(saleItemsData.items.map((i) => [i.id, i]))
    : {} as Record<string, { status?: string }>;

  const pageTitle = fromSales ? "Detalle de Venta" : "Detalle de Orden";

  const handleAdvanceStatus = () => {
    if (!order) return;
    const next = NEXT_STATUS[order.status];
    const label = NEXT_STATUS_LABEL[order.status];
    if (!next || !label) return;
    Alert.alert(
      "Confirmar cambio de estado",
      `¿Querés avanzar la orden a "${next.replace(/_/g, " ")}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Confirmar", onPress: () => advanceStatus(next) },
      ],
    );
  };

  const handleCancelOrder = () => {
    Alert.alert(
      "Cancelar orden",
      "¿Estás seguro de que querés cancelar esta orden?",
      [
        { text: "No, volver", style: "cancel" },
        { text: "Sí, cancelar", style: "destructive", onPress: () => cancelOrderMutate() },
      ],
    );
  };

  const handleCancelItem = (itemId: string, itemName: string) => {
    Alert.alert(
      "Cancelar ítem",
      `¿Querés cancelar "${itemName}"?`,
      [
        { text: "No, volver", style: "cancel" },
        { text: "Sí, cancelar", style: "destructive", onPress: () => cancelItem(itemId) },
      ],
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.fill, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Button variant="ghost" onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
          </Button>
          <Text style={styles.pageTitle}>{pageTitle}</Text>
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
          <Button variant="ghost" onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
          </Button>
          <Text style={styles.pageTitle}>{pageTitle}</Text>
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
        <Button variant="ghost" onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
        </Button>
        <Text style={styles.pageTitle}>{pageTitle}</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
        <View style={styles.section}>
          <Text style={styles.orderId}>Orden #{order.order_id.split("-")[0]}</Text>
          <Text style={styles.orderDate}>{date}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{order.status.replace(/_/g, " ")}</Text>
          </View>
        </View>

        {fromSales && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Comprador</Text>
            <View style={styles.buyerRow}>
              <Ionicons name="person-circle-outline" size={28} color={colors.gray[400]} />
              <Text style={styles.buyerText}>{order.user_id}</Text>
            </View>
          </View>
        )}

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
          {order.items.map((item) => {
            const saleItem = saleItemsById[item.id];
            const canCancelItem = fromSales && SELLER_ITEM_CANCELLABLE.includes(order.status);
            const isThisItemCancelling = isCancellingItem && cancellingItemId === item.id;
            return (
              <View key={item.id} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.product_name}</Text>
                  <Text style={styles.itemQuantity}>Cantidad: {item.quantity}</Text>
                  {saleItem?.status && (
                    <Text style={styles.itemStatus}>{saleItem.status.replace(/_/g, " ")}</Text>
                  )}
                </View>
                <View style={styles.itemRight}>
                  <Text style={styles.itemPrice}>${(item.unit_price * item.quantity).toFixed(2)}</Text>
                  {canCancelItem && (
                    <TouchableOpacity
                      onPress={() => handleCancelItem(item.id, item.product_name)}
                      disabled={isCancellingItem}
                      style={styles.cancelItemButton}
                    >
                      {isThisItemCancelling ? (
                        <ActivityIndicator size="small" color={colors.gray[400]} />
                      ) : (
                        <Ionicons name="trash-outline" size={18} color={colors.gray[400]} />
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${order.total_amount.toFixed(2)}</Text>
          </View>
        </View>

        {order.transactions && order.transactions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Historial</Text>
            {order.transactions.map((t, i) => (
              <View key={i} style={styles.transactionRow}>
                <View style={styles.transactionDot} />
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionStatus}>{t.status.replace(/_/g, " ")}</Text>
                  <Text style={styles.transactionDate}>
                    {new Date(t.changed_at).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {fromSales && NEXT_STATUS[order.status] && (
          <TouchableOpacity
            style={[styles.advanceButton, isAdvancing && styles.advanceButtonDisabled]}
            onPress={handleAdvanceStatus}
            disabled={isAdvancing}
            activeOpacity={0.8}
          >
            {isAdvancing ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Ionicons name="arrow-forward-circle-outline" size={20} color={colors.white} />
                <Text style={styles.advanceButtonText}>{NEXT_STATUS_LABEL[order.status]}</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {!fromSales && BUYER_CANCELLABLE.includes(order.status) && (
          <TouchableOpacity
            style={[styles.cancelButton, isCancelling && styles.advanceButtonDisabled]}
            onPress={handleCancelOrder}
            disabled={isCancelling}
            activeOpacity={0.8}
          >
            {isCancelling ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={20} color={colors.white} />
                <Text style={styles.advanceButtonText}>Cancelar orden</Text>
              </>
            )}
          </TouchableOpacity>
        )}
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
  buyerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  buyerText: {
    fontSize: typography.size.sm,
    color: colors.gray[600],
    flex: 1,
  },
  itemRight: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  itemStatus: {
    fontSize: typography.size.sm,
    color: colors.brand[500],
    fontWeight: typography.weight.semibold,
    marginTop: 2,
  },
  cancelItemButton: {
    padding: spacing.xs,
  },
  transactionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  transactionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand[500],
    marginTop: 5,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionStatus: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.gray[900],
  },
  transactionDate: {
    fontSize: typography.size.sm,
    color: colors.gray[500],
  },
  advanceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.brand[500],
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: "#ef4444",
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  advanceButtonDisabled: {
    opacity: 0.6,
  },
  advanceButtonText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.white,
  },
});
