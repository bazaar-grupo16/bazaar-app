import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Product } from "@/entities/product";
import { colors, typography, spacing, radius } from "@/shared/styles";

interface Props {
  product: Product;
  onPreview?: () => void;
  onEdit?: () => void;
}

export function ProductCard({ product, onPreview, onEdit }: Props) {
  const firstImage = product.images?.[0];
  const initial = product.title.charAt(0).toUpperCase();
  const isInactive = product.status === "inactive";
  const isOos = product.status === "out_of_stock";

  return (
    <TouchableOpacity style={styles.card} onPress={onPreview} activeOpacity={0.82}>
      {firstImage ? (
        <Image source={{ uri: firstImage }} style={styles.cardImage} resizeMode="cover" />
      ) : (
        <View style={[styles.cardImage, styles.imagePlaceholder]}>
          <Text style={styles.imagePlaceholderText}>{initial}</Text>
        </View>
      )}

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>{product.title}</Text>
        <Text style={styles.cardPrice}>${product.price.toFixed(2)}</Text>
        <Text style={styles.cardCategory} numberOfLines={1}>{product.category}</Text>
      </View>

      {onEdit && (
        <TouchableOpacity
          style={styles.editButton}
          onPress={onEdit}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="create-outline" size={25} color={colors.gray[400]} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.gray[200],
    overflow: "hidden",
    paddingRight: spacing.sm,
  },
  cardImage: {
    width: 80,
    height: 80,
    backgroundColor: colors.gray[100],
    flexShrink: 0,
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholderText: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.gray[400],
  },
  cardBody: {
    flex: 1,
    gap: 3,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  cardTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.gray[900],
    lineHeight: 18,
  },
  cardPrice: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.brand[500],
  },
  cardCategory: {
    fontSize: 12,
    color: colors.gray[400],
  },
  badgeRow: {
    flexDirection: "row",
    gap: 4,
    marginTop: 2,
  },
  badge: {
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeInactive: {
    backgroundColor: colors.gray[100],
  },
  badgeOos: {
    backgroundColor: "#FEF3C7",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: typography.weight.semibold,
  },
  badgeTextDark: {
    color: colors.gray[700],
  },
  badgeTextOos: {
    color: "#92400E",
  },
  editButton: {
    width: 50,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
