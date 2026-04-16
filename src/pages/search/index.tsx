import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useProducts, type Product } from "@/entities/product";
import { useAddToCart } from "@/entities/cart";
import { ApiError } from "@/shared/api";
import type { RootStackParamList } from "@/navigation";
import { colors, radius, spacing, typography } from "@/shared/styles";
import { Button } from "@/shared/ui";

type SearchNavigationProps = NativeStackNavigationProp<RootStackParamList, "Tabs">;

export function SearchPage() {
  const navigation = useNavigation<SearchNavigationProps>();
  const { data, error, isLoading, isRefetching, refetch } = useProducts({ limit: 20, offset: 0 });
  const visibleProducts = (data?.data ?? []).filter(
    (product) => product.status === "inactive" || product.stock > 0,
  );

  if (isLoading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={colors.brand[500]} />
        <Text style={styles.helperText}>Cargando catálogo...</Text>
      </View>
    );
  }

  if (error) {
    console.log(error);
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.title}>No se pudo cargar el catálogo</Text>
        <Text style={styles.helperText}>El catálogo no pudo responder en este momento. Intentá de nuevo.</Text>
        <Button onPress={() => void refetch()} loading={isRefetching}>
          Reintentar
        </Button>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.listContent}
      data={visibleProducts}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>Catálogo</Text>
          <Text style={styles.helperText}>{visibleProducts.length} productos disponibles</Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Todavía no hay productos</Text>
          <Text style={styles.helperText}>
            El catálogo no devolvió productos disponibles para mostrar.
          </Text>
        </View>
      }
      refreshing={isRefetching}
      renderItem={({ item }) => (
        <ProductCard product={item} onPress={() => navigation.navigate("ProductDetail", { productId: item.id })} />
      )}
      onRefresh={() => void refetch()}
    />
  );
}

type AddToCartFeedback = "idle" | "loading" | "success" | "error";

