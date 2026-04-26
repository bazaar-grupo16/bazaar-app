import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  LayoutAnimation,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  useWindowDimensions,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useProduct } from "@/entities/product";
import type { Product } from "@/entities/product";
import { useAddToCart } from "@/entities/cart";
import { ApiError, apiGet } from "@/shared/api";
import type { RootStackParamList } from "@/navigation";
import { colors, radius, spacing, typography } from "@/shared/styles";
import { Button } from "@/shared/ui";

const DESCRIPTION_PREVIEW_LENGTH = 140;

interface SellerProfile {
  id: string;
  name: string;
  email?: string;
}

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
          <ActivityIndicator size="large" color={colors.brand[500]} />
          <Text style={styles.helperText}>Cargando producto...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <GlassButton icon="chevron-back" onPress={() => navigation.goBack()} />
        </View>
        <View style={styles.centeredContainer}>
          <Text style={styles.errorTitle}>No se pudo cargar el producto</Text>
          <Text style={styles.helperText}>El catálogo no pudo responder. Intentá de nuevo.</Text>
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
  const insets = useSafeAreaInsets();
  const isInactive = product.status === "inactive";
  const isOutOfStock = product.status === "out_of_stock";
  const canAddToCart = !isInactive && !isOutOfStock;

  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [sellerModalVisible, setSellerModalVisible] = useState(false);

  const addToCart = useAddToCart(1001);
  const [feedback, setFeedback] = useState<AddToCartFeedback>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const successTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleAddToCart = useCallback(() => {
    if (!canAddToCart) return;
    setFeedback("loading");
    setErrorMsg("");
    addToCart.mutate(
      { productId: product.id, quantity },
      {
        onSuccess: () => {
          setFeedback("success");
          if (successTimerRef.current) clearTimeout(successTimerRef.current);
          successTimerRef.current = setTimeout(() => setFeedback("idle"), 2500);
        },
        onError: (err) => {
          setFeedback("error");
          if (err instanceof ApiError) {
            const detail = (err.details as { detail?: string })?.detail;
            if (err.status === 422) setErrorMsg("Stock insuficiente para la cantidad seleccionada");
            else if (err.status === 404) setErrorMsg("Producto no encontrado");
            else if (err.status === 503) setErrorMsg("Servicio no disponible");
            else setErrorMsg(detail ?? "Error al agregar");
          } else {
            setErrorMsg("Error de conexión");
          }
        },
      }
    );
  }, [canAddToCart, addToCart, product.id, quantity]);

  const handleShare = useCallback(async () => {
    const deepLink = `http://bazaar.pib.ar/products/${product.id}`;
    try {
      await Share.share({
        title: product.title,
        message: `Mirá este producto 👇\n${product.title} — $${product.price.toFixed(2)}\n\n${deepLink}`,
        url: deepLink,
      });
    } catch {
      // user cancelled
    }
  }, [product.title, product.price, product.id]);

  function getButtonLabel() {
    if (feedback === "loading") return "Agregando...";
    if (feedback === "success") return "Agregado al carrito";
    if (feedback === "error") return errorMsg || "Error";
    return "Agregar al carrito";
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero: image carousel with overlaid controls */}
        <View style={styles.hero}>
          <ProductImageCarousel images={product.images ?? []} title={product.title} />

          <View style={[styles.topBarOverlay, { top: insets.top + spacing.sm }]}>
            <GlassButton icon="chevron-back" onPress={onBack} />
            <View style={styles.topBarRight}>
              <GlassButton
                icon={isFavorite ? "heart" : "heart-outline"}
                iconColor={isFavorite ? colors.brand[400] : colors.white}
                onPress={() => setIsFavorite((v) => !v)}
              />
              <GlassButton
                icon="share-outline"
                onPress={() => {
                  void handleShare();
                }}
              />
            </View>
          </View>

          {(isInactive || isOutOfStock) && (
            <ProductBadge isDisabled={isInactive} isOutOfStock={isOutOfStock} />
          )}
        </View>

        {/* Main content */}
        <View style={styles.content}>
          {/* Category + stock badges + title + price */}
          <View style={styles.infoSection}>
            <View style={styles.badgeRow}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{product.category}</Text>
              </View>
              {!isInactive && (
                <View
                  style={[
                    styles.stockBadge,
                    isOutOfStock ? styles.stockBadgeOutOfStock : styles.stockBadgeAvailable,
                  ]}
                >
                  <Ionicons
                    name={isOutOfStock ? "alert-circle-outline" : "cube-outline"}
                    size={12}
                    color={isOutOfStock ? "#92400e" : colors.gray[500]}
                  />
                  <Text
                    style={[styles.stockBadgeText, isOutOfStock && styles.stockBadgeTextOutOfStock]}
                  >
                    {isOutOfStock ? "Sin stock" : `${product.stock} disponibles`}
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.productTitle}>{product.title}</Text>
            <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>

            {isInactive && (
              <View style={styles.unavailableRow}>
                <Ionicons name="information-circle-outline" size={16} color={colors.gray[400]} />
                <Text style={styles.unavailableText}>Este producto no está disponible</Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Seller row — taps to open modal */}
          <TouchableOpacity
            style={styles.sellerRow}
            activeOpacity={0.7}
            onPress={() => setSellerModalVisible(true)}
          >
            <View style={styles.sellerAvatar}>
              <Text style={styles.sellerAvatarText}>
                {product.sellerId.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>Vendedor</Text>
              <Text style={styles.sellerId}>ID: {product.sellerId}</Text>
            </View>
            <View style={styles.sellerChevron}>
              <Text style={styles.sellerProfileText}>Ver perfil</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.brand[500]} />
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Description */}
          <ProductDescription description={product.description} />

          <View style={styles.divider} />

          {/* Trust badge */}
          <View style={styles.trustBadge}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#16a34a" />
            <View style={styles.trustCopy}>
              <Text style={styles.trustTitle}>Compra protegida</Text>
              <Text style={styles.trustText}>
                Si el producto no llega o no es como se describe, te devolvemos el dinero.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action bar — flex child of SafeAreaView (not absolute) */}
      <View style={styles.actionBar}>
        {canAddToCart ? (
          <>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={styles.quantityBtn}
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1 || feedback === "loading"}
              >
                <Ionicons
                  name="remove"
                  size={18}
                  color={quantity <= 1 ? colors.gray[300] : colors.gray[700]}
                />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityBtn}
                onPress={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                disabled={quantity >= product.stock || feedback === "loading"}
              >
                <Ionicons
                  name="add"
                  size={18}
                  color={quantity >= product.stock ? colors.gray[300] : colors.gray[700]}
                />
              </TouchableOpacity>
            </View>

            <Button
              style={[
                styles.addButton,
                feedback === "success" && styles.addButtonSuccess,
                feedback === "error" && styles.addButtonError,
              ]}
              disabled={feedback === "loading"}
              loading={feedback === "loading"}
              onPress={handleAddToCart}
            >
              {getButtonLabel()}
            </Button>
          </>
        ) : (
          <Button style={styles.addButtonFull} disabled>
            {isOutOfStock ? "Sin Stock" : "No Disponible"}
          </Button>
        )}
      </View>

      <SellerProfileModal
        sellerId={product.sellerId}
        visible={sellerModalVisible}
        onClose={() => setSellerModalVisible(false)}
      />
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function GlassButton({
  icon,
  iconColor = colors.white,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.glassButton} activeOpacity={0.75} onPress={onPress}>
      <Ionicons name={icon} size={22} color={iconColor} />
    </TouchableOpacity>
  );
}

