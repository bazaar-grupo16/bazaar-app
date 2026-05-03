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
      <View style={styles.totalRow}>
        <Text style={styles.itemCount}>
          {itemCount} {itemCount === 1 ? "producto" : "productos"}
        </Text>
        <View style={styles.totalBlock}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${totalPrice.value}</Text>
        </View>
      </View>

      <Button style={styles.checkoutButton}>
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
  checkoutButton: {
    borderRadius: radius.md,
  },
  clearButton: {
    borderRadius: radius.md,
  },
});
