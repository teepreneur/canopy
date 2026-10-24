import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useDevices } from "../../hooks/useDevices";
import { useChildren } from "../../hooks/useFamily";
import { colors, spacing, borderRadius } from "../../lib/theme";
import type { Device, ChildProfile } from "../../types/api";

function timeAgo(timestamp: string | null): string {
  if (!timestamp) return "never";
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const AVATAR_COLORS = [colors.sunlight, colors.sage, "#c9947d", colors.stone];

function DeviceCard({
  device,
  children,
}: {
  device: Device;
  children: ChildProfile[];
}) {
  const child = children.find((c) => c.id === device.child_profile_id);
  const colorIndex = (child?.name ?? device.name).charCodeAt(0) % AVATAR_COLORS.length;

  return (
    <Pressable
      style={[styles.devCard, !device.is_online && { opacity: 0.5 }]}
      onPress={() => router.push(`/device/${device.id}`)}
    >
      <View style={styles.devTop}>
        <View
          style={[
            styles.devAvatar,
            { backgroundColor: AVATAR_COLORS[colorIndex] },
          ]}
        >
          <Text style={styles.devAvatarText}>
            {(child?.name ?? device.name).charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.devNameCol}>
          <Text style={styles.devName}>{device.name}</Text>
          <Text style={styles.devOs}>{device.platform}</Text>
        </View>
        <View
          style={[
            styles.devDot,
            {
              backgroundColor: device.is_online
                ? colors.success
                : colors.stone,
            },
          ]}
        />
      </View>
      <View style={styles.devStats}>
        <View style={styles.devStat}>
          <Text style={styles.devStatLabel}>ASSIGNED</Text>
          <Text style={styles.devStatVal}>
            {child?.name ?? "None"}
          </Text>
        </View>
        <View style={styles.devStat}>
          <Text style={styles.devStatLabel}>LAST SYNC</Text>
          <Text style={styles.devStatVal}>
            {device.is_online
              ? "Just now"
              : timeAgo(device.last_heartbeat)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function DevicesScreen() {
  const { data: devices, isLoading } = useDevices();
  const { data: children } = useChildren();

  const deviceList = devices ?? [];
  const childList = children ?? [];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.forest} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <Text style={styles.pageTitle}>Devices</Text>
        <Pressable
          style={styles.addBtn}
          onPress={() => router.push("/add-device")}
        >
          <Ionicons name="add" size={22} color={colors.forest} />
        </Pressable>
      </View>

      {deviceList.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="laptop-outline" size={48} color={colors.stone} />
          <Text style={styles.emptyText}>No devices paired yet</Text>
          <Pressable
            style={styles.emptyBtn}
            onPress={() => router.push("/add-device")}
          >
            <Text style={styles.emptyBtnText}>Add Device</Text>
          </Pressable>
        </View>
      ) : (
        deviceList.map((device) => (
          <DeviceCard
            key={device.id}
            device={device}
            children={childList}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.meadow,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.meadow,
  },
  container: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl + 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 56,
    paddingBottom: 14,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.earth,
    letterSpacing: -0.5,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  devCard: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    shadowColor: "#2A3130",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  devTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  devAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  devAvatarText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
  },
  devNameCol: {
    flex: 1,
  },
  devName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.earth,
  },
  devOs: {
    fontSize: 11,
    color: colors.stone,
    marginTop: 1,
  },
  devDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  devStats: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  devStat: {
    flex: 1,
    padding: 10,
    backgroundColor: colors.meadow,
    borderRadius: 10,
    alignItems: "center",
  },
  devStatLabel: {
    fontSize: 10,
    color: colors.stone,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  devStatVal: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.earth,
    marginTop: 2,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: spacing.xxl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 16,
    color: colors.stone,
  },
  emptyBtn: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    backgroundColor: colors.forest,
    borderRadius: 14,
  },
  emptyBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
  },
});
