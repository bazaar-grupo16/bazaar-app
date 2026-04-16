import { View, Text, StyleSheet } from "react-native";
import type { Price } from "@/entities/cart";
import { Button } from "@/shared/ui";
import { colors, radius, spacing, typography } from "@/shared/styles";

interface CartSummaryProps {
  totalPrice: Price;
  itemCount: number;
  onClear: () => void;
  isClearing: boolean;
}

export function CartSummary({
  totalPrice,
  itemCount,
  onClear,
  isClearing,
}: CartSummaryProps) {
  return (
    <View style={styles.container}>
      <View style={styles.divider} />

      <View style={styles.row}>
        <Text style={styles.label}>
          {itemCount} {itemCount === 1 ? "producto" : "productos"}
        </Text>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${totalPrice.value}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          variant="secondary"
          onPress={onClear}
          loading={isClearing}
          style={styles.clearButton}
        >
          Vaciar carrito
        </Button>
        <Button style={styles.checkoutButton}>
          Ir a pagar
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[300],
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: typography.size.md,
    color: colors.gray[500],
  },
  totalRow: {
    alignItems: "flex-end",
    gap: 2,
  },
  totalLabel: {
    fontSize: typography.size.sm,
    color: colors.gray[500],
  },
  totalValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  clearButton: {
    flex: 1,
  },
  checkoutButton: {
    flex: 2,
  },
});
