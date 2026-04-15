import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  LayoutAnimation,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  useWindowDimensions,
  View,
} from "react-native";
import { useProduct } from "@/entities/product";
import type { Product } from "@/entities/product";
import { useAddToCart } from "@/entities/cart";
import { ApiError } from "@/shared/api";
import type { RootStackParamList } from "@/navigation";
import { colors, radius, spacing, typography } from "@/shared/styles";
import { Button } from "@/shared/ui";

const ORANGE_600 = "#F97316";
const DESCRIPTION_PREVIEW_LENGTH = 140;

type ProductDetailRouteProps = NativeStackScreenProps<RootStackParamList, "ProductDetail">["route"];
type ProductDetailNavigationProps = NativeStackNavigationProp<RootStackParamList, "ProductDetail">;

export function ProductDetailPage() {
  const route = useRoute<ProductDetailRouteProps>();
  const navigation = useNavigation<ProductDetailNavigationProps>();
  const { data, error, isLoading, isRefetching, refetch } = useProduct(route.params.productId);

  useEffect(() => {
    if (Platform.OS === "android") {
      UIManager.setLayoutAnimationEnabledExperimental?.(true);
    }
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={ORANGE_600} />
          <Text style={styles.helperText}>Cargando producto...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <IconButton icon="chevron-back" onPress={() => navigation.goBack()} />
        </View>
        <View style={styles.centeredContainer}>
          <Text style={styles.title}>No se pudo cargar el producto</Text>
          <Text style={styles.helperText}>El catálogo no pudo responder en este momento. Intentá de nuevo.</Text>
          <Button onPress={() => void refetch()} loading={isRefetching}>
            Reintentar
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return <ProductDetailView product={data.data} onBack={() => navigation.goBack()} />;
}

type AddToCartFeedback = "idle" | "loading" | "success" | "error";

function ProductDetailView({ product, onBack }: { product: Product; onBack: () => void }) {
  const isDisabled = product.status === "inactive";
  const isOutOfStock = !isDisabled && product.stock === 0;
  const canAddToCart = !isDisabled && product.stock > 0;

  const addToCart = useAddToCart(1001);
  const [feedback, setFeedback] = useState<AddToCartFeedback>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const successTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleAddToCart = useCallback(() => {
    if (!canAddToCart) return;

    setFeedback("loading");
    setErrorMsg("");

    addToCart.mutate(product.id, {
      onSuccess: () => {
        setFeedback("success");
        if (successTimerRef.current) clearTimeout(successTimerRef.current);
        successTimerRef.current = setTimeout(() => setFeedback("idle"), 2000);
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
            setErrorMsg(detail ?? "Error al agregar");
          }
        } else {
          setErrorMsg("Error de conexión");
        }
      },
    });
  }, [canAddToCart, addToCart, product.id]);

  function getButtonLabel() {
    if (feedback === "loading") return "Agregando...";
    if (feedback === "success") return "¡Agregado! ✓";
    if (feedback === "error") return errorMsg || "Error";
    if (!canAddToCart) return isOutOfStock ? "Sin Stock" : "No Disponible";
    return "Agregar al Carrito";
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <ProductImageCarousel images={product.images ?? []} title={product.title} />
          <View style={styles.topBarOverlay}>
            <IconButton icon="chevron-back" onPress={onBack} />
          </View>
          <ProductBadge isDisabled={isDisabled} isOutOfStock={isOutOfStock} />
        </View>

        <View style={styles.content}>
          <View style={styles.infoCard}>
            <View style={styles.headingRow}>
              <View style={styles.headingCopy}>
                <Text style={styles.category}>{product.category}</Text>
                <Text style={styles.productName}>{product.title}</Text>
              </View>
              {!isDisabled ? (
                <View style={styles.stockPill}>
                  <Ionicons
                    name={product.stock > 0 ? "cube-outline" : "alert-circle-outline"}
                    size={16}
                    color={product.stock > 0 ? colors.gray[700] : colors.error}
                  />
                  <Text style={[styles.stockPillText, isOutOfStock && styles.outOfStockText]}>
                    {product.stock > 0 ? `${product.stock} disponibles` : "Sin stock"}
                  </Text>
                </View>
              ) : null}
            </View>

            {isDisabled ? (
              <View style={styles.unavailableMessage}>
                <Ionicons name="information-circle-outline" size={18} color={colors.gray[700]} />
                <Text style={styles.unavailableText}>Este producto no está disponible actualmente</Text>
              </View>
            ) : null}

            <ProductDescription description={product.description} />
          </View>

          <SellerCard sellerId={product.sellerId} />
        </View>
      </ScrollView>

      <View style={styles.actionBar}>
        {!isDisabled ? (
          <View>
            <Text style={styles.actionLabel}>Precio</Text>
            <Text style={styles.actionPrice}>${product.price.toFixed(2)}</Text>
          </View>
        ) : (
          <Text style={styles.disabledActionText}>No disponible</Text>
        )}
        <Button
          style={[
            styles.actionButton,
            feedback === "success" && styles.actionButtonSuccess,
            feedback === "error" && styles.actionButtonError,
          ]}
          disabled={!canAddToCart || feedback === "loading"}
          loading={feedback === "loading"}
          onPress={handleAddToCart}
        >
          {getButtonLabel()}
        </Button>
      </View>
    </SafeAreaView>
  );
}

