import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing, typography } from "@/shared/styles";

const SCREEN_W = Dimensions.get("window").width;
const PANEL_W = Math.round(SCREEN_W * 0.82);

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function NotificationsPanel({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(PANEL_W)).current;

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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Tap backdrop to close */}
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

        {/* Slide-in panel */}
        <Animated.View
          style={[
            styles.panel,
            { paddingTop: insets.top, paddingBottom: insets.bottom },
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Notificaciones</Text>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            >
              <Ionicons name="close" size={22} color={colors.gray[700]} />
            </TouchableOpacity>
          </View>

          {/* Empty state */}
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="notifications-off-outline" size={32} color={colors.gray[400]} />
            </View>
            <Text style={styles.emptyTitle}>Sin notificaciones</Text>
            <Text style={styles.emptyText}>
              Cuando haya novedades sobre tus compras o publicaciones, las vas a ver acá.
            </Text>
          </View>
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
    backgroundColor: "transparent",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  panel: {
    width: PANEL_W,
    backgroundColor: colors.white,
    shadowColor: colors.black,
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
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
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
});
