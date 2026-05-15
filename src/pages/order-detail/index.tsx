import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Alert, TextInput, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import type { RootStackParamList } from "@/navigation";
import { useOrder, useSaleDetail, useCancelOrder, useCancelSaleItem, useConfirmItemDelivery, useUpdateSaleItemStatus, getStatusColor } from "@/entities/order";
import type { OrderItemStatus, OrderStatus } from "@/entities/order";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Button } from "@/shared/ui";
import { colors, spacing, typography, radius } from "@/shared/styles";

const BUYER_CANCELLABLE: OrderStatus[] = ["PENDIENTE_DE_PAGO", "CONFIRMADA", "EN_PREPARACION"];
const SELLER_ITEM_CANCELLABLE: OrderItemStatus[] = ["CONFIRMADO", "EN_PREPARACION"];

const SELLER_ITEM_NEXT_STATUS: Record<
  OrderItemStatus,
  { nextStatus: OrderItemStatus; label: string; requiresTrackingCode: boolean }
> = {
  CONFIRMADO: { nextStatus: "EN_PREPARACION", label: "Marcar en preparación", requiresTrackingCode: false },
  EN_PREPARACION: { nextStatus: "ENVIADO", label: "Marcar como enviado", requiresTrackingCode: true },
  ENVIADO: { nextStatus: "ENVIADO", label: "Marcar como enviado", requiresTrackingCode: true },
  ENTREGADO: { nextStatus: "ENTREGADO", label: "Confirmado", requiresTrackingCode: false },
  CANCELADO: { nextStatus: "CANCELADO", label: "Cancelado", requiresTrackingCode: false },
  REEMBOLSO_EN_PROCESO: { nextStatus: "REEMBOLSO_EN_PROCESO", label: "Reembolso en proceso", requiresTrackingCode: false },
  REEMBOLSO_PROCESADO: { nextStatus: "REEMBOLSO_PROCESADO", label: "Reembolso procesado", requiresTrackingCode: false },
};

type OrderDetailRouteProp = RouteProp<RootStackParamList, "OrderDetail">;

