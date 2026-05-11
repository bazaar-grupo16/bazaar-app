import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import type { RootStackParamList } from "@/navigation";
import { useOrder } from "@/entities/order";
import { cartKeys } from "@/entities/cart/model/queries";
import { Button } from "@/shared/ui";
import { colors, spacing, typography } from "@/shared/styles";

type OrderResultRouteProp = RouteProp<RootStackParamList, "OrderResult">;

export function OrderResultPage() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<OrderResultRouteProp>();
  const { orderId } = route.params;
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useOrder(orderId, false);

  const isSuccess = order?.status === "CONFIRMADA";
  const isError = order?.status === "PAGO_RECHAZADO" || order?.status === "CANCELADA";

  useEffect(() => {
    if (isSuccess) {
      // MS Orders empties the cart via saga, so we invalidate local cache
      void queryClient.invalidateQueries({ queryKey: cartKeys.all });
    }
  }, [isSuccess, queryClient]);

  if (isLoading || !order) {
    return (
      <View style={[styles.fill, { paddingTop: insets.top }]} />
    );
  }

  return (
    <View style={[styles.fill, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.md }]}>
      <View style={styles.centered}>
        {isSuccess ? (
          <>
            <Ionicons name="checkmark-circle" size={80} color={colors.success} />
            <Text style={styles.title}>¡Compra confirmada!</Text>
            <Text style={styles.description}>
              Tu orden <Text style={styles.highlight}>#{orderId.split("-")[0]}</Text> ha sido procesada con éxito.
            </Text>
          </>
        ) : isError ? (
          <>
            <Ionicons name="close-circle" size={80} color={colors.error} />
            <Text style={styles.title}>Pago Rechazado</Text>
            <Text style={styles.description}>
              No pudimos procesar tu pago. Tu carrito sigue guardado para que puedas reintentar.
            </Text>
          </>
        ) : (
          <>
            <Ionicons name="alert-circle" size={80} color={colors.warning} />
            <Text style={styles.title}>Estado Desconocido</Text>
            <Text style={styles.description}>
              El estado actual de tu orden es {order.status}.
            </Text>
          </>
        )}

        <View style={styles.actions}>
          {isError ? (
            <Button
              onPress={() => navigation.navigate("Tabs", { screen: "Cart" } as any)}
              style={styles.actionButton}
            >
              Volver al Carrito
            </Button>
          ) : (
            <>
              <Button
                onPress={() => navigation.navigate("OrderDetail", { orderId, fromCheckout: true })}
                style={[styles.actionButton, { marginBottom: spacing.sm }]}
                variant="primary"
              >
                Ver detalle
              </Button>
              <Button
                onPress={() => navigation.navigate("Tabs")}
                style={styles.actionButton}
                variant="ghost"
              >
                Volver al Inicio
              </Button>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: colors.white,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
    textAlign: "center",
    marginTop: spacing.md,
  },
  description: {
    fontSize: typography.size.md,
    color: colors.gray[600],
    textAlign: "center",
    lineHeight: 22,
  },
  highlight: {
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
  },
  actions: {
    marginTop: spacing.xl,
    width: "100%",
  },
  actionButton: {
    width: "100%",
  },
});