function SellerProfileModal({
  sellerId,
  visible,
  onClose,
}: {
  sellerId: string;
  visible: boolean;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["seller-profile", sellerId],
    queryFn: () => apiGet<SellerProfile>(`/users/${sellerId}`),
    enabled: visible,
    retry: false,
  });

  const displayName = data?.name ?? "Vendedor";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Perfil del vendedor</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Ionicons name="close" size={22} color={colors.gray[500]} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.modalLoading}>
              <ActivityIndicator color={colors.brand[500]} />
            </View>
          ) : (
            <>
              <View style={styles.modalAvatarContainer}>
                <View style={styles.modalAvatar}>
                  <Text style={styles.modalAvatarText}>{initial}</Text>
                </View>
                <Text style={styles.modalSellerName}>{displayName}</Text>
                <Text style={styles.modalSellerId}>ID: {sellerId}</Text>
              </View>

              <View style={styles.modalStats}>
                <View style={styles.modalStat}>
                  <Text style={styles.modalStatValue}>—</Text>
                  <Text style={styles.modalStatLabel}>Ventas</Text>
                </View>
                <View style={styles.modalStatDivider} />
                <View style={styles.modalStat}>
                  <Text style={styles.modalStatValue}>—</Text>
                  <Text style={styles.modalStatLabel}>Calificación</Text>
                </View>
                <View style={styles.modalStatDivider} />
                <View style={styles.modalStat}>
                  <Text style={styles.modalStatValue}>—</Text>
                  <Text style={styles.modalStatLabel}>Miembro desde</Text>
                </View>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function ProductImageCarousel({ images, title }: { images: string[]; title: string }) {
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<string>>(null);
  const carouselImages = useMemo(() => (images.length > 0 ? images : [""]), [images]);

  function handleScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
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
          <View style={[styles.heroImageFrame, { width }]}>
            {item ? (
              <Image source={{ uri: item }} style={styles.heroImage} resizeMode="cover" />
            ) : (
              <View style={styles.heroPlaceholder}>
                <Ionicons name="image-outline" size={48} color={colors.gray[300]} />
                <Text style={styles.heroPlaceholderText}>Sin imagen</Text>
              </View>
            )}
          </View>
        )}
        onMomentumScrollEnd={handleScrollEnd}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        accessibilityLabel={`Galería de imágenes de ${title}`}
      />

      {carouselImages.length > 1 && (
        <View style={styles.dotsRow}>
          {carouselImages.map((image, index) => (
            <View key={`dot-${index}`} style={[styles.dot, index === activeIndex && styles.activeDot]} />
          ))}
        </View>
      )}
    </View>
  );
}

