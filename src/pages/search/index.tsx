import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
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

  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const knownCategoriesRef = useRef<string[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(inputText.trim()), 400);
    return () => clearTimeout(timer);
  }, [inputText]);

  const queryParams = {
    limit: 20,
    offset: 0,
    ...(searchQuery ? { searchQuery } : {}),
    ...(selectedCategory ? { category: selectedCategory } : {}),
  };

  const { data, error, isLoading, isRefetching, refetch } = useProducts(queryParams);

  useEffect(() => {
    if (!selectedCategory && data?.data) {
      const cats = [...new Set(data.data.map((p) => p.category))].sort();
      if (cats.length > 0) knownCategoriesRef.current = cats;
    }
  }, [data, selectedCategory]);

  const visibleProducts = (data?.data ?? []).filter((p) => p.stock > 0);

  const hasActiveFilter = !!searchQuery || !!selectedCategory;

  const handleClearFilters = () => {
    setInputText("");
    setSearchQuery("");
    setSelectedCategory("");
  };

  return (
    <View style={styles.container}>
      <View style={styles.filtersSection}>
        <Text style={styles.pageTitle}>Catálogo</Text>

        {/* Search bar */}
        <View style={styles.searchBarContainer}>
          <Ionicons name="search-outline" size={20} color={colors.gray[500]} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar productos..."
            placeholderTextColor={colors.gray[400]}
            value={inputText}
            onChangeText={setInputText}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {inputText.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setInputText("");
                setSearchQuery("");
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={18} color={colors.gray[400]} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category chips */}
        {knownCategoriesRef.current.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            <TouchableOpacity
              style={[styles.chip, !selectedCategory && styles.chipActive]}
              onPress={() => setSelectedCategory("")}
            >
              <Text style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>Todos</Text>
            </TouchableOpacity>
            {knownCategoriesRef.current.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, selectedCategory === cat && styles.chipActive]}
                onPress={() => setSelectedCategory(selectedCategory === cat ? "" : cat)}
              >
                <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

      </View>

      {isLoading ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={colors.brand[500]} />
          <Text style={styles.helperText}>Cargando catálogo...</Text>
        </View>
      ) : error ? (
        <View style={styles.centeredContainer}>
          <Text style={styles.sectionTitle}>No se pudo cargar el catálogo</Text>
          <Text style={styles.helperText}>
            El catálogo no pudo responder en este momento. Intentá de nuevo.
          </Text>
          <Button onPress={() => void refetch()} loading={isRefetching}>
            Reintentar
          </Button>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={visibleProducts}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>
                {visibleProducts.length}{" "}
                {visibleProducts.length === 1 ? "producto" : "productos"}
                {hasActiveFilter ? " encontrados" : " disponibles"}
              </Text>
              {hasActiveFilter && (
                <TouchableOpacity onPress={handleClearFilters}>
                  <Text style={styles.clearFiltersText}>Limpiar filtros</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              {hasActiveFilter ? (
                <>
                  <Ionicons name="search-outline" size={48} color={colors.gray[300]} />
                  <Text style={styles.emptyTitle}>Sin resultados</Text>
                  <Text style={styles.helperText}>
                    No se encontraron productos
                    {searchQuery ? ` para «${searchQuery}»` : ""}
                    {selectedCategory ? ` en la categoría "${selectedCategory}"` : ""}.
                  </Text>
                  <Button onPress={handleClearFilters}>Limpiar filtros</Button>
                </>
              ) : (
                <>
                  <Text style={styles.emptyTitle}>Todavía no hay productos</Text>
                  <Text style={styles.helperText}>
                    El catálogo no devolvió productos disponibles para mostrar.
                  </Text>
                </>
              )}
            </View>
          }
          refreshing={isRefetching}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => navigation.navigate("ProductDetail", { productId: item.id })}
            />
          )}
          onRefresh={() => void refetch()}
        />
      )}
    </View>
  );
}

type AddToCartFeedback = "idle" | "loading" | "success" | "error";

export function ProductCard({ product, onPress }: { product: Product; onPress: () => void }) {
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

    addToCart.mutate(
      { productId: product.id },
      {
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
      },
    );
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
            <Text
              style={[
                styles.statusBadgeText,
                isInactive ? styles.inactiveBadgeText : styles.outOfStockBadgeText,
              ]}
            >
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
              <Ionicons
                name="cart-outline"
                size={18}
                color={canAdd ? colors.white : colors.gray[500]}
              />
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
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  filtersSection: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  pageTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray[100],
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  searchIcon: {
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.sm,
    fontSize: typography.size.md,
    color: colors.gray[900],
  },
  chipsRow: {
    flexDirection: "row",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.gray[300],
    backgroundColor: colors.white,
  },
  chipActive: {
    backgroundColor: colors.brand[500],
    borderColor: colors.brand[500],
  },
  chipText: {
    fontSize: typography.size.sm,
    color: colors.gray[700],
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: typography.weight.semibold,
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  resultsCount: {
    fontSize: typography.size.sm,
    color: colors.gray[500],
  },
  clearFiltersText: {
    fontSize: typography.size.sm,
    color: colors.brand[600] ?? colors.brand[500],
    fontWeight: typography.weight.semibold,
  },
  centeredContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.xl,
  },
  listContent: {
    flexGrow: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
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
