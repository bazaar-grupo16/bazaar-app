import { useState } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation";
import * as Crypto from "expo-crypto";
import { useCreateOrder, useCheckoutStore } from "@/entities/order";
import { Button } from "@/shared/ui";
import { colors, radius, spacing, typography } from "@/shared/styles";

export function CheckoutPage() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { mutate: createOrder, isPending } = useCreateOrder();
  const { lastAddress, setLastAddress } = useCheckoutStore();

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

    const idempotencyKey = Crypto.randomUUID();

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
          // Save address for future use
          setLastAddress(request.shipping_address);
          navigation.replace("PaymentDebug", { orderId: data.order_id });
        },
        onError: (error) => {
          Alert.alert("Error al procesar la orden", error.message || "Ocurrió un error inesperado.");
        },
      }
    );
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
        <Button
          onPress={handleCheckout}
          loading={isPending}
          disabled={isPending}
        >
          Confirmar y Pagar
        </Button>
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