function ProductCard({ product, onPress }: { product: Product; onPress: () => void }) {
  const firstImage = product.images?.[0];
  const isInactive = product.status === "inactive";
  const isOutOfStock = !isInactive && product.stock === 0;
  const canAdd = !isInactive && !isOutOfStock;

  const addToCart = useAddToCart(1001);
  const [feedback, setFeedback] = useState<AddToCartFeedback>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const successTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleAddToCart = useCallback(() => {
    if (!canAdd) return;

    setFeedback("loading");
    setErrorMsg("");

    addToCart.mutate({ productId: product.id }, {
      onSuccess: () => {
        setFeedback("success");
        if (successTimerRef.current) clearTimeout(successTimerRef.current);
        successTimerRef.current = setTimeout(() => setFeedback("idle"), 1500);
      },
      onError: (err) => {
        setFeedback("error");
        if (err instanceof ApiError) {
          const detail = (err.details as { detail?: string })?.detail;
          if (err.status === 422) {
            setErrorMsg(detail ?? "Stock insuficiente");
          } else if (err.status === 404) {
            setErrorMsg("Producto no encontrado");
          } else if (err.status === 503) {
            setErrorMsg("Servicio no disponible");
          } else {
            setErrorMsg(detail ?? "Error al agregar al carrito");
          }
        } else {
          setErrorMsg("Error de conexión");
        }
      },
    });
  }, [canAdd, addToCart, product.id]);

  return (
    <TouchableOpacity
      style={[styles.card, isInactive && styles.inactiveCard]}
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityLabel={`Ver detalle de ${product.title}`}
      onPress={onPress}
    >
      <View>
        {firstImage ? (
          <Image source={{ uri: firstImage }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>Sin imagen</Text>
          </View>
        )}
        {(isInactive || isOutOfStock) && (
          <View style={[styles.statusBadge, isInactive ? styles.inactiveBadge : styles.outOfStockBadge]}>
            <Text style={[styles.statusBadgeText, isInactive ? styles.inactiveBadgeText : styles.outOfStockBadgeText]}>
              {isInactive ? "No disponible" : "Sin stock"}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={styles.productTitle}>{product.title}</Text>
          {!isInactive ? <Text style={styles.price}>${product.price.toFixed(2)}</Text> : null}
        </View>
        <Text style={styles.description} numberOfLines={2}>
          {product.description}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{product.category}</Text>
          {isInactive ? (
            <Text style={[styles.meta, styles.inactiveText]}>No disponible</Text>
          ) : (
            <Text style={[styles.meta, isOutOfStock && styles.outOfStock]}>
              {product.stock > 0 ? `${product.stock} disponibles` : "Sin stock"}
            </Text>
          )}
        </View>

        {/* Add to cart button */}
        <TouchableOpacity
          style={[
            styles.addToCartButton,
            !canAdd && styles.addToCartButtonDisabled,
            feedback === "success" && styles.addToCartButtonSuccess,
            feedback === "error" && styles.addToCartButtonError,
          ]}
          onPress={handleAddToCart}
          disabled={!canAdd || feedback === "loading"}
          activeOpacity={0.7}
          accessibilityLabel={`Agregar ${product.title} al carrito`}
        >
          {feedback === "loading" ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : feedback === "success" ? (
            <>
              <Ionicons name="checkmark-circle" size={18} color={colors.white} />
              <Text style={styles.addToCartText}>¡Agregado!</Text>
            </>
          ) : (
            <>
              <Ionicons name="cart-outline" size={18} color={canAdd ? colors.white : colors.gray[500]} />
              <Text style={[styles.addToCartText, !canAdd && styles.addToCartTextDisabled]}>
                Agregar al carrito
              </Text>
            </>
          )}
        </TouchableOpacity>

        {feedback === "error" && errorMsg ? (
          <Text style={styles.addToCartError}>{errorMsg}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.white,
  },
  listContent: {
    flexGrow: 1,
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  header: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
    textAlign: "center",
  },
  helperText: {
    fontSize: typography.size.md,
    color: colors.gray[700],
    textAlign: "center",
  },
  emptyState: {
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.gray[900],
  },
  card: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },
  inactiveCard: {
    opacity: 0.78,
  },
  image: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: colors.gray[100],
  },
  imagePlaceholder: {
    width: "100%",
    aspectRatio: 16 / 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.gray[100],
  },
  imagePlaceholderText: {
    fontSize: typography.size.md,
    color: colors.gray[500],
  },
  statusBadge: {
    position: "absolute",
    right: spacing.sm,
    top: spacing.sm,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  outOfStockBadge: {
    backgroundColor: "#FEF3C7",
  },
  inactiveBadge: {
    backgroundColor: colors.gray[900],
  },
  statusBadgeText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },
  outOfStockBadgeText: {
    color: "#92400E",
  },
  inactiveBadgeText: {
    color: colors.white,
  },
  cardBody: {
    gap: spacing.sm,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  productTitle: {
    flex: 1,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
  },
  price: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.brand[700],
  },
  description: {
    fontSize: typography.size.md,
    color: colors.gray[700],
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  meta: {
    fontSize: typography.size.sm,
    color: colors.gray[500],
  },
  outOfStock: {
    color: colors.error,
  },
  inactiveText: {
    color: colors.gray[700],
    fontWeight: typography.weight.semibold,
  },
  addToCartButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: colors.brand[500],
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  addToCartButtonDisabled: {
    backgroundColor: colors.gray[100],
  },
  addToCartButtonSuccess: {
    backgroundColor: "#16a34a",
  },
  addToCartButtonError: {
    backgroundColor: colors.error,
  },
  addToCartText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.white,
  },
  addToCartTextDisabled: {
    color: colors.gray[500],
  },
  addToCartError: {
    fontSize: 12,
    color: colors.error,
    marginTop: spacing.xs,
    textAlign: "center",
  },
});
