import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Stat } from "../types";

const USER_AVATAR =
  "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=200&q=80";

const STATS: Stat[] = [
  { label: "Publicaciones", value: "2",  color: "#f97316" },
  { label: "Ventas",        value: "18", color: "#22c55e" },
  { label: "Compras",       value: "6",  color: "#3b82f6" },
];

interface Props {
  onEditPress?: (() => void) | undefined;
  onSettingsPress?: (() => void) | undefined;
}

export function ProfileHeader({ onEditPress, onSettingsPress }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>

      {/* Título + botones */}
      <View style={styles.topRow}>
        <Text style={styles.title}>Mi perfil</Text>
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.iconBtn} onPress={onEditPress}>
            <Ionicons name="create-outline" size={16} color="#4b5563" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={onSettingsPress}>
            <Ionicons name="settings-outline" size={16} color="#4b5563" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Avatar + info */}
      <View style={styles.userRow}>
        <View>
          <Image source={{ uri: USER_AVATAR }} style={styles.avatar} />
          <View style={styles.onlineDot} />
        </View>

        <View style={styles.userDetails}>
          <Text style={styles.userName}>Mia García</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={13} color="#fbbf24" />
            <Text style={styles.ratingText}>4.9 · Miembro desde mar 2024</Text>
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={13} color="#9ca3af" />
            <Text style={styles.locationText}>Palermo, Buenos Aires</Text>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {STATS.map((s) => (
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
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  buttons: {
    flexDirection: "row",
    gap: 8,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#4ade80",
    borderWidth: 2,
    borderColor: "#fff",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 13,
    color: "#4b5563",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    color: "#9ca3af",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 2,
  },
});
