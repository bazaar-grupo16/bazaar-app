import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useProducts } from "@/entities/product";
import type { TabsParamList } from "@/navigation/TabsNavigator";
import { colors, spacing, typography } from "@/shared/styles";
import { ProductCard } from "@/pages/search";

type HomeNavProp = BottomTabNavigationProp<TabsParamList, "Home">;

export function HomePage() {
  const navigation = useNavigation<HomeNavProp>();
  const { data, isLoading } = useProducts({ limit: 6, sortBy: "created_at", order: "desc" });

  const recentProducts = data?.data ?? [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Bazaar</Text>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Productos recientes</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Search")}>
          <Text style={styles.seeAll}>Ver todos</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.brand[500]} />
          <Text style={styles.loadingText}>Cargando productos...</Text>
        </View>
      ) : recentProducts.length === 0 ? (
        <Text style={styles.emptyText}>No hay productos disponibles.</Text>
      ) : (
        <View style={styles.productList}>
          {recentProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onPress={() =>
                navigation.getParent()?.navigate("ProductDetail", { productId: product.id })
              }
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  pageTitle: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.brand[500],
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.gray[900],
  },
  seeAll: {
    fontSize: typography.size.sm,
    color: colors.brand[500],
    fontWeight: typography.weight.semibold,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    justifyContent: "center",
    paddingVertical: spacing.xl,
  },
  loadingText: {
    fontSize: typography.size.md,
    color: colors.gray[500],
  },
  emptyText: {
    fontSize: typography.size.md,
    color: colors.gray[500],
    textAlign: "center",
    paddingVertical: spacing.xl,
  },
  productList: {
    gap: spacing.md,
  },
});
