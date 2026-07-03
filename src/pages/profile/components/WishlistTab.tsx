import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useWishlist, useRemoveFromWishlist } from "@/entities/wishlist";
import type { WishlistItem } from "@/entities/wishlist";
import type { RootStackParamList } from "@/navigation";
import { colors, spacing, typography, radius } from "@/shared/styles";

type Nav = NativeStackNavigationProp<RootStackParamList, "Tabs">;

export function WishlistTab() {
  const { data, isLoading, isError, refetch, isRefetching } = useWishlist();
  const navigation = useNavigation<Nav>();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="small" color={colors.brand[500]} />
        <Text style={styles.helperText}>Cargando favoritos...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Ionicons name="cloud-offline-outline" size={40} color={colors.gray[300]} />
        <Text style={styles.errorText}>No se pudieron cargar los favoritos</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => void refetch()}
          disabled={isRefetching}
        >
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="heart-outline" size={40} color={colors.gray[300]} />
        <Text style={styles.emptyTitle}>Sin favoritos</Text>
        <Text style={styles.helperText}>Guardá publicaciones que te interesen</Text>
        <TouchableOpacity
          style={styles.exploreButton}
          onPress={() => navigation.navigate("Tabs", { screen: "Home" } as any)}
          activeOpacity={0.8}
        >
          <Text style={styles.exploreButtonText}>Explorar productos</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      scrollEnabled={false}
      renderItem={({ item }) => (
        <WishlistItemCard
          item={item}
          onPress={() => navigation.navigate("ProductDetail", { productId: item.product_id })}
        />
      )}
    />
  );
}

function WishlistItemCard({
  item,
  onPress,
}: {
  item: WishlistItem;
  onPress: () => void;
}) {
  const removeFromWishlist = useRemoveFromWishlist();
  const [removing, setRemoving] = useState(false);

  const handleRemove = () => {
    setRemoving(true);
    removeFromWishlist.mutate(item.product_id, {
      onSettled: () => setRemoving(false),
    });
  };

  const name = item.name ?? "Producto no disponible";
  const initial = name.charAt(0).toUpperCase();

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.82}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.cardImage} resizeMode="cover" />
      ) : (
        <View style={[styles.cardImage, styles.imagePlaceholder]}>
          <Text style={styles.imagePlaceholderText}>{initial}</Text>
        </View>
      )}

      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={2}>{name}</Text>

        {item.price !== null ? (
          <Text style={styles.cardPrice}>${item.price.toFixed(2)}</Text>
        ) : (
          <Text style={styles.cardPriceMuted}>—</Text>
        )}

        <View style={styles.badgeRow}>
          {item.is_blocked ? (
            <View style={[styles.badge, styles.badgeBlocked]}>
              <Text style={[styles.badgeText, styles.badgeBlockedText]}>No disponible</Text>
            </View>
          ) : (
            <>
              {!item.catalog_available && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>No disponible</Text>
                </View>
              )}
              {item.catalog_available && !item.in_stock && (
                <View style={[styles.badge, styles.badgeStock]}>
                  <Text style={styles.badgeText}>Sin stock</Text>
                </View>
              )}
            </>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={styles.removeButton}
        onPress={handleRemove}
        disabled={removing}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {removing ? (
          <ActivityIndicator size="small" color={colors.gray[400]} />
        ) : (
          <Ionicons name="trash-outline" size={25} color={colors.gray[400]} />
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    paddingVertical: 48,
    gap: spacing.sm,
  },
  helperText: {
    fontSize: typography.size.sm,
    color: colors.gray[500],
    textAlign: "center",
  },
  errorText: {
    fontSize: typography.size.sm,
    color: colors.gray[700],
    textAlign: "center",
  },
  emptyTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.gray[700],
  },
  retryButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.brand[500],
  },
  retryButtonText: {
    fontSize: typography.size.sm,
    color: colors.brand[500],
    fontWeight: typography.weight.semibold,
  },
  exploreButton: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.brand[500],
  },
  exploreButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.white,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.gray[200],
    overflow: "hidden",
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  cardImage: {
    width: 80,
    height: 80,
    backgroundColor: colors.gray[100],
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
    gap: 4,
    paddingVertical: spacing.sm,
  },
  cardName: {
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
  cardPriceMuted: {
    fontSize: typography.size.md,
    color: colors.gray[400],
  },
  badgeRow: {
    flexDirection: "row",
    gap: 4,
    flexWrap: "wrap",
  },
  badge: {
    backgroundColor: colors.gray[100],
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeStock: {
    backgroundColor: "#FEF3C7",
  },
  badgeBlocked: {
    backgroundColor: colors.error,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: typography.weight.semibold,
    color: colors.gray[600],
  },
  badgeBlockedText: {
    color: colors.white,
  },
  removeButton: {
    width: 50,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
