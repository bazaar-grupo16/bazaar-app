import { useState } from "react";
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSalesHistory } from "@/entities/order";
import type { OrderResponse, OrderStatus } from "@/entities/order";
import type { RootStackParamList } from "@/navigation";
import { colors, spacing, typography, radius } from "@/shared/styles";

type FilterOption = { label: string; value: OrderStatus | null };

const FILTERS: FilterOption[] = [
  { label: "Todas", value: null },
  { label: "Confirmada", value: "CONFIRMADA" },
  { label: "En preparación", value: "EN_PREPARACION" },
  { label: "Enviada", value: "ENVIADA" },
  { label: "Entregada", value: "ENTREGADA" },
  { label: "Cancelada", value: "CANCELADA" },
];

export function SalesTab() {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null);

  const { data, isLoading, isError, refetch, isRefetching } = useSalesHistory(1, 50, selectedStatus ?? undefined);

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

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {FILTERS.map((f) => {
          const active = selectedStatus === f.value;
          return (
            <TouchableOpacity
              key={f.label}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setSelectedStatus(f.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {sales.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="storefront-outline" size={40} color={colors.gray[300]} />
          <Text style={styles.emptyTitle}>
            {selectedStatus ? "Sin ventas en este estado" : "Todavía no tenés ventas"}
          </Text>
          <Text style={styles.helperText}>
            {selectedStatus
              ? "Probá con otro filtro"
              : "Cuando alguien compre tus productos, aparecerán acá"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={sales}
          keyExtractor={(item) => item.order_id}
          contentContainerStyle={styles.list}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <SaleCard sale={item} />
          )}
        />
      )}
    </View>
  );
}

function SaleCard({ sale }: { sale: OrderResponse }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const date = new Date(sale.created_at).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const firstItem = sale.items[0];

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("OrderDetail", { orderId: sale.order_id, fromSales: true })}
      activeOpacity={0.8}
    >
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
  filters: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.white,
  },
  chipActive: {
    backgroundColor: colors.brand[500],
    borderColor: colors.brand[500],
  },
  chipText: {
    fontSize: typography.size.sm,
    color: colors.gray[600],
    fontWeight: typography.weight.semibold,
  },
  chipTextActive: {
    color: colors.white,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
    gap: spacing.xs,
    shadowColor: "#000",
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
  footerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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
