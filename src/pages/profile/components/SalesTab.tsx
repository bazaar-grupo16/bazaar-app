import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSalesHistory } from "@/entities/order";
import type { OrderResponse } from "@/entities/order";
import { colors, spacing, typography, radius } from "@/shared/styles";

export function SalesTab() {
  const { data, isLoading, isError, refetch, isRefetching } = useSalesHistory();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="small" color={colors.brand[500]} />
        <Text style={styles.helperText}>Cargando ventas...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Ionicons name="cloud-offline-outline" size={40} color={colors.gray[300]} />
        <Text style={styles.errorText}>No se pudieron cargar las ventas</Text>
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

  const sales = data?.orders ?? [];

  if (sales.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="storefront-outline" size={40} color={colors.gray[300]} />
        <Text style={styles.emptyTitle}>Todavía no tenés ventas</Text>
        <Text style={styles.helperText}>Cuando alguien compre tus productos, aparecerán acá</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={sales}
      keyExtractor={(item) => item.order_id}
      contentContainerStyle={styles.list}
      scrollEnabled={false}
      renderItem={({ item }) => <SaleCard sale={item} />}
    />
  );
}

function SaleCard({ sale }: { sale: OrderResponse }) {
  const date = new Date(sale.created_at).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const firstItem = sale.items[0];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderId}>#{sale.order_id.split("-")[0]}</Text>
        <Text style={styles.orderDate}>{date}</Text>
      </View>
      {firstItem && (
        <Text style={styles.productName} numberOfLines={1}>
          {firstItem.product_name}
          {sale.items.length > 1 ? ` +${sale.items.length - 1} más` : ""}
        </Text>
      )}
      <View style={styles.cardFooter}>
        <Text style={styles.orderStatus}>{sale.status.replace(/_/g, " ")}</Text>
        <Text style={styles.orderTotal}>${sale.total_amount.toFixed(2)}</Text>
      </View>
    </View>
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
  list: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
    gap: spacing.xs,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  orderId: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
  },
  orderDate: {
    fontSize: typography.size.sm,
    color: colors.gray[500],
  },
  productName: {
    fontSize: typography.size.sm,
    color: colors.gray[600],
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  orderStatus: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: "#22c55e",
  },
  orderTotal: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
  },
});
