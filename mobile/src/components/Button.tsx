import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from "react-native";
import { colors, borderRadius, spacing } from "../lib/theme";

interface Props {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ title, onPress, variant = "primary", loading, disabled, style }: Props) {
  const bg =
    variant === "primary" ? colors.forest :
    variant === "secondary" ? colors.meadow :
    variant === "danger" ? colors.coral :
    "transparent";

  const textColor =
    variant === "primary" ? colors.white :
    variant === "secondary" ? colors.forest :
    variant === "danger" ? colors.white :
    colors.forest;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: pressed ? 0.85 : disabled ? 0.5 : 1 },
        variant === "secondary" && styles.secondaryBorder,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  secondaryBorder: {
    borderWidth: 1.5,
    borderColor: colors.forest,
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
  },
});
