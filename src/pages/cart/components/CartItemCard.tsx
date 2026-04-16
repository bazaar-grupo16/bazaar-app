import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { CartItem } from "@/entities/cart";
import { colors, radius, spacing, typography } from "@/shared/styles";

interface CartItemCardProps {
  item: CartItem;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
  isUpdating: boolean;
}

export function CartItemCard({
  item,
  onIncrement,
  onDecrement,
  onRemove,
  isUpdating,
}: CartItemCardProps) {
  const unitPrice = parseFloat(item.unitPrice.value);
  const lineTotal = (unitPrice * item.quantity).toFixed(2);
  const isInactive = item.status === "inactive";
  const isOutOfStock = !isInactive && item.stock === 0;
  const hasIssue = isInactive || isOutOfStock;

  return (
    <View style={[styles.card, hasIssue && styles.issueCard]}>
      {isUpdating && (
        <View style={styles.overlay}>
          <ActivityIndicator size="small" color={colors.brand[500]} />
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>

          {hasIssue && (
            <View
              style={[
                styles.statusBadge,
                isInactive ? styles.inactiveBadge : styles.outOfStockBadge,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  isInactive
                    ? styles.inactiveBadgeText
                    : styles.outOfStockBadgeText,
                ]}
              >
                {isInactive ? "No disponible" : "Sin stock"}
              </Text>
            </View>
          )}

          <Text style={styles.unitPrice}>
            ${unitPrice.toFixed(2)} c/u
          </Text>
        </View>

        <TouchableOpacity
          style={styles.removeButton}
          onPress={onRemove}
          disabled={isUpdating}
          accessibilityLabel={`Eliminar ${item.title} del carrito`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <View style={styles.quantityRow}>
          <TouchableOpacity
            style={[styles.quantityButton, item.quantity <= 1 && styles.quantityButtonDisabled]}
            onPress={onDecrement}
            disabled={isUpdating || item.quantity <= 1}
            accessibilityLabel="Disminuir cantidad"
          >
            <Ionicons
              name="remove"
              size={18}
              color={item.quantity <= 1 ? colors.gray[300] : colors.gray[700]}
            />
          </TouchableOpacity>

          <Text style={styles.quantityText}>{item.quantity}</Text>

          <TouchableOpacity
            style={[
              styles.quantityButton,
              item.quantity >= item.stock && styles.quantityButtonDisabled,
            ]}
            onPress={onIncrement}
            disabled={isUpdating || item.quantity >= item.stock}
            accessibilityLabel="Aumentar cantidad"
          >
            <Ionicons
              name="add"
              size={18}
              color={
                item.quantity >= item.stock ? colors.gray[300] : colors.gray[700]
              }
            />
          </TouchableOpacity>

          {!isInactive && (
            <Text style={styles.stockText}>
              {item.stock} disp.
            </Text>
          )}
        </View>

        <Text style={styles.lineTotal}>${lineTotal}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  issueCard: {
    borderColor: "#FBBF24",
    backgroundColor: "#FFFBEB",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.6)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    zIndex: 10,
  },
  body: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.gray[900],
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  outOfStockBadge: {
    backgroundColor: "#FEF3C7",
  },
  inactiveBadge: {
    backgroundColor: colors.gray[900],
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: typography.weight.bold,
  },
  outOfStockBadgeText: {
    color: "#92400E",
  },
  inactiveBadgeText: {
    color: colors.white,
  },
  unitPrice: {
    fontSize: typography.size.sm,
    color: colors.gray[500],
  },
  removeButton: {
    padding: spacing.xs,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.gray[300],
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.gray[50],
  },
  quantityButtonDisabled: {
    opacity: 0.4,
  },
  quantityText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.gray[900],
    minWidth: 24,
    textAlign: "center",
  },
  stockText: {
    fontSize: 12,
    color: colors.gray[500],
    marginLeft: spacing.xs,
  },
  lineTotal: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.brand[700],
  },
});
