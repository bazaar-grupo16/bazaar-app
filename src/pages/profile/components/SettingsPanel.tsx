import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  ScrollView,
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
  onSignOut: () => void;
}

const SETTINGS_ITEMS: Array<{ icon: keyof typeof Ionicons.glyphMap; label: string }> = [
  { icon: "person-outline",       label: "Datos de cuenta" },
  { icon: "shield-checkmark-outline", label: "Privacidad y seguridad" },
  { icon: "notifications-outline", label: "Notificaciones" },
  { icon: "help-circle-outline",  label: "Ayuda y soporte" },
];

export function SettingsPanel({ visible, onClose, onSignOut }: Props) {
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

  function handleSignOut() {
    handleClose();
    setTimeout(onSignOut, 220);
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
            <Text style={styles.headerTitle}>Configuración</Text>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            >
              <Ionicons name="close" size={22} color={colors.gray[700]} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Settings items */}
            <View style={styles.section}>
              {SETTINGS_ITEMS.map((item, index) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.row,
                    index < SETTINGS_ITEMS.length - 1 && styles.rowBorder,
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={styles.rowLeft}>
                    <View style={styles.rowIcon}>
                      <Ionicons name={item.icon} size={18} color={colors.gray[500]} />
                    </View>
                    <Text style={styles.rowLabel}>{item.label}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.gray[300]} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Sign out */}
            <View style={styles.section}>
              <TouchableOpacity style={styles.row} onPress={handleSignOut} activeOpacity={0.7}>
                <View style={styles.rowLeft}>
                  <View style={[styles.rowIcon, styles.rowIconDanger]}>
                    <Ionicons name="log-out-outline" size={18} color={colors.error} />
                  </View>
                  <Text style={[styles.rowLabel, styles.rowLabelDanger]}>Cerrar sesión</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.gray[300]} />
              </TouchableOpacity>
            </View>
          </ScrollView>
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
  content: {
    flex: 1,
    paddingTop: spacing.md,
  },
  section: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.gray[100],
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: colors.gray[50],
    alignItems: "center",
    justifyContent: "center",
  },
  rowIconDanger: {
    backgroundColor: "#fef2f2",
  },
  rowLabel: {
    fontSize: typography.size.sm,
    color: colors.gray[700],
    fontWeight: typography.weight.semibold,
  },
  rowLabelDanger: {
    color: colors.error,
  },
});
