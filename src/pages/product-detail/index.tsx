import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import * as Linking from "expo-linking";
import { useProduct, getProductShareLink } from "@/entities/product";
import type { Product } from "@/entities/product";
import { useAddToCart, useCart } from "@/entities/cart";
import { useWishlist, useAddToWishlist, useRemoveFromWishlist } from "@/entities/wishlist";
import { getPublicProfile } from "@/entities/profile/api/profile";
import { useSessionUserId, clearAuthSession, usePendingActionStore } from "@/shared/auth";
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

  if (data?.data.status === "inactive") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <GlassButton icon="chevron-back" onPress={() => navigation.goBack()} />
        </View>
        <View style={styles.centeredContainer}>
          <Text style={styles.errorTitle}>Este producto ya no está disponible</Text>
          <Text style={styles.helperText}>El vendedor dio de baja este producto.</Text>
          <Button onPress={() => navigation.goBack()}>Volver al catálogo</Button>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !data) {
    const errorDetail = error instanceof ApiError
      ? (error.details as { detail?: string })?.detail
      : undefined;

    if (error instanceof ApiError && error.status === 404 && errorDetail === "Product not found") {
      return (
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.topBar}>
            <GlassButton icon="chevron-back" onPress={() => navigation.goBack()} />
          </View>
          <View style={styles.centeredContainer}>
            <Text style={styles.errorTitle}>Producto no encontrado</Text>
            <Text style={styles.helperText}>El producto que buscás no existe.</Text>
            <Button onPress={() => navigation.goBack()}>Volver al catálogo</Button>
          </View>
        </SafeAreaView>
      );
    }

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

  const [quantity, setQuantity] = useState(1);
  const [sellerModalVisible, setSellerModalVisible] = useState(false);

  const userId = useSessionUserId();
  const { data: cartData } = useCart();
  const { data: wishlistData } = useWishlist(!!userId);
  const isWishlisted = wishlistData?.items.some((i) => i.product_id === product.id) ?? false;
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const setPendingWishlist = usePendingActionStore((s) => s.setPendingWishlist);

  const toggleWishlist = () => {
    if (!userId) {
      Alert.alert(
        "Iniciá sesión",
        "Para guardar favoritos necesitás tener una cuenta.",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Iniciar sesión",
            onPress: () => {
              setPendingWishlist({ productId: product.id, action: "add" });
              void clearAuthSession();
            },
          },
        ],
      );
      return;
    }
    if (isWishlisted) {
      removeFromWishlist.mutate(product.id);
    } else {
      addToWishlist.mutate(product.id);
    }
  };

  const cartQty = cartData?.data.items.find((i) => i.productId === product.id)?.quantity ?? 0;
  const maxToAdd = Math.max(0, product.stock - cartQty);
  const canAddToCart = !isInactive && !isOutOfStock && maxToAdd > 0;

  useEffect(() => {
    if (maxToAdd > 0 && quantity > maxToAdd) setQuantity(maxToAdd);
  }, [maxToAdd, quantity]);

  const addToCart = useAddToCart();
  const MOCK_SELLER_ID = "222e52aa-d03b-46c6-845e-83605cdfa319";
  //sacar mock por product.sellerId
  const { data: sellerProfile } = useQuery({
    queryKey: ["seller-profile", product.sellerId],
    queryFn: () => getPublicProfile(product.sellerId),
  });

  const sellerName = sellerProfile?.name ?? "Vendedor";
  const sellerInitial = sellerName.charAt(0).toUpperCase();
  const [feedback, setFeedback] = useState<AddToCartFeedback>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const scheduleClear = (delay: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setFeedback("idle"), delay);
  };

  const handleAddToCart = useCallback(() => {
    if (!canAddToCart) return;
    setFeedback("loading");
    setErrorMsg("");
    addToCart.mutate(
      { productId: product.id, quantity },
      {
        onSuccess: () => {
          setFeedback("success");
          scheduleClear(2500);
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
          scheduleClear(3000);
        },
      }
    );
  }, [canAddToCart, addToCart, product.id, quantity]);

  const handleShare = useCallback(async () => {
    try {
      const res = await getProductShareLink(product.id);
      const url = res.data.url;
      await Share.share({
        title: product.title,
        message: `Mirá este producto\n${product.title} — $${product.price.toFixed(2)}\n\n${url}`,
        url,
      });
    } catch {
      // usuario canceló o producto no disponible
    }
  }, [product.id, product.title, product.price]);

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
          <ProductImageCarousel images={product.images ?? []} title={product.title} isOutOfStock={isOutOfStock} />

          <View style={[styles.topBarOverlay, { top: insets.top + spacing.sm }]}>
            <GlassButton icon="chevron-back" onPress={onBack} />
            <View style={styles.topBarRight}>
              <GlassButton
                icon={isWishlisted ? "heart" : "heart-outline"}
                iconColor={isWishlisted ? colors.brand[400] : colors.white}
                onPress={toggleWishlist}
              />
              {!isInactive && (
                <GlassButton
                  icon="share-social-outline"
                  onPress={() => {
                    void handleShare();
                  }}
                />
              )}
            </View>
          </View>

          {isInactive && (
            <ProductBadge isDisabled={isInactive} isOutOfStock={false} />
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
              {/* Si tiene foto la mostramos, sino mostramos la inicial */}
              {sellerProfile?.profile_picture_url ? (
                <Image 
                  source={{ uri: sellerProfile.profile_picture_url }} 
                  style={styles.sellerRowAvatarImage} 
                />
              ) : (
                <Text style={styles.sellerAvatarText}>
                  {sellerInitial}
                </Text>
              )}
            </View>
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerLabel}>Vendedor</Text>
              <Text style={styles.sellerName} numberOfLines={1}>
                {sellerName}
              </Text>
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
                onPress={() => setQuantity((q) => Math.min(maxToAdd, q + 1))}
                disabled={quantity >= maxToAdd || feedback === "loading"}
              >
                <Ionicons
                  name="add"
                  size={18}
                  color={quantity >= maxToAdd ? colors.gray[300] : colors.gray[700]}
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
            {isInactive ? "No disponible" : isOutOfStock ? "Sin stock" : "Ya tenés el máximo en el carrito"}
          </Button>
        )}
      </View>

      <SellerProfileModal
        sellerId={product.sellerId}
        currentProductId={product.id}
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
  currentProductId,
  visible,
  onClose,
}: {
  sellerId: string;
  currentProductId: string;
  visible: boolean;
  onClose: () => void;
}) {
  const navigation = useNavigation<any>();

  const { data: profileData, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["seller-profile", sellerId],
    queryFn: () => getPublicProfile(sellerId),
    enabled: visible,
    retry: false,
  });

  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["seller-products", sellerId],
    queryFn: () => apiGet<any>(`/catalog/products?seller_id=${sellerId}`),
    enabled: visible,
  });
  const isLoading = isLoadingProfile || isLoadingProducts;
  const otherProducts = (productsData?.data ?? productsData ?? [])
    .filter((p: any) => p.id !== currentProductId);

  const displayName = profileData?.name ?? "Vendedor";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Perfil del vendedor</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={22} color={colors.gray[500]} />
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <ActivityIndicator style={{ marginTop: 20 }} color={colors.brand[500]} />
            ) : (
              <>
                {/* Info del Vendedor */}
                <View style={styles.modalAvatarContainer}>
                  {profileData?.profile_picture_url ? (
                    <Image source={{ uri: profileData.profile_picture_url }} style={styles.modalAvatarImage} />
                  ) : (
                    <View style={styles.modalAvatar}>
                      <Text style={styles.modalAvatarText}>{displayName.charAt(0)}</Text>
                    </View>
                  )}
                  <Text style={styles.modalSellerName}>{displayName}</Text>

                  {profileData?.description && (
                    <Text style={styles.modalSellerDescription}>
                      {profileData.description}
                    </Text>
                  )}
                </View>
                {/*Seccion de Productos */}
                <View style={styles.otherProductsSection}>
                  <Text style={styles.sectionTitle}>Otras publicaciones del vendedor</Text>
                  
                  {otherProducts.length > 0 ? (
                    <View style={styles.miniGrid}>
                      {otherProducts.map((item: any) => (
                        <TouchableOpacity 
                          key={item.id} 
                          style={styles.miniCard}
                          onPress={() => {
                            onClose();
                            (navigation as any).push("ProductDetail", { productId: item.id });
                          }}
                          activeOpacity={0.8}
                        >
                          <Image source={{ uri: item.images[0] }} style={styles.miniImage} />
                          <View style={styles.miniInfo}>
                            {/* 👇 AHORA MOSTRAMOS EL TÍTULO */}
                            <Text style={styles.miniTitle} numberOfLines={2}>
                              {item.title}
                            </Text>
                            <Text style={styles.miniPrice}>${item.price}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.noMoreProducts}>No hay otras publicaciones activas.</Text>
                  )}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ProductImageCarousel({ images, title, isOutOfStock = false }: { images: string[]; title: string; isOutOfStock?: boolean }) {
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullImageUri, setFullImageUri] = useState<string | null>(null);
  const listRef = useRef<FlatList<string>>(null);
  const carouselImages = useMemo(() => (images.length > 0 ? images : [""]), [images]);

  function handleScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(nextIndex);
  }

  return (
    <View>
      <Modal visible={fullImageUri !== null} transparent animationType="fade" onRequestClose={() => setFullImageUri(null)}>
        <View style={styles.imageModalBg}>
          <Image source={{ uri: fullImageUri! }} style={styles.imageModalFull} resizeMode="contain" />
          <TouchableOpacity
            style={styles.imageModalClose}
            onPress={() => setFullImageUri(null)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={26} color={colors.white} />
          </TouchableOpacity>
        </View>
      </Modal>

      <FlatList
        ref={listRef}
        data={carouselImages}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => `${item || "placeholder"}-${index}`}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.heroImageFrame, { width }]}
            activeOpacity={item ? 0.85 : 1}
            onPress={() => { if (item) setFullImageUri(item); }}
          >
            {item ? (
              <Image source={{ uri: item }} style={styles.heroImage} resizeMode="cover" />
            ) : (
              <View style={styles.heroPlaceholder}>
                <Ionicons name="image-outline" size={48} color={colors.gray[300]} />
                <Text style={styles.heroPlaceholderText}>Sin imagen</Text>
              </View>
            )}
          </TouchableOpacity>
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

      {isOutOfStock && (
        <View style={styles.oosOverlay} pointerEvents="none">
          <View style={styles.oosBadge}>
            <Text style={styles.oosBadgeText}>Sin stock</Text>
          </View>
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
  imageModalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.76)",
    alignItems: "center",
    justifyContent: "center",
  },
  imageModalFull: {
    width: "100%",
    height: "100%",
  },
  imageModalClose: {
    position: "absolute",
    top: 52,
    right: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.gray[200],
  },

  // ── Out-of-stock carousel overlay ──
  oosOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.42)",
    alignItems: "center",
    justifyContent: "center",
  },
  oosBadge: {
    backgroundColor: colors.gray[500],
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  oosBadgeText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.white,
    letterSpacing: 0.5,
  },
  modalAvatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.gray[100],
  },
  modalSellerDescription: {
    fontSize: typography.size.sm,
    color: colors.gray[700],
    textAlign: "center",
    lineHeight: 20,
    marginTop: -spacing.sm,
    paddingHorizontal: spacing.md,
  },
  sellerRowAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray[100],
  },
  sellerLabel: {
    fontSize: 12,
    color: colors.gray[500],
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bioContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray[100], // Fondo sutil
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    marginTop: spacing.sm,
    marginHorizontal: spacing.xl, // Para que no toque los bordes de la pantalla
  },
  bioIcon: {
    marginRight: 8,
  },

  // --- Estilos de los Productos ---
  otherProductsSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  miniGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between", // Espacia las tarjetas automáticamente
    gap: 12,
  },
  miniCard: {
    width: '48%', // Entran exactamente 2 por fila con espacio en el medio
    backgroundColor: colors.white,
    borderRadius: 12, // Bordes más redondeados
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.gray[200],
    marginBottom: 4,
  },
  miniImage: {
    width: "100%",
    height: 140, // Imagen más alta para lucir el producto
    backgroundColor: colors.gray[50],
    resizeMode: "cover",
  },
  miniInfo: {
    padding: spacing.sm,
    gap: 4,
  },
  miniTitle: {
    fontSize: 13,
    color: colors.gray[700],
    lineHeight: 18,
    minHeight: 36, // Mantiene la altura aunque el texto sea de 1 sola línea
  },
  miniPrice: {
    fontSize: 16, // Precio más destacado
    fontWeight: "bold",
    color: colors.gray[900],
  },
  noMoreProducts: {
    fontSize: 14,
    color: colors.gray[400],
    textAlign: "center",
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
});