function ProductDescription({ description }: { description: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = description.length > DESCRIPTION_PREVIEW_LENGTH;
  const visible =
    expanded || !isLong
      ? description
      : `${description.slice(0, DESCRIPTION_PREVIEW_LENGTH).trim()}...`;

  function toggle() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  }

  return (
    <View style={styles.descriptionBlock}>
      <Text style={styles.sectionTitle}>Descripción</Text>
      <Text style={styles.descriptionText}>{visible}</Text>
      {isLong && (
        <TouchableOpacity onPress={toggle} activeOpacity={0.75}>
          <Text style={styles.readMore}>{expanded ? "Ver menos" : "Ver más"}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function ProductBadge({ isDisabled, isOutOfStock }: { isDisabled: boolean; isOutOfStock: boolean }) {
  if (!isDisabled && !isOutOfStock) return null;
  return (
    <View style={[styles.badge, isDisabled ? styles.disabledBadge : styles.outOfStockBadge]}>
      <Text style={[styles.badgeText, isDisabled ? styles.disabledBadgeText : styles.outOfStockBadgeText]}>
        {isDisabled ? "No Disponible" : "Sin Stock"}
      </Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
  },
  helperText: {
    fontSize: typography.size.sm,
    color: colors.gray[500],
    textAlign: "center",
  },
  errorTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
    textAlign: "center",
  },
  topBar: {
    padding: spacing.md,
  },

  // ── Scroll content ──
  scrollContent: {
    paddingBottom: spacing.lg,
    backgroundColor: colors.gray[50],
  },

  // ── Hero ──
  hero: {
    position: "relative",
    backgroundColor: colors.gray[100],
  },
  heroImageFrame: {
    height: 320,
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
    fontSize: typography.size.sm,
    color: colors.gray[400],
  },
  topBarOverlay: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topBarRight: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  glassButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.32)",
    alignItems: "center",
    justifyContent: "center",
  },
  dotsRow: {
    position: "absolute",
    bottom: spacing.sm,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  activeDot: {
    width: 18,
    backgroundColor: colors.brand[400],
  },
  badge: {
    position: "absolute",
    right: spacing.md,
    top: spacing.md,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
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

  // ── Content ──
  content: {
    padding: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.white,
  },
  infoSection: {
    gap: spacing.sm,
  },
  badgeRow: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  categoryBadge: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.brand[50],
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: typography.weight.bold,
    color: colors.brand[600],
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  stockBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  stockBadgeAvailable: {
    backgroundColor: colors.gray[100],
  },
  stockBadgeOutOfStock: {
    backgroundColor: "#FEF3C7",
  },
  stockBadgeText: {
    fontSize: 11,
    fontWeight: typography.weight.semibold,
    color: colors.gray[700],
  },
  stockBadgeTextOutOfStock: {
    color: "#92400e",
  },
  productTitle: {
    fontSize: 20,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
    lineHeight: 26,
  },
  productPrice: {
    fontSize: 28,
    fontWeight: typography.weight.bold,
    color: colors.brand[500],
    letterSpacing: -0.5,
  },
  unavailableRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  unavailableText: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.gray[400],
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[100],
  },

  // ── Seller ──
  sellerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  sellerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand[300],
    alignItems: "center",
    justifyContent: "center",
  },
  sellerAvatarText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.white,
  },
  sellerInfo: {
    flex: 1,
    gap: 2,
  },
  sellerName: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
  },
  sellerId: {
    fontSize: 12,
    color: colors.gray[400],
  },
  sellerChevron: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  sellerProfileText: {
    fontSize: 13,
    fontWeight: typography.weight.semibold,
    color: colors.brand[500],
  },

  // ── Description ──
  descriptionBlock: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
  },
  descriptionText: {
    fontSize: typography.size.sm,
    lineHeight: 22,
    color: colors.gray[500],
  },
  readMore: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.brand[500],
  },

  // ── Trust badge ──
  trustBadge: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: "#f0fdf4",
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  trustCopy: {
    flex: 1,
    gap: 2,
  },
  trustTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: "#166534",
  },
  trustText: {
    fontSize: 12,
    lineHeight: 17,
    color: "#15803d",
  },

  // ── Action bar ──
  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.white,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray[50],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  quantityBtn: {
    width: 40,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
    minWidth: 28,
    textAlign: "center",
  },
  addButton: {
    flex: 1,
    backgroundColor: colors.brand[500],
  },
  addButtonFull: {
    flex: 1,
  },
  addButtonSuccess: {
    backgroundColor: colors.brand[600],
  },
  addButtonError: {
    backgroundColor: colors.error,
  },

  // ── Seller modal ──
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray[200],
    alignSelf: "center",
    marginBottom: spacing.xs,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
  },
  modalLoading: {
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
  modalAvatarContainer: {
    alignItems: "center",
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  modalAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brand[300],
    alignItems: "center",
    justifyContent: "center",
  },
  modalAvatarText: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.white,
  },
  modalSellerName: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
  },
  modalSellerId: {
    fontSize: typography.size.sm,
    color: colors.gray[400],
  },
  modalStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: colors.gray[50],
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  modalStat: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  modalStatValue: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
  },
  modalStatLabel: {
    fontSize: 11,
    color: colors.gray[400],
  },
  modalStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.gray[200],
  },
});
