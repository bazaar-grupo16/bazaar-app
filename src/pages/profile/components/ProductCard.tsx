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
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>{product.title}</Text>
        <Text style={styles.cardPrice}>${product.price.toFixed(2)}</Text>
        <Text style={styles.cardCategory} numberOfLines={1}>{product.category}</Text>
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onEdit}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name="create-outline" size={17} color={colors.gray[500]} />
        </TouchableOpacity>
        <View style={styles.actionDivider} />
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onPreview}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name="eye-outline" size={17} color={colors.gray[500]} />
        </TouchableOpacity>
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
  imageContainer: { width: "100%", aspectRatio: 1 },
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
  actionRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
  },
  actionDivider: {
    width: 1,
    backgroundColor: colors.gray[100],
  },
});
