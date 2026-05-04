import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Tab } from "../types";

interface Props {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const TABS: Tab[] = ["publicaciones", "favoritos"];

export function ProfileTabs({ activeTab, onTabChange }: Props) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => (
        <TouchableOpacity
          key={tab}
          style={styles.tabBtn}
          onPress={() => onTabChange(tab)}
          activeOpacity={0.7}
        >
          <Text style={[styles.label, activeTab === tab && styles.labelActive]}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
          {activeTab === tab && <View style={styles.indicator} />}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingHorizontal: 20,
    marginTop: 8,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    position: "relative",
  },
  label: {
    fontSize: 13,
    fontWeight: "400",
    color: "#9ca3af",
  },
  labelActive: {
    fontWeight: "600",
    color: "#f97316",
  },
  indicator: {
    position: "absolute",
    bottom: 0,
    left: "25%",
    right: "25%",
    height: 2,
    backgroundColor: "#f97316",
    borderRadius: 99,
  },
});
