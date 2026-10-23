import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Avatar } from "../../components/Avatar";
import { Card } from "../../components/Card";
import { StatusDot } from "../../components/StatusDot";
import { useAuth } from "../../lib/auth";
import { useAlerts } from "../../hooks/useAlerts";
import { useDevices, useSendCommand } from "../../hooks/useDevices";
import { useChildren } from "../../hooks/useFamily";
import { colors, spacing } from "../../lib/theme";
import type { Alert as AlertType, ChildProfile, Device } from "../../types/api";

function timeAgo(timestamp: string | null): string {
  if (!timestamp) return "never";
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function childName(
  device: Device,
  children: ChildProfile[] | undefined,
): string {
  if (!device.child_profile_id || !children) return "";
  return children.find((c) => c.id === device.child_profile_id)?.name ?? "";
}

function DeviceCard({
  device,
  children,
}: {
  device: Device;
  children: ChildProfile[] | undefined;
}) {
  const name = childName(device, children);
  return (
    <Pressable onPress={() => router.push(`/device/${device.id}`)}>
      <Card style={styles.deviceCard}>
        <View style={styles.deviceRow}>
          <View style={styles.deviceInfo}>
            <View style={styles.avatarRow}>
              <Avatar name={name || device.name} size={36} />
              <View style={styles.statusBadge}>
                <StatusDot online={device.is_online} />
              </View>
            </View>
            <View style={styles.deviceText}>
              <Text style={styles.deviceName}>{device.name}</Text>
              {name ? <Text style={styles.childName}>{name}</Text> : null}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.stone} />
        </View>
        <View style={styles.deviceMeta}>
          <Text style={styles.metaText}>
            {device.platform} ·{" "}
            {device.is_online
              ? "Online now"
              : `Last seen ${timeAgo(device.last_heartbeat)}`}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

function AlertPreview({ alert }: { alert: AlertType }) {
  const typeColor =
    alert.alert_type === "suspicious_activity"
      ? colors.coral
      : alert.alert_type === "access_request"
        ? colors.sunlight
        : colors.stone;
  return (
    <View style={styles.alertRow}>
      <View style={[styles.severityDot, { backgroundColor: typeColor }]} />
      <View style={styles.alertContent}>
        <Text style={styles.alertTitle} numberOfLines={1}>
          {alert.title}
        </Text>
        <Text style={styles.alertMeta}>{timeAgo(alert.created_at)}</Text>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const { data: devices, isLoading: devicesLoading } = useDevices();
  const { data: alerts } = useAlerts(false, 3);
  const { data: children } = useChildren();

  const deviceList = devices ?? [];
  const recentAlerts = alerts ?? [];

  if (devicesLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.forest} />
      </View>
    );
  }

  return (
    <FlatList
      data={deviceList}
      keyExtractor={(d) => d.id}
      contentContainerStyle={styles.container}
      ListHeaderComponent={
        <>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greeting}>
                Hello, {user?.full_name?.split(" ")[0] ?? "Parent"}
              </Text>
              <Text style={styles.subGreeting}>
                {deviceList.filter((d) => d.is_online).length} of{" "}
                {deviceList.length} devices online
              </Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable
                onPress={() => router.push("/add-device")}
                style={styles.iconButton}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={28}
                  color={colors.forest}
                />
              </Pressable>
              <Pressable
                onPress={() => router.push("/settings")}
                style={styles.iconButton}
              >
                <Ionicons
                  name="settings-outline"
                  size={24}
                  color={colors.stone}
                />
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
      renderItem={({ item }) => (
        <DeviceCard device={item} children={children} />
      )}
      ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      ListEmptyComponent={
        <Card>
          <Text style={styles.emptyText}>
            No devices paired yet. Tap + to add one.
          </Text>
        </Card>
      }
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
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
  deviceMeta: {
    marginTop: spacing.xs,
  },
  metaText: {
    fontSize: 12,
    color: colors.stone,
  },
  emptyText: {
    textAlign: "center",
    color: colors.stone,
    paddingVertical: spacing.lg,
  },
});
