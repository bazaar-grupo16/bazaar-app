import { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation";
import { useOrder, useCheckoutStore } from "@/entities/order";
import { colors, spacing, typography } from "@/shared/styles";
import { Button } from "@/shared/ui";

type OrderPollingRouteProp = RouteProp<RootStackParamList, "OrderPolling">;

export function OrderPollingPage() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<OrderPollingRouteProp>();
  const { orderId } = route.params;
  const clearIdempotencyKey = useCheckoutStore((s) => s.clearIdempotencyKey);

  // Once we reach polling, the order has been committed via gateway,
  // so we can safely clear the idempotency key for the next intent.
  useEffect(() => {
    clearIdempotencyKey();
  }, [clearIdempotencyKey]);

  // Poll until status changes from PENDIENTE_DE_PAGO
  const { data: order, isLoading } = useOrder(
    orderId,
    (query) => {
      const currentOrder = query.state.data;
      if (!currentOrder) return 2000;
      return currentOrder.status === "PENDIENTE_DE_PAGO" ? 2000 : false;
    }
  );

  useEffect(() => {
    if (order && order.status !== "PENDIENTE_DE_PAGO") {
      navigation.replace("OrderResult", { orderId });
    }
  }, [order, navigation, orderId]);

  return (
    <View style={[styles.fill, { paddingTop: insets.top + spacing.xl }]}>
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.brand[500]} />
        <Text style={styles.title}>Procesando pago...</Text>
        <Text style={styles.description}>
          Estamos confirmando tu transacción. Esto puede tomar unos segundos.
        </Text>

        <Button
          variant="ghost"
          onPress={() => navigation.navigate("OrderDetail", { orderId, fromCheckout: true })}
          style={styles.detailButton}
        >
          Ver detalle
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.xl,
  },
  title: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.gray[900],
    textAlign: "center",
  },
  description: {
    fontSize: typography.size.md,
    color: colors.gray[500],
    textAlign: "center",
  },
  detailButton: {
    marginTop: spacing.lg,
  },
});
