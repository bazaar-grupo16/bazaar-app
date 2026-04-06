import { View, Text, StyleSheet } from "react-native";
import { colors, typography } from "@/shared/styles";

export function CartPage() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Página de carrito</Text>
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
  text: {
    fontSize: typography.size.lg,
    color: colors.gray[700],
  },
});
