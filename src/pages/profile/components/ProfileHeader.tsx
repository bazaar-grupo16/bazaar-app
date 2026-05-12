import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, spacing, radius } from "@/shared/styles";
import { Stat } from "../types";

const USER_NAME    = "user_name";
const USER_INITIAL = "U";

interface Props {
  publicationsCount: number;
  salesCount: number;
  purchasesCount: number;
  onEditPress?: (() => void) | undefined;
  onSettingsPress?: (() => void) | undefined;
}

export function ProfileHeader({ publicationsCount, salesCount, purchasesCount, onEditPress, onSettingsPress }: Props) {
  const insets = useSafeAreaInsets();

  const stats: Stat[] = [
    { label: "Publicaciones", value: String(publicationsCount), color: colors.brand[500] },
    { label: "Ventas",        value: String(salesCount),        color: "#22c55e" },
    { label: "Compras",       value: String(purchasesCount),    color: "#3b82f6" },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>

      {/* Título + botones */}
      <View style={styles.topRow}>
        <Text style={styles.title}>Mi perfil</Text>
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.iconBtn} onPress={onEditPress}>
            <Ionicons name="create-outline" size={22} color={colors.gray[700]} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={onSettingsPress}>
            <Ionicons name="settings-outline" size={22} color={colors.gray[700]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Avatar + info */}
      <View style={styles.userRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>{USER_INITIAL}</Text>
        </View>

        <View style={styles.userDetails}>
          <Text style={styles.userName}>{USER_NAME}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={13} color="#fbbf24" />
            <Text style={styles.ratingText}>4.9 · Miembro desde mar 2024</Text>
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={13} color={colors.gray[400]} />
            <Text style={styles.locationText}>Palermo, Buenos Aires</Text>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {stats.map((s) => (
          <View key={s.label} style={styles.statBox}>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
  },
  buttons: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.gray[100],
    alignItems: "center",
    justifyContent: "center",
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.brand[500],
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    color: colors.white,
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: typography.size.sm,
    color: colors.gray[500],
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    color: colors.gray[400],
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.gray[50],
    borderRadius: radius.lg,
    paddingVertical: 12,
    alignItems: "center",
  },
  statValue: {
    fontSize: typography.size.lg,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: typography.weight.semibold,
    color: colors.gray[400],
    textAlign: "center",
    marginTop: 2,
  },
});

