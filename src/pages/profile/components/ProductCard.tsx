import { View, Text, Image, TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { Product, ProductCondition } from "../types";

interface Props {
  product: Product;
  onPress?: () => void;
}

export function ProductCard({ product, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <Image source={{ uri: product.image }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>
        <Text style={styles.price}>{formatPrice(product.price)}</Text>
        {product.condition && (
          <View style={[styles.badge, conditionStyles[product.condition]]}>
            <Text style={styles.badgeText}>{product.condition}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: "100%",
    aspectRatio: 1,
  },
  info: {
    padding: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    lineHeight: 18,
  },
  price: {
    fontSize: 14,
    fontWeight: "700",
    color: "#f97316",
    marginTop: 4,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
    marginTop: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
});

const conditionStyles: Record<ProductCondition, ViewStyle> = {
  Nuevo: {
    backgroundColor: "#ecfdf5",
  },
  Usado: {
    backgroundColor: "#eff6ff",
  },
  Reacondicionado: {
    backgroundColor: "#fff7ed",
  },
};

function formatPrice(price: number) {
  return `AR$ ${price.toLocaleString("es-AR")}`;
}
