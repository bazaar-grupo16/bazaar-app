import { View, Text, StyleSheet, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation";
import { useDebugPayment } from "@/entities/payment";
import { Button } from "@/shared/ui";
import { colors, spacing, typography } from "@/shared/styles";

type PaymentDebugRouteProp = RouteProp<RootStackParamList, "PaymentDebug">;

export function PaymentDebugPage() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<PaymentDebugRouteProp>();
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
    color: colors.gray[600],
    textAlign: "center",
    lineHeight: 22,
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
  approveButton: {
    backgroundColor: colors.success,
  },
  rejectButton: {
    backgroundColor: colors.error,
  },
});
