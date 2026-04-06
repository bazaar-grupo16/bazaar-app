import { View, Text, StyleSheet } from "react-native";
import { colors, typography } from "@/shared/styles";

export function HomePage() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>¡Bienvenido a Bazaar!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
  },
});
