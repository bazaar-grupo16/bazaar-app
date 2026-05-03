import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Product } from "@/entities/product";
import { colors, typography, spacing, radius } from "@/shared/styles";

const SCREEN_W = Dimensions.get("window").width;
// Profile content has paddingHorizontal: spacing.md on each side, column gap: spacing.sm
export const CARD_W = (SCREEN_W - spacing.md * 2 - spacing.sm) / 2;

interface Props {
  product: Product;
  onPress?: () => void;
  onEdit?: () => void;
  onPreview?: () => void;
}

export function ProductCard({ product, onPress, onEdit, onPreview }: Props) {
  const firstImage = product.images?.[0];
  return (
    <TouchableOpacity style={styles.card} onPress={onPress ?? onPreview} activeOpacity={0.82}>
      <View style={styles.imageContainer}>
        {firstImage
          ? <Image source={{ uri: firstImage }} style={styles.cardImage} resizeMode="cover" />
          : <View style={[styles.cardImage, styles.imagePlaceholder]}>
              <Ionicons name="image-outline" size={32} color={colors.gray[300]} />
            </View>
        }

        {/* Status badge — top-left */}
        {product.status !== "active" && (
          <View style={[styles.statusBadge, product.status === "out_of_stock" ? styles.badgeOos : styles.badgeInactive]}>
            <Text style={styles.badgeText}>
              {product.status === "out_of_stock" ? "Sin stock" : "Inactiva"}
            </Text>
          </View>
        )}

        {/* Edit button — top-right */}
        {onEdit && (
          <TouchableOpacity
            style={styles.editBtn}
            onPress={onEdit}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons name="create-outline" size={15} color={colors.white} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>{product.title}</Text>
        <Text style={styles.cardPrice}>${product.price.toFixed(2)}</Text>
        <Text style={styles.cardCategory} numberOfLines={1}>{product.category}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_W,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    position: "relative",
  },
  cardImage: { width: "100%", height: "100%", backgroundColor: colors.gray[100] },
  imagePlaceholder: { alignItems: "center", justifyContent: "center" },
  cardBody: { padding: spacing.sm, gap: 2 },
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
  cardCategory: { fontSize: 12, color: colors.gray[400] },

  // Status badge (top-left)
  statusBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeInactive: { backgroundColor: "rgba(55,65,81,0.75)" },
  badgeOos:      { backgroundColor: "rgba(234,88,12,0.85)" },
  badgeText: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: "#ffffff",
    letterSpacing: 0.2,
  },

  // Edit button (top-right)
  editBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.42)",
    alignItems: "center",
    justifyContent: "center",
  },
});
