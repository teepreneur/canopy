import { StyleSheet, Text, View } from "react-native";
import { colors, borderRadius } from "../lib/theme";

const avatarColors = [colors.forest, colors.sunlight, colors.sage, colors.blossom, colors.coral];

interface Props {
  name: string;
  size?: number;
}

export function Avatar({ name, size = 40 }: Props) {
  const initial = name.charAt(0).toUpperCase();
  const colorIndex = name.charCodeAt(0) % avatarColors.length;
  const bg = avatarColors[colorIndex];
  const textColor = colorIndex === 1 || colorIndex === 3 ? colors.earth : colors.white;

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[styles.text, { fontSize: size * 0.45, color: textColor }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontWeight: "700",
  },
});
