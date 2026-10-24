import { StyleSheet, View } from "react-native";
import { colors } from "../lib/theme";

export function StatusDot({ online }: { online: boolean }) {
  return (
    <View style={[styles.dot, { backgroundColor: online ? colors.success : colors.stone }]} />
  );
}

const styles = StyleSheet.create({
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.white,
  },
});
