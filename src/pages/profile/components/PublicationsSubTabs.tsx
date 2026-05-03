import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, typography, spacing, radius } from "@/shared/styles";
import type { PublicationsSubTab } from "../types";

interface TabConfig {
  key: PublicationsSubTab;
  label: string;
  count: number;
}

interface Props {
  activeTab: PublicationsSubTab;
  counts: { activas: number; inactivas: number; sinStock: number };
  onTabChange: (tab: PublicationsSubTab) => void;
}

export function PublicationsSubTabs({ activeTab, counts, onTabChange }: Props) {
  const tabs: TabConfig[] = [
    { key: "activas",    label: "ACTIVAS",    count: counts.activas },
    { key: "inactivas",  label: "INACTIVAS",  count: counts.inactivas },
    { key: "sin-stock",  label: "SIN STOCK",  count: counts.sinStock },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onTabChange(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
            <View style={[styles.badge, isActive && styles.badgeActive]}>
              <Text style={[styles.badgeText, isActive && styles.badgeTextActive]}>
                {tab.count}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    paddingHorizontal: spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: colors.brand[500],
  },
  label: {
    fontSize: 11,
    fontWeight: typography.weight.semibold,
    color: colors.gray[400],
    letterSpacing: 0.4,
  },
  labelActive: {
    color: colors.brand[500],
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: radius.sm,
    backgroundColor: colors.gray[100],
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeActive: {
    backgroundColor: colors.brand[50],
  },
  badgeText: {
    fontSize: 10,
    fontWeight: typography.weight.bold,
    color: colors.gray[500],
  },
  badgeTextActive: {
    color: colors.brand[600],
  },
});
