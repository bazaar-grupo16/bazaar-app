import { FlatList, StyleSheet, View } from "react-native";
import type { Product } from "@/entities/product";
import { ProductCard, CARD_W } from "./ProductCard";
import { spacing } from "@/shared/styles";

interface Props {
  items: Product[];
  onPreview?: ((id: string) => void) | undefined;
  onEdit?: ((id: string) => void) | undefined;
}

export function ProductGrid({ items, onPreview, onEdit }: Props) {
  // Pad to even count so all cards have the same width
  const paddedItems: (Product | null)[] = items.length % 2 !== 0 ? [...items, null] : items;

  return (
    <FlatList
      data={paddedItems}
      keyExtractor={(item, index) => item?.id ?? `spacer-${index}`}
      numColumns={2}
      scrollEnabled={false}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.list}
      renderItem={({ item }) =>
        item === null ? (
          <View style={{ width: CARD_W }} />
        ) : (
          <ProductCard
            product={item}
            onPreview={() => onPreview?.(item.id)}
            onEdit={() => onEdit?.(item.id)}
          />
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  row: { gap: spacing.sm },
});
