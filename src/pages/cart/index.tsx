import { useCallback } from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import {
  useCart,
  useRemoveCartItem,
  useClearCart,
  useIncrementCartItem,
  useDecrementCartItem,
  type CartItem,
} from "@/entities/cart";
import { Button } from "@/shared/ui";
import { colors, spacing, typography, radius } from "@/shared/styles";
import { CartItemCard } from "./components/CartItemCard";
import { CartSummary } from "./components/CartSummary";
import { useCheckoutStore } from "@/entities/order/model/store";
import { useAuthStore } from "@/shared/auth";
import type { RootStackParamList } from "@/navigation";

export function CartPage() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isGuest = !useAuthStore((s) => s.accessToken);
  const { data, error, isLoading, isRefetching, refetch } = useCart();
  const removeMutation = useRemoveCartItem();
  const clearMutation = useClearCart();
  const incrementMutation = useIncrementCartItem();
  const decrementMutation = useDecrementCartItem();
  const clearIdempotencyKey = useCheckoutStore((s) => s.clearIdempotencyKey);

  const cart = data?.data;
  const items = cart?.items ?? [];

  const mutatingProductIds = new Set<string>();
  if (removeMutation.isPending && typeof removeMutation.variables === "string") {
    mutatingProductIds.add(removeMutation.variables);
  }
  if (incrementMutation.isPending && incrementMutation.variables) {
    mutatingProductIds.add(incrementMutation.variables.productId);
  }
  if (decrementMutation.isPending && decrementMutation.variables) {
    mutatingProductIds.add(decrementMutation.variables.productId);
  }

  const renderItem = useCallback(
    ({ item }: { item: CartItem }) => (
      <CartItemCard
        item={item}
        isUpdating={mutatingProductIds.has(item.productId)}
        onIncrement={() =>
          incrementMutation.mutate({ productId: item.productId, quantity: 1 })
        }
        onDecrement={() =>
          decrementMutation.mutate({ productId: item.productId, quantity: 1 })
        }
        onRemove={() => removeMutation.mutate(item.productId)}
      />
    ),
    [mutatingProductIds, incrementMutation, decrementMutation, removeMutation],
  );

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title}>Mi Carrito</Text>
    </View>
  );

  // --- Guest ---
  if (isGuest) {
    return (
      <View style={styles.fill}>
        {header}
        <View style={styles.centered}>
          <Ionicons name="cart-outline" size={64} color={colors.gray[300]} />
          <Text style={styles.emptyTitle}>Iniciá sesión para ver tu carrito</Text>
          <Text style={styles.helperText}>
            Con tu cuenta podés agregar productos y realizar compras.
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate("Login" as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.loginButtonText}>Iniciar sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- Loading ---
  if (isLoading) {
    return (
      <View style={styles.fill}>
        {header}
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.brand[500]} />
          <Text style={styles.helperText}>Cargando carrito...</Text>
        </View>
      </View>
    );
  }

  // --- Error ---
  if (error) {
    return (
      <View style={styles.fill}>
        {header}
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorTitle}>No se pudo cargar el carrito</Text>
          <Text style={styles.helperText}>
            Ocurrió un error al conectarse con el servidor. Intentá de nuevo.
          </Text>
          <Button onPress={() => void refetch()} loading={isRefetching}>
            Reintentar
          </Button>
        </View>
      </View>
    );
  }

  // --- Empty cart ---
  if (items.length === 0) {
    clearIdempotencyKey();
    return (
      <View style={styles.fill}>
        {header}
        <View style={styles.centered}>
          <Ionicons name="cart-outline" size={64} color={colors.gray[300]} />
          <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
          <Text style={styles.helperText}>
            Explorá el catálogo y agregá productos para comenzar.
          </Text>
        </View>
      </View>
    );
  }

  // --- Cart with items ---
  return (
    <View style={styles.fill}>
      {header}
      <FlatList
        contentContainerStyle={styles.listContent}
        data={items}
        keyExtractor={(item) => String(item.productId)}
        renderItem={renderItem}
        refreshing={isRefetching}
        onRefresh={() => void refetch()}
      />

      {cart && (
        <CartSummary
          totalPrice={cart.totalPrice}
          itemCount={items.length}
          onClear={() => {
            clearMutation.mutate();
            clearIdempotencyKey();
          }}
          isClearing={clearMutation.isPending}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.xl,
  },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  title: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.md,
    flexGrow: 1,
  },
  helperText: {
    fontSize: typography.size.md,
    color: colors.gray[500],
    textAlign: "center",
  },
  errorTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.gray[900],
  },
  emptyTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.gray[700],
  },
  loginButton: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    backgroundColor: colors.brand[500],
    borderRadius: radius.md,
  },
  loginButtonText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.white,
  },
});
