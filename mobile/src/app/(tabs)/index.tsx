import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { FlatList, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { Avatar } from "../../components/Avatar";
import { Card } from "../../components/Card";
import { StatusDot } from "../../components/StatusDot";
import { useAuth } from "../../lib/auth";
import { mockAlerts, mockDevices } from "../../lib/mock-data";
import { colors, borderRadius, spacing } from "../../lib/theme";
import type { Alert as AlertType, Device } from "../../types/api";

function DeviceCard({ device }: { device: Device }) {
  return (
    <Pressable onPress={() => router.push(`/device/${device.id}`)}>
      <Card style={styles.deviceCard}>
        <View style={styles.deviceRow}>
          <View style={styles.deviceInfo}>
            <View style={styles.avatarRow}>
              <Avatar name={device.child_name ?? device.name} size={36} />
              <View style={styles.statusBadge}>
                <StatusDot online={device.is_online} />
              </View>
            </View>
            <View style={styles.deviceText}>
              <Text style={styles.deviceName}>{device.name}</Text>
              <Text style={styles.childName}>{device.child_name}</Text>
            </View>
          </View>
          <View style={styles.killSwitch}>
            <Text style={styles.killLabel}>Internet</Text>
            <Switch
              value={device.internet_enabled}
              onValueChange={() => {}}
              trackColor={{ false: colors.border, true: colors.sage }}
              thumbColor={device.internet_enabled ? colors.forest : colors.stone}
            />
          </View>
        </View>
        <View style={styles.deviceMeta}>
          <Text style={styles.metaText}>
            {device.device_type} · {device.is_online ? "Online now" : `Last seen ${timeAgo(device.last_seen)}`}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

function AlertPreview({ alert }: { alert: AlertType }) {
  const severityColor = alert.severity === "high" ? colors.coral : alert.severity === "medium" ? colors.sunlight : colors.stone;
  return (
    <View style={styles.alertRow}>
      <View style={[styles.severityDot, { backgroundColor: severityColor }]} />
      <View style={styles.alertContent}>
        <Text style={styles.alertTitle} numberOfLines={1}>{alert.title}</Text>
        <Text style={styles.alertMeta}>{alert.device_name} · {timeAgo(alert.timestamp)}</Text>
      </View>
    </View>
  );
}

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const devices = mockDevices;
  const recentAlerts = mockAlerts.filter((a) => !a.is_reviewed).slice(0, 3);

  return (
    <FlatList
      data={devices}
      keyExtractor={(d) => d.id}
      contentContainerStyle={styles.container}
      ListHeaderComponent={
        <>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greeting}>Hello, {user?.full_name?.split(" ")[0] ?? "Parent"}</Text>
              <Text style={styles.subGreeting}>{devices.filter((d) => d.is_online).length} of {devices.length} devices online</Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable onPress={() => router.push("/add-device")} style={styles.iconButton}>
                <Ionicons name="add-circle-outline" size={28} color={colors.forest} />
              </Pressable>
              <Pressable onPress={() => router.push("/settings")} style={styles.iconButton}>
                <Ionicons name="settings-outline" size={24} color={colors.stone} />
              </Pressable>
            </View>
          </View>

          {recentAlerts.length > 0 && (
            <Card style={styles.alertsCard}>
              <View style={styles.alertsHeader}>
                <Text style={styles.sectionTitle}>Recent Alerts</Text>
                <Pressable onPress={() => router.push("/(tabs)/alerts")}>
                  <Text style={styles.seeAll}>See all</Text>
                </Pressable>
              </View>
              {recentAlerts.map((a) => (
                <AlertPreview key={a.id} alert={a} />
              ))}
            </Card>
          )}

          <Text style={styles.sectionTitle}>Devices</Text>
        </>
      }
      renderItem={({ item }) => <DeviceCard device={item} />}
      ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
    paddingTop: spacing.md,
  },
  greeting: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.earth,
  },
  subGreeting: {
    fontSize: 14,
    color: colors.stone,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  iconButton: {
    padding: spacing.xs,
  },
  alertsCard: {
    marginBottom: spacing.lg,
  },
  alertsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.earth,
    marginBottom: spacing.sm,
  },
  seeAll: {
    fontSize: 14,
    color: colors.forest,
    fontWeight: "600",
  },
  alertRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs + 2,
    gap: spacing.sm,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.earth,
  },
  alertMeta: {
    fontSize: 12,
    color: colors.stone,
    marginTop: 1,
  },
  deviceCard: {
    marginBottom: 0,
  },
  deviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  deviceInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  avatarRow: {
    position: "relative",
  },
  statusBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
  },
  deviceText: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.earth,
  },
  childName: {
    fontSize: 13,
    color: colors.stone,
  },
  killSwitch: {
    alignItems: "center",
  },
  killLabel: {
    fontSize: 11,
    color: colors.stone,
    marginBottom: 2,
  },
  deviceMeta: {
    marginTop: spacing.xs,
  },
  metaText: {
    fontSize: 12,
    color: colors.stone,
  },
});
