import { useCallback } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import type { RootStackParamList } from "@/navigation";
import { useOrdersHistory, type OrderResponse } from "@/entities/order";
import { colors, spacing, typography, radius } from "@/shared/styles";

export function OrdersPage() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { data, isLoading, isRefetching, refetch } = useOrdersHistory(1, 50);

  const orders = data?.orders ?? [];

  const renderItem = useCallback(
    ({ item }: { item: OrderResponse }) => {
      const date = new Date(item.created_at).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      return (
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate("OrderDetail", { orderId: item.order_id })}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.orderId}>#{item.order_id.split("-")[0]}</Text>
            <Text style={styles.orderDate}>{date}</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.orderStatus}>{item.status.replace(/_/g, " ")}</Text>
            <Text style={styles.orderTotal}>${item.total_amount.toFixed(2)}</Text>
          </View>
        </TouchableOpacity>
      );
    },
    [navigation]
  );

  return (
    <View style={[styles.fill, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Mis Órdenes</Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.brand[500]} />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="cube-outline" size={64} color={colors.gray[300]} />
          <Text style={styles.emptyTitle}>Todavía no tenés pedidos</Text>
          <Text style={styles.emptyText}>
            Cuando realices una compra, tus pedidos van a aparecer acá.
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.order_id}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + spacing.md }]}
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
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
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  pageTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.gray[900],
    textAlign: "center",
  },
  emptyText: {
    fontSize: typography.size.md,
    color: colors.gray[500],
    textAlign: "center",
    lineHeight: 22,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
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
  cardBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderStatus: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.brand[600],
  },
  orderTotal: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
  },
});
