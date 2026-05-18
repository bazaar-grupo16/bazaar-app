import { View, Text, StyleSheet } from "react-native";

interface Props {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

export function EmptyState({ icon, title, subtitle }: Props) {
  return (
    <View style={styles.container}>
      {icon}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 48,
  },
  title: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
    marginTop: 12,
  },
  subtitle: {
    fontSize: 13,
    color: "#9ca3af",
    marginTop: 4,
  },
});
