import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  PIN_MIN_LENGTH,
  skipPinUnlockForCurrentLaunch,
  unlockAuthSessionWithPin,
} from "@/shared/auth";
import { colors, radius, spacing, typography } from "@/shared/styles";

export function PinUnlockPage() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleUnlock() {
    if (pin.length < PIN_MIN_LENGTH) {
      setError(`El PIN debe tener al menos ${PIN_MIN_LENGTH} dígitos.`);
      return;
    }

    try {
      setError("");
      setIsLoading(true);
      const result = await unlockAuthSessionWithPin(pin);

      if (result.ok) return;

      if (result.reason === "locked") {
        const minutes = result.lockedUntil
          ? Math.max(1, Math.ceil((result.lockedUntil.getTime() - Date.now()) / 60000))
          : 5;
        setError(`PIN bloqueado temporalmente. Intentá de nuevo en ${minutes} min o ingresá con email.`);
        return;
      }

      if (result.reason === "invalid_pin") {
        setPin("");
        setError(
          result.remainingAttempts
            ? `PIN incorrecto. Te quedan ${result.remainingAttempts} intentos.`
            : "PIN incorrecto.",
        );
        return;
      }

      setError("No se pudo recuperar la sesión. Ingresá con email y contraseña.");
    } catch (err) {
      setError("No se pudo validar el PIN. Probá con email y contraseña.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconBox}>
          <Ionicons name="keypad-outline" size={30} color={colors.brand[600]} />
        </View>
        <Text style={styles.title}>Ingresá tu PIN</Text>
        <Text style={styles.subtitle}>
          Usá el PIN configurado en este dispositivo para entrar rápido a Bazaar.
        </Text>

        <TextInput
          value={pin}
          onChangeText={(value) => {
            setPin(value.replace(/\D/g, ""));
            setError("");
          }}
          placeholder="PIN"
          placeholderTextColor={colors.gray[300]}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={12}
          style={styles.input}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.primaryButton, isLoading && styles.disabledButton]}
          onPress={handleUnlock}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Entrar con PIN</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={skipPinUnlockForCurrentLaunch}
          activeOpacity={0.75}
        >
          <Text style={styles.secondaryButtonText}>Usar email y contraseña</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.gray[50],
    padding: spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.gray[100],
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.md,
  },
  iconBox: {
    width: 58,
    height: 58,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brand[50],
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.gray[500],
    lineHeight: 20,
    textAlign: "center",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: typography.size.lg,
    color: colors.gray[900],
    textAlign: "center",
    letterSpacing: 4,
  },
  error: {
    width: "100%",
    color: colors.error,
    fontSize: typography.size.sm,
    textAlign: "center",
  },
  primaryButton: {
    width: "100%",
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.brand[500],
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
  secondaryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  secondaryButtonText: {
    color: colors.gray[600],
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
});
