import { FlatList, StyleSheet } from "react-native";
import { Product } from "../types";
import { ProductCard } from "./ProductCard";

interface Props {
  items: Product[];
  onProductPress?: ((id: string | number) => void) | undefined;
}

export function ProductGrid({ items, onProductPress }: Props) {
  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id.toString()}
      numColumns={2}
      scrollEnabled={false}
      columnWrapperStyle={styles.row}
      renderItem={({ item }) => (
        <ProductCard
          product={item}
          onPress={() => onProductPress?.(item.id)}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 12,
    marginBottom: 12,
  },
});
