import { useState } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation";
import * as Crypto from "expo-crypto";
import { Ionicons } from "@expo/vector-icons";
import { useCreateOrder, useCheckoutStore } from "@/entities/order";
import { Button } from "@/shared/ui";
import { colors, radius, spacing, typography } from "@/shared/styles";

export function CheckoutPage() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { mutate: createOrder, isPending } = useCreateOrder();
  const { lastAddress, setLastAddress, currentIdempotencyKey, clearIdempotencyKey } = useCheckoutStore();

  const [hasStockError, setHasStockError] = useState(false);
  const [street, setStreet] = useState(lastAddress?.street ?? "");
  const [city, setCity] = useState(lastAddress?.city ?? "");
  const [state, setState] = useState(lastAddress?.state ?? "");
  const [zipCode, setZipCode] = useState(lastAddress?.zip_code ?? "");
  const [country, setCountry] = useState(lastAddress?.country ?? "");

  const handleCheckout = () => {
    if (!street || !city || !state || !zipCode || !country) {
      Alert.alert("Campos obligatorios", "Por favor, completa todos los campos de la dirección de envío.");
      return;
    }

    setHasStockError(false);

    // Use existing key or generate a new one if it's the first attempt
    const idempotencyKey = currentIdempotencyKey || Crypto.randomUUID();
    if (!currentIdempotencyKey) {
      // Persist the key immediately so if the app crashes or user retries, we have it
      useCheckoutStore.setState({ currentIdempotencyKey: idempotencyKey });
    }

    const request = {
      shipping_address: {
        street,
        city,
        state,
        zip_code: zipCode,
        country,
      },
    };

    createOrder(
      { data: request, idempotencyKey },
      {
        onSuccess: (data) => {
          // Save address for future use (idempotency key is cleared later in OrderResultPage)
          setLastAddress(request.shipping_address);

          if (data.status === "CONFIRMADA" || data.status === "PAGO_RECHAZADO") {
            clearIdempotencyKey();
            navigation.replace("OrderResult", { orderId: data.order_id });
            return;
          }

          if (data.status !== "PENDIENTE_DE_PAGO") {
            clearIdempotencyKey();
            navigation.replace("OrderDetail", { orderId: data.order_id });
            return;
          }

          if (!data.init_point) {
            Alert.alert(
              "Error al iniciar el pago",
              "La orden se creó correctamente, pero no se recibió el enlace de Mercado Pago."
            );
            return;
          }

          navigation.replace("Payment", { orderId: data.order_id, initPoint: data.init_point });
        },
        onError: (error) => {
          const errorMessage = error.message || "";
          if (errorMessage.toLowerCase().includes("insufficient stock")) {
            setHasStockError(true);
          } else {
            Alert.alert("Error al procesar la orden", errorMessage || "Ocurrió un error inesperado.");
          }
        },
      }
    );
  };

  const handleGoToCart = () => {
    clearIdempotencyKey();
    navigation.navigate("Tabs", { screen: "Cart" } as any);
  };

  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Checkout</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Dirección de envío</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Calle y número</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Av. Paseo Colón 850"
            value={street}
            onChangeText={setStreet}
            editable={!isPending}
            placeholderTextColor={colors.gray[400]}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ciudad</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Cdad. Autónoma de Buenos Aires"
            value={city}
            onChangeText={setCity}
            editable={!isPending}
            placeholderTextColor={colors.gray[400]}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Provincia / Estado</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Buenos Aires"
            value={state}
            onChangeText={setState}
            editable={!isPending}
            placeholderTextColor={colors.gray[400]}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Código Postal</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: C1063"
                value={zipCode}
                onChangeText={setZipCode}
                editable={!isPending}
                placeholderTextColor={colors.gray[400]}
              />
            </View>
          </View>
          <View style={styles.halfWidth}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>País</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Argentina"
                value={country}
                onChangeText={setCountry}
                editable={!isPending}
                placeholderTextColor={colors.gray[400]}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        {hasStockError ? (
          <View style={styles.errorContainer}>
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={20} color={colors.error} style={styles.errorIcon} />
              <Text style={styles.errorText}>
                Ya no queda stock de alguno de los items del carrito. Por favor, vuelve al carrito para verificar.
              </Text>
            </View>
            <Button onPress={handleGoToCart} variant="primary">
              Volver al Carrito
            </Button>
          </View>
        ) : (
          <Button
            onPress={handleCheckout}
            loading={isPending}
            disabled={isPending}
          >
            Confirmar y Pagar
          </Button>
        )}
      </View>
    </KeyboardAvoidingView>
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
  title: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.gray[800],
    marginBottom: spacing.xs,
  },
  inputGroup: {
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    fontSize: typography.size.md,
    color: colors.gray[900],
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  errorContainer: {
    gap: spacing.md,
  },
  errorBanner: {
    flexDirection: "row",
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
    gap: spacing.sm,
  },
  errorIcon: {
    alignSelf: "flex-start",
    marginTop: 2,
  },
  errorText: {
    flex: 1,
    fontSize: typography.size.sm,
    color: "#B91C1C",
    lineHeight: 18,
  },
  footer: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
});
