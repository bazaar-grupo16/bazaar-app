import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useRef, useState } from "react";
import { NotificationsPanel } from "./NotificationsPanel";
import {
  ActivityIndicator,
  Dimensions,
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
import type { RootStackParamList } from "@/navigation";
import { colors, radius, spacing, typography } from "@/shared/styles";
import { PRODUCT_CATEGORIES } from "@/shared/config/categories";

type HomeNavProp = NativeStackNavigationProp<RootStackParamList, "Tabs">;

// ── Constants ─────────────────────────────────────────────────────────────────

const SCREEN_W = Dimensions.get("window").width;

/** Cambiar este valor para probar distintos tamaños de página */
const PAGE_SIZE = 20;

const GRID_CARD_W = (SCREEN_W - spacing.md * 2 - spacing.sm) / 2;
const CAROUSEL_W  = SCREEN_W - spacing.md * 2;

// TODO: reemplazar con datos del servicio de perfil
const USER_NAME    = "Agustín";
const USER_INITIAL = "A";

// ── Sort ──────────────────────────────────────────────────────────────────────

type SortField = "title" | "price" | "created_at";

type SortOption =
  | "price_desc"
  | "price_asc"
  | "newest"
  | "oldest"
  | "name_asc"
  | "name_desc";

const SORT_OPTIONS: Array<{ key: SortOption; label: string; sortBy: SortField; order: "asc" | "desc" }> = [
  { key: "price_desc", label: "Mayor precio", sortBy: "price", order: "desc" },
  { key: "price_asc", label: "Menor precio", sortBy: "price", order: "asc" },
  { key: "newest", label: "Más recientes", sortBy: "created_at", order: "desc" },
  { key: "oldest", label: "Más antiguos", sortBy: "created_at", order: "asc" },
  { key: "name_asc", label: "Nombre A-Z", sortBy: "title", order: "asc" },
  { key: "name_desc", label: "Nombre Z-A", sortBy: "title", order: "desc" },
];

// ── HomePage ──────────────────────────────────────────────────────────────────

export function HomePage() {
  const navigation = useNavigation<HomeNavProp>();
  const insets = useSafeAreaInsets();

  // Filters
  const [inputText, setInputText]               = useState("");
  const [searchQuery, setSearchQuery]           = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Sort
  const [sortOption, setSortOption] = useState<SortOption | null>(null);
  const [showSortOptions, setShowSortOptions] = useState(false);

  // Price filter
  const [minPriceText, setMinPriceText] = useState("");
  const [maxPriceText, setMaxPriceText] = useState("");
  const minPrice = minPriceText !== "" ? parseFloat(minPriceText) : undefined;
  const maxPrice = maxPriceText !== "" ? parseFloat(maxPriceText) : undefined;
  const hasPriceFilter = (minPrice !== undefined && !isNaN(minPrice)) || (maxPrice !== undefined && !isNaN(maxPrice));

  // Pagination
  const [queryOffset, setQueryOffset] = useState(0);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [total, setTotal]             = useState(0);

  // Notifications panel
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Favorites (session-local)
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(inputText.trim()), 400);
    return () => clearTimeout(t);
  }, [inputText]);

  // Reset pagination when filters/sort change
  const prevRef = useRef({
    searchQuery: "",
    selectedCategory: "",
    sortOption: null as SortOption | null,
  });
  useEffect(() => {
    const p = prevRef.current;
  
    if (
      p.searchQuery !== searchQuery ||
      p.selectedCategory !== selectedCategory ||
      p.sortOption !== sortOption
    ) {
      prevRef.current = { searchQuery, selectedCategory, sortOption };
      setQueryOffset(0);
      setAllProducts([]);
      setTotal(0);
    }
  }, [searchQuery, selectedCategory, sortOption]);

  // Effective sort params: when no field selected, default to newest first
  const activeSort = SORT_OPTIONS.find((option) => option.key === sortOption);

  const effectiveSortBy: SortField = activeSort?.sortBy ?? "created_at";
  const effectiveSortOrder: "asc" | "desc" = activeSort?.order ?? "desc";

  // Queries
  const { data, isLoading, isFetching } = useProducts({
    limit: PAGE_SIZE,
    offset: queryOffset,
    ...(searchQuery ? { searchQuery } : {}),
    ...(selectedCategory ? { category: selectedCategory } : {}),
    sortBy: effectiveSortBy,
    order: effectiveSortOrder,
    ...(minPrice !== undefined && !isNaN(minPrice) ? { minPrice } : {}),
    ...(maxPrice !== undefined && !isNaN(maxPrice) ? { maxPrice } : {}),
  });

  // Carousel — always top 5 most recent, ignores active filters
  const { data: carouselData } = useProducts({ limit: 5, sortBy: "created_at", order: "desc" });
  const carouselProducts = (carouselData?.data ?? []).filter((p) => p.stock > 0 && p.images?.[0]);

  // Accumulate pages (use response offset to decide replace vs. append)
  useEffect(() => {
    if (!data?.data) return;
    const items = data.data.filter((p) => p.stock > 0);
    setTotal(data.total ?? 0);
    if (data.offset === 0) {
      setAllProducts(items);
    } else {
      setAllProducts((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        return [...prev, ...items.filter((p) => !ids.has(p.id))];
      });
    }
  }, [data]);

  const hasMore     = allProducts.length < total;
  const isFirstLoad = isLoading && queryOffset === 0;
  const hasSearchIntent = !!searchQuery || !!selectedCategory || !!sortOption || hasPriceFilter;
  const hasInputSearch = !!searchQuery;

  const toggleFavorite = (id: string) =>
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const loadMore = () => { if (hasMore && !isFetching) setQueryOffset((p) => p + PAGE_SIZE); };

  // X en el buscador: solo limpia el texto de búsqueda
  const clearSearch = () => {
    setInputText("");
    setSearchQuery("");
  };

  // "Limpiar filtros": resetea todo
  const clearAll = () => {
    setInputText("");
    setSearchQuery("");
    setSelectedCategory("");
    setSortOption(null);
    setShowSortOptions(false);
    setMinPriceText("");
    setMaxPriceText("");
  };

  // ── Results bar (inside ListHeaderComponent) ──────────────────────────────

  const countLabel = searchQuery
    ? `${total} resultado${total !== 1 ? "s" : ""}`
    : selectedCategory
      ? `${selectedCategory} · ${total} productos`
      : `${total} publicaciones`;

    const listHeader = (
      <>
        {!hasSearchIntent && carouselProducts.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Novedades</Text>
            <ProductCarousel
              products={carouselProducts}
              onPress={(id) => navigation.navigate("ProductDetail", { productId: id })}
            />
          </>
        )}
    
        <View style={styles.resultsBar}>
          <View style={styles.resultsRow}>
            <Text style={styles.resultsCount}>
              {hasInputSearch
                ? `${total} Resultado${total !== 1 ? "s" : ""}`
                : hasSearchIntent
                  ? `${total} Resultado${total !== 1 ? "s" : ""}`
                  : "Más productos"}
            </Text>
    
            {hasSearchIntent && (
              <TouchableOpacity onPress={clearAll} style={styles.clearButton}>
                <Ionicons name="close-circle-outline" size={14} color={colors.gray[500]} />
                <Text style={styles.clearButtonText}>Limpiar filtros</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </>
    );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        {/* Greeting */}
        <View style={styles.greetingRow}>
          <View style={styles.greetingLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>{USER_INITIAL}</Text>
            </View>
            <View>
              <Text style={styles.greetingHola}>¡Hola de vuelta!</Text>
              <Text style={styles.greetingName}>{USER_NAME} 👋</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.bellButton} activeOpacity={0.7} onPress={() => setNotificationsOpen(true)}>
            <Ionicons name="notifications-outline" size={22} color={colors.gray[700]} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color={colors.gray[400]} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar en Bazaar..."
              placeholderTextColor={colors.gray[400]}
              value={inputText}
              onChangeText={setInputText}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />

            {inputText.length > 0 && (
              <TouchableOpacity
                onPress={clearSearch}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color={colors.gray[400]} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[styles.sortButton, (!!sortOption || hasPriceFilter) && styles.sortButtonActive]}
            onPress={() => setShowSortOptions((prev) => !prev)}
            activeOpacity={0.75}
          >
            <Ionicons
              name="swap-vertical-outline"
              size={20}
              color={(sortOption || hasPriceFilter) ? colors.brand[500] : colors.gray[500]}
            />
          </TouchableOpacity>
        </View>

        {showSortOptions && (
          <View style={styles.sortDropdown}>
            <TouchableOpacity
              style={[styles.sortOption, !sortOption && styles.sortOptionActive]}
              onPress={() => setSortOption(null)}
            >
              <Text style={[styles.sortOptionText, !sortOption && styles.sortOptionTextActive]}>
                Sin orden
              </Text>
            </TouchableOpacity>
            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[styles.sortOption, sortOption === option.key && styles.sortOptionActive]}
                onPress={() => setSortOption(option.key)}
              >
                <Text style={[styles.sortOptionText, sortOption === option.key && styles.sortOptionTextActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
            <View style={styles.sortDivider} />
            <View style={styles.priceFilterSection}>
              <Text style={styles.priceFilterLabel}>Precio</Text>
              <View style={styles.priceRow}>
                <View style={styles.priceInputWrapper}>
                  <Text style={styles.priceInputLabel}>Mín.</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="$0"
                    placeholderTextColor={colors.gray[400]}
                    keyboardType="numeric"
                    value={minPriceText}
                    onChangeText={setMinPriceText}
                  />
                </View>
                <Text style={styles.priceSep}>—</Text>
                <View style={styles.priceInputWrapper}>
                  <Text style={styles.priceInputLabel}>Máx.</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="∞"
                    placeholderTextColor={colors.gray[400]}
                    keyboardType="numeric"
                    value={maxPriceText}
                    onChangeText={setMaxPriceText}
                  />
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Category chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          <TouchableOpacity
            style={[styles.chip, !selectedCategory && styles.chipActive]}
            onPress={() => setSelectedCategory("")}
          >
            <Text style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>Todos</Text>
          </TouchableOpacity>
          {PRODUCT_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, selectedCategory === cat && styles.chipActive]}
              onPress={() => setSelectedCategory(selectedCategory === cat ? "" : cat)}
            >
              <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Content ── */}
      {isFirstLoad ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.brand[500]} />
          <Text style={styles.helperText}>Cargando productos...</Text>
        </View>
      ) : (
        <FlatList
          data={allProducts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={listHeader}
          ListFooterComponent={
            isFetching && queryOffset > 0 ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={colors.brand[500]} />
                <Text style={styles.helperText}>Cargando más...</Text>
              </View>
            ) : hasMore && !isFetching ? (
              <TouchableOpacity style={styles.loadMoreButton} onPress={loadMore}>
                <Text style={styles.loadMoreText}>Cargar más</Text>
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={colors.gray[300]} />
              <Text style={styles.emptyTitle}>Sin resultados</Text>
              <Text style={styles.helperText}>
                {searchQuery ? `No encontramos productos para «${searchQuery}»` : "No hay productos disponibles"}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <HomeProductCard
              product={item}
              isFavorite={favorites.has(item.id)}
              onFavorite={() => toggleFavorite(item.id)}
              onPress={() => navigation.navigate("ProductDetail", { productId: item.id })}
            />
          )}
        />
      )}

      <NotificationsPanel
        visible={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </View>
  );
}

