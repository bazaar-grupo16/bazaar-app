import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation";
import * as Linking from "expo-linking";
import { useOrder } from "@/entities/order";
import { useDebugPayment } from "@/entities/payment";
import { Button } from "@/shared/ui";
import { colors, spacing, typography } from "@/shared/styles";

const DEBUG = false;

type PaymentRouteProp = RouteProp<RootStackParamList, "Payment">;

export function PaymentPage() {
  return DEBUG ? <DebugPaymentPage /> : <MercadoPagoPaymentPage />;
}

function MercadoPagoPaymentPage() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<PaymentRouteProp>();
  const { orderId, initPoint } = route.params;
  const { data: order, isLoading } = useOrder(orderId, 3000);
  const [isOpening, setIsOpening] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasAutoOpenedRef = useRef(false);

  useEffect(() => {
    if (!order || order.status === "PENDIENTE_DE_PAGO") {
      return;
    }

    if (order.aggregated_status === "CONFIRMADA" || order.aggregated_status === "PAGO_RECHAZADO") {
      navigation.replace("OrderResult", { orderId });
      return;
    }

    navigation.replace("OrderDetail", { orderId, fromCheckout: true });
  }, [navigation, order, orderId]);

  const openMercadoPago = async (isManualOpen = false) => {
    if (!initPoint) {
      setErrorMessage("No se recibió el enlace de pago de Mercado Pago.");
      setIsOpening(false);
      return;
    }

    if (!isManualOpen && hasAutoOpenedRef.current) {
      return;
    }

    if (!isManualOpen) {
      hasAutoOpenedRef.current = true;
    }

    try {
      await Linking.openURL(initPoint);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo abrir Mercado Pago.";
      setErrorMessage(message);
      setIsOpening(false);
    }
  };

  useEffect(() => {
    // wait while order is loading
    if (isLoading) return;

    // if order exists and is already resolved (not pending), don't open
    if (order && order.status !== "PENDIENTE_DE_PAGO") return;

    void openMercadoPago();
  }, [initPoint, isLoading, order]);

  const handleRetry = () => {
    setErrorMessage(null);
    setIsOpening(true);
    void openMercadoPago(true);
  };

  return (
    <View style={[styles.fill, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.md }]}>
      <View style={styles.content}>
        {isOpening || isLoading ? <ActivityIndicator size="large" color={colors.brand[500]} /> : null}
        <Text style={styles.title}>Redirigiendo a Mercado Pago</Text>
        <Text style={styles.description}>
          {order && order.status !== "PENDIENTE_DE_PAGO"
            ? "La orden ya fue resuelta. Te llevaremos a la vista correspondiente."
            : "El checkout se abrirá en una ventana externa. Cuando finalices el pago, volverás a la app para continuar con el seguimiento de la orden."}
        </Text>

        <Text style={styles.orderLabel}>ID de Orden: {orderId}</Text>

        <View style={styles.actions}>
          <Button onPress={handleRetry} style={styles.primaryButton}>
            Abrir Mercado Pago manualmente
          </Button>

          <Button
            onPress={() => navigation.navigate("Tabs")}
            variant="ghost"
            style={styles.secondaryButton}
          >
            Volver al inicio
          </Button>
        </View>

        {errorMessage ? (
          <>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <View style={styles.actions}>
              <Button onPress={handleRetry} style={styles.primaryButton}>
                Reintentar apertura
              </Button>
            </View>
          </>
        ) : null}
      </View>
    </View>
  );
}

function DebugPaymentPage() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<PaymentRouteProp>();
  const { orderId } = route.params;

  const { mutate: debugPayment, isPending } = useDebugPayment();

  const handlePayment = (accepted: boolean) => {
    debugPayment(
      { operation_id: orderId, accepted },
      {
        onSuccess: () => {
          navigation.replace("OrderPolling", { orderId });
        },
        onError: (error) => {
          Alert.alert("Error simulando pago", error.message || "Error de red al contactar al webhook.");
        },
      }
    );
  };

  return (
    <View style={[styles.fill, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.md }]}>
      <View style={styles.content}>
        <Text style={styles.title}>Simulación de Pago</Text>
        <Text style={styles.description}>
          Esta pantalla simula el flujo de redirección a MercadoPago o Gateway externo.
          Al elegir una opción, se enviará el resultado al Webhook del microservicio de órdenes.
        </Text>

        <Text style={styles.orderLabel}>ID de Orden: {orderId}</Text>

        <View style={styles.actions}>
          <Button
            onPress={() => handlePayment(true)}
            loading={isPending}
            disabled={isPending}
            style={styles.approveButton}
          >
            Aprobar Pago (Simular Éxito)
          </Button>

          <Button
            onPress={() => handlePayment(false)}
            loading={isPending}
            disabled={isPending}
            style={styles.rejectButton}
          >
            Rechazar Pago (Simular Fallo)
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.lg,
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
    textAlign: "center",
  },
  description: {
    fontSize: typography.size.md,
    color: colors.gray[500],
    textAlign: "center",
    lineHeight: 22,
  },
  errorText: {
    fontSize: typography.size.sm,
    color: colors.error,
    textAlign: "center",
  },
  orderLabel: {
    fontSize: typography.size.sm,
    color: colors.gray[500],
    backgroundColor: colors.gray[200],
    padding: spacing.sm,
    borderRadius: 8,
  },
  actions: {
    width: "100%",
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  primaryButton: {
    backgroundColor: colors.brand[500],
  },
  secondaryButton: {
    borderColor: colors.gray[300],
  },
  approveButton: {
    backgroundColor: colors.success,
  },
  rejectButton: {
    backgroundColor: colors.error,
  },
});