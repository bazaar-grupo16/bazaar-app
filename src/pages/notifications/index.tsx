import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import {
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotifications,
  type Notification,
} from "@/entities/notification";
import type { RootStackParamList } from "@/navigation";
import { useAuthStore } from "@/shared/auth";
import { colors, radius, spacing, typography } from "@/shared/styles";

function formatDate(value: string) {
  return new Date(value).toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getIcon(type: string): keyof typeof Ionicons.glyphMap {
  if (type === "low_stock") return "alert-circle-outline";
  if (type === "out_of_stock") return "close-circle-outline";
  return "cube-outline";
}

export function NotificationsPage() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isGuest = !useAuthStore((s) => s.accessToken);
  const { data, isLoading, isRefetching, refetch, isError } = useNotifications(50, 0);
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };
  const markRead = useMarkNotificationAsRead();
  const markAllRead = useMarkAllNotificationsAsRead();

  const navigateFromDeepLink = useCallback(
    (deepLink: string | undefined) => {
      if (!deepLink) return;
      const orderMatch = deepLink.match(/orders\/([^/?#]+)/);
      if (orderMatch?.[1]) {
        navigation.navigate("OrderDetail", { orderId: orderMatch[1] });
        return;
      }
      const productMatch = deepLink.match(/(?:seller\/)?products\/([^/?#]+)/);
      if (productMatch?.[1]) {
        navigation.navigate("ProductDetail", { productId: productMatch[1] });
      }
    },
    [navigation],
  );

  const handlePress = useCallback(
    (item: Notification) => {
      if (!item.is_read) {
        markRead.mutate(item.id);
      }
      navigateFromDeepLink(item.payload.deep_link);
    },
    [markRead, navigateFromDeepLink],
  );

  if (isGuest) {
    return (
      <View style={styles.fill}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.pageTitle}>Notificaciones</Text>
        </View>
        <View style={styles.centered}>
          <Ionicons name="notifications-outline" size={60} color={colors.gray[300]} />
          <Text style={styles.emptyTitle}>Iniciá sesión</Text>
          <Text style={styles.emptyText}>
            Accedé con tu cuenta para ver tus notificaciones.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.pageTitle}>Notificaciones</Text>
          <Text style={styles.subtitle}>
            {data?.total ? `${data.total} en tu historial` : "Tu actividad reciente"}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.markAllButton}
          onPress={() => markAllRead.mutate()}
          disabled={markAllRead.isPending}
        >
          <Text style={styles.markAllText}>Leer todas</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.brand[500]} />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={56} color={colors.gray[300]} />
          <Text style={styles.emptyTitle}>No pudimos cargar tus notificaciones</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => void refetch()}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.brand[500]}
            />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="notifications-outline" size={56} color={colors.gray[300]} />
              <Text style={styles.emptyTitle}>Sin notificaciones</Text>
              <Text style={styles.emptyText}>
                Cuando haya novedades de tus compras o publicaciones, van a aparecer acá.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, !item.is_read && styles.unreadCard]}
              onPress={() => handlePress(item)}
              activeOpacity={0.8}
            >
              <View style={styles.iconWrap}>
                <Ionicons name={getIcon(item.type)} size={22} color={colors.brand[600]} />
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                  {!item.is_read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.cardText} numberOfLines={2}>{item.body}</Text>
                <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
              </View>
            </TouchableOpacity>
          )}
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
  },
  subtitle: {
    marginTop: 2,
    color: colors.gray[500],
    fontSize: 13,
  },
  markAllButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.brand[50],
  },
  markAllText: {
    color: colors.brand[700],
    fontWeight: typography.weight.semibold,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    marginTop: spacing.md,
    fontSize: 18,
    fontWeight: typography.weight.bold,
    color: colors.gray[800],
    textAlign: "center",
  },
  emptyText: {
    marginTop: spacing.xs,
    color: colors.gray[500],
    textAlign: "center",
    lineHeight: 20,
  },
  retryButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.brand[500],
    borderRadius: radius.md,
  },
  retryText: {
    color: colors.white,
    fontWeight: typography.weight.semibold,
  },
  card: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  unreadCard: {
    borderColor: colors.brand[200],
    backgroundColor: colors.brand[50],
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  cardBody: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand[500],
  },
  cardText: {
    marginTop: 4,
    color: colors.gray[600],
    lineHeight: 19,
  },
  cardDate: {
    marginTop: spacing.sm,
    color: colors.gray[400],
    fontSize: 12,
  },
});
