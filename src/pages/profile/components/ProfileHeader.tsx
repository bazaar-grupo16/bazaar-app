import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, spacing, radius } from "@/shared/styles";
import { Stat } from "../types";

interface Props {
  name?: string;
  bio?: string | null;
  avatarUrl?: string | null;
  publicationsCount: number;
  salesCount: number;
  purchasesCount: number;
  onEditPress?: (() => void) | undefined;
  onSettingsPress?: (() => void) | undefined;
}

export function ProfileHeader({ name, bio, avatarUrl, publicationsCount, salesCount, purchasesCount, onEditPress, onSettingsPress }: Props) {
  const insets = useSafeAreaInsets();

  const stats: Stat[] = [
    { label: "Publicaciones", value: String(publicationsCount), color: colors.brand[500] },
    { label: "Ventas",        value: String(salesCount),        color: "#22c55e" },
    { label: "Compras",       value: String(purchasesCount),    color: "#3b82f6" },
  ];

  const displayName = name ?? "Usuario";
  const displayInitial = name ? name.charAt(0).toUpperCase() : "U";

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
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarInitial}>{displayInitial}</Text>
          )}
        </View>

        <View style={styles.userDetails}>
          <Text style={styles.userName}>{displayName}</Text>
          
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={13} color="#fbbf24" />
            <Text style={styles.ratingText}>4.9 · Miembro desde mar 2024</Text>
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={13} color={colors.gray[400]} />
            <Text style={styles.locationText}>Palermo, Buenos Aires</Text>
          </View>

          {bio && (
            <Text style={styles.bioText}>{bio}</Text>
          )}
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
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
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
  bioText: {
    fontSize: 13,
    color: colors.gray[700],
    marginTop: 4,
    fontStyle: "italic",
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