function ProductImageCarousel({ images, title }: { images: string[]; title: string }) {
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<string>>(null);
  const carouselImages = useMemo(() => (images.length > 0 ? images : [""]), [images]);
  const heroWidth = width;

  function handleScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / heroWidth);
    setActiveIndex(nextIndex);
  }

  return (
    <View>
      <FlatList
        ref={listRef}
        data={carouselImages}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => `${item || "placeholder"}-${index}`}
        renderItem={({ item }) => (
          <View style={[styles.heroImageFrame, { width: heroWidth }]}>
            {item ? (
              <Image source={{ uri: item }} style={styles.heroImage} resizeMode="cover" />
            ) : (
              <View style={styles.heroPlaceholder}>
                <Ionicons name="image-outline" size={48} color={colors.gray[500]} />
                <Text style={styles.heroPlaceholderText}>Sin imagen</Text>
              </View>
            )}
          </View>
        )}
        onMomentumScrollEnd={handleScrollEnd}
        getItemLayout={(_, index) => ({
          length: heroWidth,
          offset: heroWidth * index,
          index,
        })}
        accessibilityLabel={`Galería de imágenes de ${title}`}
      />

      {carouselImages.length > 1 ? (
        <View style={styles.dotsRow}>
          {carouselImages.map((image, index) => (
            <View
              key={`${image}-${index}`}
              style={[styles.dot, index === activeIndex && styles.activeDot]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function ProductDescription({ description }: { description: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLongDescription = description.length > DESCRIPTION_PREVIEW_LENGTH;
  const visibleDescription =
    expanded || !isLongDescription
      ? description
      : `${description.slice(0, DESCRIPTION_PREVIEW_LENGTH).trim()}...`;

  function toggleDescription() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((current) => !current);
  }

  return (
    <View style={styles.descriptionBlock}>
      <Text style={styles.sectionTitle}>Descripción</Text>
      <Text style={styles.description}>{visibleDescription}</Text>
      {isLongDescription ? (
        <TouchableOpacity onPress={toggleDescription} activeOpacity={0.75}>
          <Text style={styles.readMore}>{expanded ? "Ver menos" : "Ver más"}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function SellerCard({ sellerId }: { sellerId: string }) {
  return (
    <View style={styles.sellerCard}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>B</Text>
      </View>
      <View style={styles.sellerCopy}>
        <Text style={styles.sellerName}>Vendedor Bazaar</Text>
        <View style={styles.sellerLocationRow}>
          <Ionicons name="location-outline" size={16} color={colors.gray[500]} />
          <Text style={styles.sellerLocation}>Ubicación no disponible</Text>
        </View>
        <Text style={styles.sellerId}>ID vendedor: {sellerId}</Text>
      </View>
    </View>
  );
}

function ProductBadge({ isDisabled, isOutOfStock }: { isDisabled: boolean; isOutOfStock: boolean }) {
  if (!isDisabled && !isOutOfStock) {
    return null;
  }

  return (
    <View style={[styles.badge, isDisabled ? styles.disabledBadge : styles.outOfStockBadge]}>
      <Text style={[styles.badgeText, isDisabled ? styles.disabledBadgeText : styles.outOfStockBadgeText]}>
        {isDisabled ? "No Disponible" : "Sin Stock"}
      </Text>
    </View>
  );
}

function IconButton({ icon, onPress }: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.iconButton} activeOpacity={0.75} onPress={onPress}>
      <Ionicons name={icon} size={24} color={colors.gray[900]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  centeredContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.white,
  },
  helperText: {
    fontSize: typography.size.md,
    color: colors.gray[700],
    textAlign: "center",
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
    textAlign: "center",
  },
  scrollContent: {
    paddingBottom: 116,
    backgroundColor: colors.gray[50],
  },
  hero: {
    position: "relative",
    backgroundColor: colors.gray[100],
  },
  heroImageFrame: {
    height: 360,
    backgroundColor: colors.gray[100],
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  heroPlaceholderText: {
    fontSize: typography.size.md,
    color: colors.gray[500],
  },
  topBar: {
    padding: spacing.md,
  },
  topBarOverlay: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
  },
  dotsRow: {
    position: "absolute",
    right: 0,
    bottom: spacing.md,
    left: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xs,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.58)",
  },
  activeDot: {
    width: 20,
    backgroundColor: ORANGE_600,
  },
  badge: {
    position: "absolute",
    right: spacing.md,
    top: spacing.md,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  outOfStockBadge: {
    backgroundColor: "#FEF3C7",
  },
  disabledBadge: {
    backgroundColor: colors.gray[900],
  },
  badgeText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },
  outOfStockBadgeText: {
    color: "#92400E",
  },
  disabledBadgeText: {
    color: colors.white,
  },
  content: {
    gap: spacing.md,
    padding: spacing.md,
  },
  infoCard: {
    gap: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.white,
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  headingCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  category: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: ORANGE_600,
    textTransform: "uppercase",
  },
  productName: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
  },
  stockPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.gray[100],
  },
  stockPillText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.gray[700],
  },
  outOfStockText: {
    color: colors.error,
  },
  unavailableMessage: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.gray[100],
  },
  unavailableText: {
    flex: 1,
    fontSize: typography.size.md,
    color: colors.gray[700],
  },
  descriptionBlock: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
  },
  description: {
    fontSize: typography.size.md,
    lineHeight: 23,
    color: colors.gray[700],
  },
  readMore: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: ORANGE_600,
  },
  sellerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.white,
  },
  avatar: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: ORANGE_600,
  },
  avatarText: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.white,
  },
  sellerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  sellerName: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
  },
  sellerLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  sellerLocation: {
    fontSize: typography.size.sm,
    color: colors.gray[700],
  },
  sellerId: {
    fontSize: typography.size.sm,
    color: colors.gray[500],
  },
  actionBar: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  actionLabel: {
    fontSize: typography.size.sm,
    color: colors.gray[500],
  },
  actionPrice: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
  },
  disabledActionText: {
    flex: 1,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.gray[700],
  },
  actionButton: {
    flex: 1,
    backgroundColor: ORANGE_600,
  },
  actionButtonSuccess: {
    backgroundColor: "#16a34a",
  },
  actionButtonError: {
    backgroundColor: colors.error,
  },
});
