import { FlatList } from "react-native";
import type { Product } from "@/entities/product";
import { ProductCard } from "./ProductCard";
import { spacing } from "@/shared/styles";

interface Props {
  items: Product[];
  onPreview?: ((id: string) => void) | undefined;
  onEdit?: ((id: string) => void) | undefined;
}

export function ProductGrid({ items, onPreview, onEdit }: Props) {
  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      scrollEnabled={false}
      contentContainerStyle={{ gap: spacing.sm }}
      renderItem={({ item }) => (
        <ProductCard
          product={item}
          onPreview={() => onPreview?.(item.id)}
          onEdit={() => onEdit?.(item.id)}
        />
      )}
    />
  );
}