// ── Carousel ──────────────────────────────────────────────────────────────────

function ProductCarousel({ products, onPress }: { products: Product[]; onPress: (id: string) => void }) {
  const flatListRef  = useRef<FlatList>(null);
  const currentIndex = useRef(0);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (products.length <= 1) return;
    const interval = setInterval(() => {
      currentIndex.current = (currentIndex.current + 1) % products.length;
      flatListRef.current?.scrollToOffset({ offset: currentIndex.current * CAROUSEL_W, animated: true });
      setActiveSlide(currentIndex.current);
    }, 3000);
    return () => clearInterval(interval);
  }, [products.length]);

  return (
    <View style={carouselStyles.wrapper}>
      <FlatList
        ref={flatListRef}
        data={products}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={{ width: CAROUSEL_W }}
        getItemLayout={(_, i) => ({ length: CAROUSEL_W, offset: CAROUSEL_W * i, index: i })}
        onMomentumScrollEnd={(e) => {
          const slide = Math.round(e.nativeEvent.contentOffset.x / CAROUSEL_W);
          setActiveSlide(slide);
          currentIndex.current = slide;
        }}
        keyExtractor={(item) => `c-${item.id}`}
        renderItem={({ item }) => (
          <TouchableOpacity style={{ width: CAROUSEL_W }} activeOpacity={0.88} onPress={() => onPress(item.id)}>
            <Image source={{ uri: item.images![0] }} style={carouselStyles.image} resizeMode="cover" />
            <View style={carouselStyles.overlay}>
              <Text style={carouselStyles.overlayTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={carouselStyles.overlayPrice}>${item.price.toFixed(2)}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
      <View style={carouselStyles.dots}>
        {products.map((_, i) => (
          <View key={i} style={[carouselStyles.dot, i === activeSlide ? carouselStyles.dotActive : carouselStyles.dotInactive]} />
        ))}
      </View>
    </View>
  );
}

// ── HomeProductCard ───────────────────────────────────────────────────────────

function HomeProductCard({ product, isFavorite, onFavorite, onPress }: {
  product: Product;
  isFavorite: boolean;
  onFavorite: () => void;
  onPress: () => void;
}) {
  const firstImage = product.images?.[0];
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.82}>
      <View style={styles.imageContainer}>
        {firstImage
          ? <Image source={{ uri: firstImage }} style={styles.cardImage} resizeMode="cover" />
          : <View style={[styles.cardImage, styles.imagePlaceholder]}>
              <Ionicons name="image-outline" size={32} color={colors.gray[300]} />
            </View>
        }
        <TouchableOpacity
          style={styles.heartButton}
          onPress={onFavorite}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={18}
            color={isFavorite ? colors.brand[500] : colors.white}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>{product.title}</Text>
        <Text style={styles.cardPrice}>${product.price.toFixed(2)}</Text>
        <Text style={styles.cardCategory} numberOfLines={1}>{product.category}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const carouselStyles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md, alignItems: "center", gap: spacing.sm },
  image: { width: CAROUSEL_W, height: 180, borderRadius: radius.lg, backgroundColor: colors.gray[100] },
  overlay: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    borderBottomLeftRadius: radius.lg, borderBottomRightRadius: radius.lg,
    backgroundColor: "rgba(0,0,0,0.42)", padding: spacing.sm, gap: 2,
  },
  overlayTitle: { color: colors.white, fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  overlayPrice: { color: colors.brand[300], fontSize: typography.size.md, fontWeight: typography.weight.bold },
  dots: { flexDirection: "row", alignItems: "center", gap: 5 },
  dot: { height: 6, borderRadius: 3 },
  dotActive: { width: 16, backgroundColor: colors.brand[500] },
  dotInactive: { width: 6, backgroundColor: colors.gray[300] },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },

  /* Header */
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },

  /* Greeting */
  greetingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  greetingLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.brand[500],
    alignItems: "center", justifyContent: "center",
  },
  avatarInitial: { color: colors.white, fontSize: typography.size.md, fontWeight: typography.weight.bold },
  greetingHola: { fontSize: 12, color: colors.gray[500] },
  greetingName: { fontSize: typography.size.md, color: colors.gray[900], fontWeight: typography.weight.bold },
  bellButton: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.gray[100],
    alignItems: "center", justifyContent: "center",
  },

  /* Search */
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    width: "100%",
    paddingTop: spacing.sm,
  },
  
  searchBar: {
    width: SCREEN_W - spacing.md * 2 - 44 - spacing.xs,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray[100],
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    marginRight: spacing.xs,
  },
  
  sortButton: {
    width: 44,
    height: 44,
    flexShrink: 0,
    borderRadius: radius.lg,
    backgroundColor: colors.gray[100],
    alignItems: "center",
    justifyContent: "center",
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: spacing.sm,
    fontSize: typography.size.sm,
    color: colors.gray[900],
  },

  /* Category chips */
  chipsRow: { flexDirection: "row", gap: spacing.xs, paddingVertical: spacing.xs },
  chip: {
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.gray[300], backgroundColor: colors.white,
  },
  chipActive: { backgroundColor: colors.brand[500], borderColor: colors.brand[500] },
  chipText: { fontSize: typography.size.sm, color: colors.gray[700] },
  chipTextActive: { color: colors.white, fontWeight: typography.weight.semibold },

  /* Results bar */
  resultsBar: { marginBottom: spacing.sm, gap: spacing.xs },
  resultsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  resultsCount: { fontSize: typography.size.md, fontWeight: typography.weight.bold, color: colors.gray[900] },
  clearButton: { flexDirection: "row", alignItems: "center", gap: 4 },
  clearButtonText: { fontSize: typography.size.sm, color: colors.gray[500] },

  /* Sort chips */
  sortRow: { flexDirection: "row", gap: spacing.xs },
  sortChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: spacing.sm, paddingVertical: 6,
    borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.gray[200], backgroundColor: colors.white,
  },
  sortChipActive: { borderColor: colors.brand[400], backgroundColor: colors.brand[50] },
  sortChipText: { fontSize: typography.size.sm, color: colors.gray[500] },
  sortChipTextActive: { color: colors.brand[500], fontWeight: typography.weight.semibold },

  /* FlatList */
  listContent: { padding: spacing.md, gap: spacing.sm, flexGrow: 1 },
  columnWrapper: { gap: spacing.sm },

  /* States */
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.sm },
  helperText: { fontSize: typography.size.sm, color: colors.gray[500], textAlign: "center" },
  emptyState: { alignItems: "center", gap: spacing.sm, marginTop: spacing.xl },
  emptyTitle: { fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: colors.gray[900] },
  footerLoader: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingVertical: spacing.md },
  loadMoreButton: { alignItems: "center", paddingVertical: spacing.md, marginTop: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.brand[500] },
  loadMoreText: { fontSize: typography.size.sm, color: colors.brand[500], fontWeight: typography.weight.semibold },

  /* Product card */
  card: {
    width: GRID_CARD_W, backgroundColor: colors.white,
    borderRadius: radius.lg, overflow: "hidden",
    borderWidth: 1, borderColor: colors.gray[200],
  },
  imageContainer: { width: "100%", aspectRatio: 1 },
  cardImage: { width: "100%", height: "100%", backgroundColor: colors.gray[100] },
  imagePlaceholder: { alignItems: "center", justifyContent: "center" },
  heartButton: {
    position: "absolute", top: spacing.xs, right: spacing.xs,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.32)",
    alignItems: "center", justifyContent: "center",
  },
  cardBody: { padding: spacing.sm, gap: 2 },
  cardTitle: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.gray[900], lineHeight: 18 },
  cardPrice: { fontSize: typography.size.md, fontWeight: typography.weight.bold, color: colors.brand[500] },
  cardCategory: { fontSize: 12, color: colors.gray[400] },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  
  sortButtonActive: {
    backgroundColor: colors.brand[50],
    borderWidth: 1,
    borderColor: colors.brand[300],
  },
  
  sortDropdown: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.gray[200],
    overflow: "hidden",
  },
  
  sortOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  
  sortOptionActive: {
    backgroundColor: colors.brand[50],
  },
  
  sortOptionText: {
    fontSize: typography.size.sm,
    color: colors.gray[700],
  },
  
  sortOptionTextActive: {
    color: colors.brand[500],
    fontWeight: typography.weight.semibold,
  },
  sortDivider: {
    height: 1,
    backgroundColor: colors.gray[200],
    marginVertical: spacing.xs,
  },
  priceFilterSection: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  priceFilterLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.gray[700],
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  priceInputWrapper: {
    flex: 1,
    gap: 2,
  },
  priceInputLabel: {
    fontSize: 11,
    color: colors.gray[500],
  },
  priceInput: {
    backgroundColor: colors.gray[100],
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: typography.size.sm,
    color: colors.gray[900],
  },
  priceSep: {
    fontSize: typography.size.sm,
    color: colors.gray[400],
    marginTop: spacing.md,
  },
});
