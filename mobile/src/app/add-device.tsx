import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { useGeneratePairingCode } from "../hooks/useDevices";
import { colors, spacing } from "../lib/theme";

export default function AddDeviceScreen() {
  const { mutate, data, isPending, isSuccess } = useGeneratePairingCode();

  const code = data?.code ?? "";
  const expiresAt = data?.expires_at;

  const expiresIn = expiresAt
    ? Math.max(
        0,
        Math.round(
          (new Date(expiresAt).getTime() - Date.now()) / 60000,
        ),
      )
    : 0;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="laptop-outline" size={48} color={colors.forest} />
        </View>

        <Text style={styles.title}>Add a Device</Text>
        <Text style={styles.subtitle}>
          Generate a pairing code, then enter it on the child's device to
          connect it to your family.
        </Text>

        {!isSuccess && (
          <Button
            title="Generate Pairing Code"
            onPress={() => mutate({})}
            loading={isPending}
            style={{ marginTop: spacing.lg }}
          />
        )}

        {isSuccess && code && (
          <Card style={styles.codeCard}>
            <Text style={styles.codeLabel}>Pairing Code</Text>
            <Text style={styles.code}>
              {code.length >= 6
                ? `${code.slice(0, 3)}-${code.slice(3)}`
                : code}
            </Text>
            <Text style={styles.codeExpiry}>
              Expires in {expiresIn} minutes
            </Text>

            <View style={styles.steps}>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumText}>1</Text>
                </View>
                <Text style={styles.stepText}>
                  Open Canopy on the child's Mac
                </Text>
              </View>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumText}>2</Text>
                </View>
                <Text style={styles.stepText}>
                  Enter this pairing code when prompted
                </Text>
              </View>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumText}>3</Text>
                </View>
                <Text style={styles.stepText}>
                  The device will appear on your dashboard
                </Text>
              </View>
            </View>
          </Card>
        )}
      </View>

      <Button
        title="Done"
        variant="secondary"
        onPress={() => router.back()}
        style={{ margin: spacing.md }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  content: {
    padding: spacing.lg,
    alignItems: "center",
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.forest + "10",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.earth,
  },
  subtitle: {
    fontSize: 15,
    color: colors.stone,
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  codeCard: {
    marginTop: spacing.lg,
    alignItems: "center",
    width: "100%",
  },
  codeLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.stone,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  code: {
    fontSize: 40,
    fontWeight: "800",
    color: colors.forest,
    letterSpacing: 8,
    marginVertical: spacing.sm,
  },
  codeExpiry: {
    fontSize: 13,
    color: colors.sunlight,
    fontWeight: "600",
  },
  steps: {
    marginTop: spacing.lg,
    gap: spacing.md,
    width: "100%",
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.sage + "30",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.forest,
  },
  stepText: {
    fontSize: 14,
    color: colors.earth,
    flex: 1,
  },
});
