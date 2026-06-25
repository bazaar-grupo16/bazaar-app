import { View, Text, StyleSheet } from "react-native";
import type { Price } from "@/entities/cart";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import type { RootStackParamList } from "@/navigation";
import { Button } from "@/shared/ui";
import { colors, radius, spacing, typography } from "@/shared/styles";

interface CartSummaryProps {
  totalPrice: Price;
  itemCount: number;
  onClear: () => void;
  isClearing: boolean;
  hasBlockedOrInactiveItems: boolean;
}

export function CartSummary({
  totalPrice,
  itemCount,
  onClear,
  isClearing,
  hasBlockedOrInactiveItems,
}: CartSummaryProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.container}>
      <View style={styles.totalRow}>
        <Text style={styles.itemCount}>
          {itemCount} {itemCount === 1 ? "producto" : "productos"}
        </Text>
        <View style={styles.totalBlock}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${totalPrice.value}</Text>
        </View>
      </View>

      {hasBlockedOrInactiveItems && (
        <View style={styles.warningContainer}>
          <Ionicons name="alert-circle" size={20} color={colors.error} />
          <Text style={styles.warningText}>
            No se puede continuar porque hay ítems bloqueados/deshabilitados.
          </Text>
        </View>
      )}

      <Button 
        style={styles.checkoutButton}
        onPress={() => navigation.navigate("Checkout")}
        disabled={hasBlockedOrInactiveItems}
      >
        Ir a pagar
      </Button>

      <Button
        variant="ghost"
        onPress={onClear}
        loading={isClearing}
        style={styles.clearButton}
      >
        Vaciar carrito
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  itemCount: {
    fontSize: typography.size.md,
    color: colors.gray[500],
  },
  totalBlock: {
    alignItems: "flex-end",
    gap: 2,
  },
  totalLabel: {
    fontSize: typography.size.sm,
    color: colors.gray[400],
  },
  totalValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    borderColor: "#FCA5A5",
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  warningText: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.error,
    fontWeight: typography.weight.semibold,
  },
  checkoutButton: {
    borderRadius: radius.md,
  },
  clearButton: {
    borderRadius: radius.md,
  },
});
