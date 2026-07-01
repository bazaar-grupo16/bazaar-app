import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotifications,
  type Notification,
} from "@/entities/notification";
import type { RootStackParamList } from "@/navigation";
import { colors, radius, spacing, typography } from "@/shared/styles";

const SCREEN_W = Dimensions.get("window").width;
const PANEL_W = Math.round(SCREEN_W * 0.82);

interface Props {
  visible: boolean;
  onClose: () => void;
}

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

export function NotificationsPanel({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(PANEL_W)).current;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { data, isLoading, isRefetching, refetch, isError } = useNotifications(50, 0);
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };
  const markRead = useMarkNotificationAsRead();
  const markAllRead = useMarkAllNotificationsAsRead();

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 220,
      }).start();
    } else {
      slideAnim.setValue(PANEL_W);
    }
  }, [visible, slideAnim]);

  function handleClose() {
    Animated.timing(slideAnim, {
      toValue: PANEL_W,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onClose());
  }

  const handlePress = useCallback(
    (item: Notification) => {
      if (!item.is_read) {
        markRead.mutate(item.id);
      }
      const deepLink = item.payload.deep_link;
      if (!deepLink) return;
      Animated.timing(slideAnim, {
        toValue: PANEL_W,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        onClose();
        const orderMatch = deepLink.match(/orders\/([^/?#]+)/);
        if (orderMatch?.[1]) {
          navigation.navigate("OrderDetail", { orderId: orderMatch[1] });
          return;
        }
        const productMatch = deepLink.match(/(?:seller\/)?products\/([^/?#]+)/);
        if (productMatch?.[1]) {
          navigation.navigate("ProductDetail", { productId: productMatch[1] });
        }
      });
    },
    [markRead, navigation, onClose, slideAnim],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

        <Animated.View
          style={[
            styles.panel,
            { paddingTop: insets.top, paddingBottom: insets.bottom },
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Notificaciones</Text>
              {!!data?.total && (
                <Text style={styles.subtitle}>{data.total} en tu historial</Text>
              )}
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.markAllButton}
                onPress={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
              >
                <Text style={styles.markAllText}>Leer todas</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleClose}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              >
                <Ionicons name="close" size={22} color={colors.gray[700]} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          {isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.brand[500]} />
            </View>
          ) : isError ? (
            <View style={styles.centered}>
              <Ionicons name="cloud-offline-outline" size={48} color={colors.gray[300]} />
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
                  <View style={styles.emptyIcon}>
                    <Ionicons name="notifications-off-outline" size={32} color={colors.gray[400]} />
                  </View>
                  <Text style={styles.emptyTitle}>Sin notificaciones</Text>
                  <Text style={styles.emptyText}>
                    Cuando haya novedades sobre tus compras o publicaciones, las vas a ver acá.
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
                    <Ionicons name={getIcon(item.type)} size={20} color={colors.brand[600]} />
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
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  backdrop: {
    flex: 1,
  },
  panel: {
    width: PANEL_W,
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  headerTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: colors.gray[500],
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  markAllButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.md,
    backgroundColor: colors.brand[50],
  },
  markAllText: {
    fontSize: 12,
    color: colors.brand[700],
    fontWeight: typography.weight.semibold,
  },
  listContent: {
    padding: spacing.sm,
    gap: spacing.xs,
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.gray[100],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
    textAlign: "center",
  },
  emptyText: {
    fontSize: typography.size.sm,
    color: colors.gray[400],
    textAlign: "center",
    lineHeight: 20,
  },
  retryButton: {
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
    gap: spacing.sm,
    padding: spacing.sm,
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
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[100],
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  cardTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.brand[500],
  },
  cardText: {
    marginTop: 2,
    fontSize: 12,
    color: colors.gray[600],
    lineHeight: 17,
  },
  cardDate: {
    marginTop: spacing.xs,
    color: colors.gray[400],
    fontSize: 11,
  },
});
