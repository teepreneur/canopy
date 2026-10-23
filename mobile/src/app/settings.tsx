import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Card } from "../components/Card";
import { useAuth } from "../lib/auth";
import { colors, borderRadius, spacing } from "../lib/theme";

function SettingsRow({
  icon,
  label,
  sublabel,
  onPress,
  danger,
}: {
  icon: string;
  label: string;
  sublabel?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={[styles.rowIcon, danger && { backgroundColor: colors.coral + "15" }]}>
        <Ionicons name={icon as any} size={20} color={danger ? colors.coral : colors.forest} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, danger && { color: colors.coral }]}>{label}</Text>
        {sublabel && <Text style={styles.rowSub}>{sublabel}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.stone} />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card>
        <View style={styles.profileRow}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileInitial}>
              {(user?.full_name ?? "P").charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.profileName}>{user?.full_name ?? "Parent"}</Text>
            <Text style={styles.profileEmail}>{user?.email ?? "parent@example.com"}</Text>
          </View>
        </View>
      </Card>

      <Text style={styles.sectionHeader}>Family</Text>
      <Card>
        <SettingsRow icon="people-outline" label="Family Profile" sublabel="Manage your family settings" onPress={() => {}} />
        <SettingsRow icon="person-add-outline" label="Child Profiles" sublabel="Add or edit children" onPress={() => {}} />
      </Card>

      <Text style={styles.sectionHeader}>Notifications</Text>
      <Card>
        <SettingsRow icon="notifications-outline" label="Push Notifications" sublabel="Alert preferences" onPress={() => {}} />
        <SettingsRow icon="mail-outline" label="Email Digest" sublabel="Weekly activity summary" onPress={() => {}} />
      </Card>

      <Text style={styles.sectionHeader}>Account</Text>
      <Card>
        <SettingsRow icon="help-circle-outline" label="Help & Support" onPress={() => {}} />
        <SettingsRow icon="document-text-outline" label="Privacy Policy" onPress={() => {}} />
        <SettingsRow icon="log-out-outline" label="Sign Out" onPress={handleLogout} danger />
      </Card>

      <Text style={styles.version}>Canopy v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitial: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.white,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.earth,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.stone,
    marginTop: 1,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.stone,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.forest + "10",
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.earth,
  },
  rowSub: {
    fontSize: 12,
    color: colors.stone,
    marginTop: 1,
  },
  version: {
    textAlign: "center",
    color: colors.stone,
    fontSize: 13,
    marginTop: spacing.xl,
  },
});
