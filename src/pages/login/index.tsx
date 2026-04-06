import { useState } from "react";
import { View, Text, TextInput, Image, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation";
import { Button } from "@/shared/ui";
import { colors, typography, spacing, radius } from "@/shared/styles";

const HARDCODED_EMAIL = "admin@bazaar.com";
const HARDCODED_PASSWORD = "1234";

export function LoginPage() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, "Login">>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleLogin() {
    if (email === HARDCODED_EMAIL && password === HARDCODED_PASSWORD) {
      navigation.replace("Tabs");
    } else {
      setError("Credenciales incorrectas");
    }
  }

  return (
    <View style={styles.container}>
      <Image source={require("../../../assets/icon.png")} style={styles.logo} resizeMode="contain" />

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button style={styles.button} onPress={handleLogin}>
        Ingresar
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.white,
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: "center",
    marginBottom: spacing.xl,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: radius.md,
    padding: spacing.md - 4,
    marginBottom: spacing.md,
    fontSize: typography.size.md,
  },
  error: {
    color: colors.error,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  button: {
    marginTop: spacing.sm,
  },
});
