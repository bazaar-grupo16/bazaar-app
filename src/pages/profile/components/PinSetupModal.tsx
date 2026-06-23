import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  clearPinConfiguration,
  PIN_MIN_LENGTH,
  savePinConfiguration,
  validatePinInputs,
} from "@/shared/auth";
import { colors, radius, spacing, typography } from "@/shared/styles";

interface Props {
  visible: boolean;
  pinEnabled: boolean;
  userId: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export function PinSetupModal({ visible, pinEnabled, userId, onClose, onSaved }: Props) {
  const [pin, setPin] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible) {
      setPin("");
      setConfirmation("");
      setError("");
      setIsSaving(false);
    }
  }, [visible]);

  async function handleSave() {
    if (!userId) {
      setError("No se pudo identificar el usuario de la sesión.");
      return;
    }

    const validation = validatePinInputs(pin, confirmation);
    if (!validation.ok) {
      setError(
        validation.reason === "invalid_format"
          ? `El PIN debe tener al menos ${PIN_MIN_LENGTH} dígitos numéricos.`
          : "Los PIN ingresados no coinciden.",
      );
      return;
    }

    try {
      setIsSaving(true);
      await savePinConfiguration(userId, pin);
      Alert.alert(
        pinEnabled ? "PIN actualizado" : "PIN activado",
        "Ya podés usar este PIN para ingresar desde este dispositivo.",
      );
      onSaved();
      onClose();
    } catch (err) {
      setError("No se pudo guardar el PIN en este dispositivo.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleDisable() {
    Alert.alert(
      "Desactivar PIN",
      "Vas a tener que iniciar sesión con email y contraseña la próxima vez.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Desactivar",
          style: "destructive",
          onPress: async () => {
            await clearPinConfiguration();
            onSaved();
            onClose();
          },
        },
      ],
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconBox}>
                <Ionicons name="keypad-outline" size={22} color={colors.brand[600]} />
              </View>
              <View>
                <Text style={styles.title}>{pinEnabled ? "Cambiar PIN" : "Activar PIN"}</Text>
                <Text style={styles.subtitle}>Solo se guarda en este dispositivo.</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Ionicons name="close" size={22} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>PIN</Text>
              <TextInput
                value={pin}
                onChangeText={(value) => {
                  setPin(value.replace(/\D/g, ""));
                  setError("");
                }}
                placeholder="Mínimo 6 dígitos"
                placeholderTextColor={colors.gray[300]}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={12}
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmar PIN</Text>
              <TextInput
                value={confirmation}
                onChangeText={(value) => {
                  setConfirmation(value.replace(/\D/g, ""));
                  setError("");
                }}
                placeholder="Repetí el PIN"
                placeholderTextColor={colors.gray[300]}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={12}
                style={styles.input}
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>

          <View style={styles.actions}>
            {pinEnabled ? (
              <TouchableOpacity style={styles.dangerButton} onPress={handleDisable}>
                <Text style={styles.dangerButtonText}>Desactivar</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.ghostButton} onPress={onClose}>
              <Text style={styles.ghostButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.disabledButton]}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text style={styles.saveButtonText}>{pinEnabled ? "Guardar" : "Activar"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.brand[50],
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: typography.size.lg,
    color: colors.gray[900],
    fontWeight: typography.weight.bold,
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.gray[500],
    marginTop: 2,
  },
  form: {
    gap: spacing.md,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.gray[700],
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: typography.size.md,
    color: colors.gray[900],
  },
  error: {
    color: colors.error,
    fontSize: typography.size.sm,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: spacing.sm,
  },
  ghostButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  ghostButtonText: {
    color: colors.gray[600],
    fontWeight: typography.weight.semibold,
  },
  dangerButton: {
    marginRight: "auto",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dangerButtonText: {
    color: colors.error,
    fontWeight: typography.weight.semibold,
  },
  saveButton: {
    backgroundColor: colors.brand[500],
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  disabledButton: {
    opacity: 0.65,
  },
  saveButtonText: {
    color: colors.white,
    fontWeight: typography.weight.semibold,
  },
});
