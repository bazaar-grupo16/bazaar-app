import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from "react-native";
import type { TouchableOpacityProps } from "react-native";
import { colors, typography, spacing } from "../styles/theme";

interface FormButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  loading?: boolean;
}

export function FormButton({ children, loading = false, disabled, style, ...props }: FormButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.white} />
      ) : (
        <Text style={styles.text}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.brand[500],
    borderRadius: 16,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.brand[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    color: colors.white,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
});