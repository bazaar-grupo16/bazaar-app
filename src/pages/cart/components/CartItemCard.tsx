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
  const isBlocked = item.isBlocked;
  const isInactive = item.status === "inactive";
  const isOutOfStock = item.status === "out_of_stock";
  const hasIssue = isBlocked || isInactive || isOutOfStock;
  const initial = item.title.charAt(0).toUpperCase();

  return (
    <View style={[styles.card, hasIssue && styles.issueCard]}>
      {isUpdating && (
        <View style={styles.overlay}>
          <ActivityIndicator size="small" color={colors.brand[500]} />
        </View>
      )}

      {/* Top row: avatar | info | trash */}
      <View style={styles.topRow}>
        <View style={[styles.avatar, hasIssue && styles.avatarIssue]}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>

          {hasIssue && (
            <View style={[
              styles.statusBadge,
              isBlocked ? styles.blockedBadge :
              isInactive ? styles.inactiveBadge : 
              styles.outOfStockBadge
            ]}>
              <Text style={[
                styles.statusBadgeText,
                isBlocked ? styles.blockedBadgeText :
                isInactive ? styles.inactiveBadgeText : 
                styles.outOfStockBadgeText
              ]}>
                {isBlocked ? "No disponible" : isInactive ? "No disponible" : "Sin stock"}
              </Text>
            </View>
          )}

          <Text style={styles.unitPrice}>${unitPrice.toFixed(2)} c/u</Text>
        </View>

        <TouchableOpacity
          style={styles.removeButton}
          onPress={onRemove}
          disabled={isUpdating}
          accessibilityLabel={`Eliminar ${item.title} del carrito`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={18} color={colors.error} />
        </TouchableOpacity>
      </View>

      {/* Footer: quantity controls | line total */}
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
              size={16}
              color={item.quantity <= 1 ? colors.gray[300] : colors.gray[700]}
            />
          </TouchableOpacity>

          <Text style={styles.quantityText}>{item.quantity}</Text>

          <TouchableOpacity
            style={[styles.quantityButton, item.quantity >= item.stock && styles.quantityButtonDisabled]}
            onPress={onIncrement}
            disabled={isUpdating || item.quantity >= item.stock}
            accessibilityLabel="Aumentar cantidad"
          >
            <Ionicons
              name="add"
              size={16}
              color={item.quantity >= item.stock ? colors.gray[300] : colors.gray[700]}
            />
          </TouchableOpacity>

          {!isInactive && !isBlocked && (
            <Text style={styles.stockText}>{item.stock} disp.</Text>
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
    borderColor: colors.gray[200],
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
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.brand[100],
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarIssue: {
    backgroundColor: "#FEF3C7",
  },
  avatarText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.brand[600],
  },
  info: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.gray[900],
    lineHeight: 22,
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
  blockedBadge: {
    backgroundColor: colors.error,
  },
  blockedBadgeText: {
    color: colors.white,
  },
  unitPrice: {
    fontSize: typography.size.sm,
    color: colors.gray[400],
  },
  removeButton: {
    padding: spacing.xs,
    marginTop: 2,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
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
    borderColor: colors.gray[200],
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
    color: colors.gray[400],
    marginLeft: spacing.xs,
  },
  lineTotal: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.brand[600],
  },
});