export function OrderDetailPage() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<OrderDetailRouteProp>();
  const { orderId, fromCheckout, fromSales } = route.params;
  const [sellerTrackingModalVisible, setSellerTrackingModalVisible] = useState(false);
  const [sellerTrackingInput, setSellerTrackingInput] = useState("");
  const [sellerTrackingTarget, setSellerTrackingTarget] = useState<{ itemId: string; itemName: string } | null>(null);
  const [expandedOrderHistory, setExpandedOrderHistory] = useState(false);
  const [expandedItemHistories, setExpandedItemHistories] = useState<Record<string, boolean>>({});

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
  const { mutate: cancelOrderMutate, isPending: isCancelling } = useCancelOrder(orderId);
  const { mutate: cancelItem, isPending: isCancellingItem, variables: cancellingItemId } = useCancelSaleItem(orderId);
  const { mutate: confirmDelivery, isPending: isConfirmingDelivery, variables: confirmingItemId } = useConfirmItemDelivery(orderId);
  const { mutate: updateSaleItemStatus, isPending: isUpdatingSaleItemStatus, variables: updatingSaleItem } = useUpdateSaleItemStatus(orderId);

  const pageTitle = fromSales ? "Detalle de Venta" : "Detalle de Orden";

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

  const handleConfirmDelivery = (itemId: string, itemName: string) => {
    Alert.alert(
      "Confirmar recepción",
      `¿Confirmás que recibiste "${itemName}"?`,
      [
        { text: "No, volver", style: "cancel" },
        { text: "Sí, confirmar", onPress: () => void confirmDelivery(itemId) },
      ],
    );
  };

  const handleSellerItemStatus = (itemId: string, itemName: string, currentStatus: OrderItemStatus) => {
    const next = SELLER_ITEM_NEXT_STATUS[currentStatus];
    if (next.requiresTrackingCode) {
      setSellerTrackingTarget({ itemId, itemName });
      setSellerTrackingInput("");
      setSellerTrackingModalVisible(true);
      return;
    }

    updateSaleItemStatus({
      itemId,
      status: next.nextStatus,
    });
  };

  const handleSellerTrackingConfirm = () => {
    if (!sellerTrackingTarget) return;

    updateSaleItemStatus({
      itemId: sellerTrackingTarget.itemId,
      status: "ENVIADO",
      ...(sellerTrackingInput.trim() ? { trackingCode: sellerTrackingInput.trim() } : {}),
    });
    setSellerTrackingModalVisible(false);
    setSellerTrackingTarget(null);
  };

  const toggleOrderHistory = () => {
    setExpandedOrderHistory((current) => !current);
  };

  const toggleItemHistory = (itemId: string) => {
    setExpandedItemHistories((current) => ({
      ...current,
      [itemId]: !current[itemId],
    }));
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
  const orderHistory = (order.status_history ?? []).filter((event) => !event.item_id);

  return (
    <View style={[styles.fill, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Button variant="ghost" onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
        </Button>
        <Text style={styles.pageTitle}>{pageTitle}</Text>
      </View>

      <Modal
        visible={sellerTrackingModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setSellerTrackingModalVisible(false);
          setSellerTrackingTarget(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Código de seguimiento</Text>
            <Text style={styles.modalSubtitle}>Ingresá el código de seguimiento del ítem (opcional)</Text>
            <TextInput
              style={styles.modalInput}
              value={sellerTrackingInput}
              onChangeText={setSellerTrackingInput}
              placeholder="Ej: AR123456789"
              autoCapitalize="characters"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => {
                  setSellerTrackingModalVisible(false);
                  setSellerTrackingTarget(null);
                }}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonPrimary} onPress={handleSellerTrackingConfirm}>
                <Text style={styles.modalButtonPrimaryText}>Confirmar envío</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}> 
        <View style={styles.section}>
          <Text style={styles.orderId}>Orden #{order.order_id.split("-")[0]}</Text>
          <Text style={styles.orderDate}>{date}</Text>
          {(() => {
            const displayStatus = order.aggregated_status ?? order.status;
            return (
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(displayStatus) + "20" }]}>
                <Text style={[styles.statusText, { color: getStatusColor(displayStatus) }]}>
                  {displayStatus.replace(/_/g, " ")}
                </Text>
              </View>
            );
          })()}
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

        {!fromSales && order.tracking_code && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Seguimiento general</Text>
            <View style={styles.trackingRow}>
              <Ionicons name="locate-outline" size={20} color={colors.brand[500]} />
              <Text style={styles.trackingCode}>{order.tracking_code}</Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{fromSales ? "Items vendidos" : "Items"}</Text>
          {order.items.map((item) => {
            const canCancelItem = fromSales && SELLER_ITEM_CANCELLABLE.includes(item.status);
            const canBuyerConfirmItem = !fromSales && item.status === "ENVIADO";
            const sellerItemAction = fromSales ? SELLER_ITEM_NEXT_STATUS[item.status] : null;
            const isThisItemCancelling = isCancellingItem && cancellingItemId === item.id;
            const isThisItemConfirming = isConfirmingDelivery && confirmingItemId === item.id;
            const isThisItemUpdating = isUpdatingSaleItemStatus && updatingSaleItem?.itemId === item.id;
            const itemHistoryExpanded = expandedItemHistories[item.id] === true;
            const itemHistory = item.status_history ?? [];

            return (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.product_name}</Text>
                    <Text style={styles.itemQuantity}>Cantidad: {item.quantity}</Text>
                    <Text style={styles.itemStatus}>{item.status.replace(/_/g, " ")}</Text>
                    {item.tracking_code && (
                      <Text style={styles.itemTrackingCode}>Tracking: {item.tracking_code}</Text>
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
                    {sellerItemAction && sellerItemAction.nextStatus !== item.status && (
                      <TouchableOpacity
                        onPress={() => handleSellerItemStatus(item.id, item.product_name, item.status)}
                        disabled={isUpdatingSaleItemStatus}
                        style={styles.sellerActionButton}
                      >
                        {isThisItemUpdating ? (
                          <ActivityIndicator size="small" color={colors.white} />
                        ) : (
                          <Text style={styles.sellerActionButtonText}>{sellerItemAction.label}</Text>
                        )}
                      </TouchableOpacity>
                    )}
                    {canBuyerConfirmItem && (
                      <TouchableOpacity
                        onPress={() => handleConfirmDelivery(item.id, item.product_name)}
                        disabled={isConfirmingDelivery}
                        style={[styles.confirmReceiptButton, isConfirmingDelivery && styles.buttonDisabled]}
                      >
                        {isThisItemConfirming ? (
                          <ActivityIndicator size="small" color={colors.white} />
                        ) : (
                          <>
                            <Ionicons name="checkmark-circle-outline" size={20} color={colors.white} />
                            <Text style={styles.confirmReceiptButtonText}>Confirmar recepción</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {itemHistory.length > 0 && (
                  <View style={styles.itemHistorySection}>
                    <TouchableOpacity
                      onPress={() => toggleItemHistory(item.id)}
                      activeOpacity={0.8}
                      style={styles.historyToggle}
                    >
                      <Text style={styles.historyToggleText}>Historial del ítem</Text>
                      <Ionicons
                        name={itemHistoryExpanded ? "chevron-up" : "chevron-down"}
                        size={18}
                        color={colors.gray[500]}
                      />
                    </TouchableOpacity>

                    {itemHistoryExpanded && (
                      <View style={styles.historyList}>
                        {itemHistory.map((event, index) => (
                          <View key={`${item.id}-${index}`} style={styles.transactionRow}>
                            <View style={styles.transactionDot} />
                            <View style={styles.transactionInfo}>
                              <Text style={styles.transactionStatus}>{event.new_status.replace(/_/g, " ")}</Text>
                              <Text style={styles.transactionDate}>
                                {new Date(event.timestamp).toLocaleDateString("es-AR", {
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
                  </View>
                )}
              </View>
            );
          })}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${order.total_amount.toFixed(2)}</Text>
          </View>
        </View>

        {!fromSales && orderHistory.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity onPress={toggleOrderHistory} activeOpacity={0.8} style={styles.historyHeader}>
              <Text style={styles.sectionTitle}>Historial de la orden</Text>
              <Ionicons
                name={expandedOrderHistory ? "chevron-up" : "chevron-down"}
                size={18}
                color={colors.gray[500]}
              />
            </TouchableOpacity>
            {expandedOrderHistory && (
              <View style={styles.historyList}>
                {orderHistory.map((t, i) => (
                  <View key={i} style={styles.transactionRow}>
                    <View style={styles.transactionDot} />
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionStatus}>{t.new_status.replace(/_/g, " ")}</Text>
                      <Text style={styles.transactionDate}>
                        {new Date(t.timestamp).toLocaleDateString("es-AR", {
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
          </View>
        )}

        {!fromSales && BUYER_CANCELLABLE.includes(order.status) && (
          <TouchableOpacity
            style={[styles.cancelButton, isCancelling && styles.buttonDisabled]}
            onPress={handleCancelOrder}
            disabled={isCancelling}
            activeOpacity={0.8}
          >
            {isCancelling ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={20} color={colors.white} />
                <Text style={styles.advanceButtonText}>Cancelar compra</Text>
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
    borderRadius: 999,
  },
  statusText: {
    color: colors.brand[700],
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  summaryBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  aggregatedStatusBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
  },
  aggregatedStatusText: {
    color: colors.gray[700],
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  sectionTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  addressText: {
    fontSize: typography.size.md,
    color: colors.gray[700],
    lineHeight: 22,
  },
  trackingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  trackingCode: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.brand[600],
    letterSpacing: 1,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  itemCard: {
    paddingVertical: spacing.xs,
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
    color: colors.gray[700],
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
  itemTrackingCode: {
    fontSize: typography.size.sm,
    color: colors.gray[500],
    marginTop: 2,
  },
  cancelItemButton: {
    padding: spacing.xs,
  },
  confirmButton: {
    padding: spacing.xs,
  },
  sellerActionButton: {
    backgroundColor: colors.brand[500],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  sellerActionButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.white,
  },
  itemHistorySection: {
    marginTop: spacing.sm,
  },
  historyToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  historyToggleText: {
    fontSize: typography.size.sm,
    color: colors.gray[700],
    fontWeight: typography.weight.semibold,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  historyList: {
    marginTop: spacing.xs,
    gap: spacing.xs,
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
    color: colors.gray[700],
  },
  transactionDate: {
    fontSize: typography.size.sm,
    color: colors.gray[700],
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
  confirmReceiptButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: "#16a34a",
    borderRadius: radius.lg,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    minHeight: 56,
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  confirmReceiptButtonText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.white,
  },
  advanceButtonText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  modalBox: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: "100%",
    gap: spacing.sm,
  },
  modalTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.gray[700],
  },
  modalSubtitle: {
    fontSize: typography.size.sm,
    color: colors.gray[700],
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.size.md,
    color: colors.gray[900],
    marginTop: spacing.xs,
  },
  modalButtons: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.gray[300],
    alignItems: "center",
  },
  modalButtonSecondaryText: {
    fontSize: typography.size.sm,
    color: colors.gray[700],
    fontWeight: typography.weight.semibold,
  },
  modalButtonPrimary: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.brand[500],
    alignItems: "center",
  },
  modalButtonPrimaryText: {
    fontSize: typography.size.sm,
    color: colors.white,
    fontWeight: typography.weight.semibold,
  },
});
