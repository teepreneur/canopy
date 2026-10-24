import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAlerts, useAcknowledgeAlert } from "../../hooks/useAlerts";
import { useChildren } from "../../hooks/useFamily";
import { colors, spacing } from "../../lib/theme";
import type { Alert, ChildProfile } from "../../types/api";

const CHILD_AVATAR_COLORS = [colors.sunlight, colors.sage, "#c9947d", colors.stone];

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

type FilterType = "all" | "requests" | "warnings" | "info";

const FILTERS: { key: FilterType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "requests", label: "Requests" },
  { key: "warnings", label: "Warnings" },
  { key: "info", label: "Info" },
];

function matchesFilter(alert: Alert, filter: FilterType): boolean {
  if (filter === "all") return true;
  if (filter === "requests") return alert.alert_type === "access_request";
  if (filter === "warnings")
    return (
      alert.alert_type === "suspicious_activity" ||
      alert.alert_type === "blocked_attempt"
    );
  return alert.alert_type === "device_offline";
}

function AlertCard({
  alert,
  childList,
  onAcknowledge,
}: {
  alert: Alert;
  childList: ChildProfile[];
  onAcknowledge: (id: string) => void;
}) {
  const child = childList.find((c) => c.id === alert.child_profile_id);
  const avatarBg = child
    ? CHILD_AVATAR_COLORS[child.name.charCodeAt(0) % CHILD_AVATAR_COLORS.length]
    : colors.stone;

  return (
    <View style={[styles.alertCard, alert.acknowledged && styles.reviewed]}>
      <View style={styles.alertTop}>
        <View style={[styles.alertAvatar, { backgroundColor: avatarBg }]}>
          <Text style={styles.alertAvatarText}>
            {child?.name.charAt(0).toUpperCase() ?? "?"}
          </Text>
        </View>
        <Text style={styles.alertWho}>{child?.name ?? "Unknown"}</Text>
        <Text style={styles.alertWhen}>{timeAgo(alert.created_at)}</Text>
      </View>

      {alert.alert_type === "access_request" && alert.detail ? (
        <View style={styles.alertMsgBg}>
          <Text style={styles.alertMsgText}>{alert.detail}</Text>
        </View>
      ) : (
        <Text style={styles.alertWhat}>
          {alert.title}
          {alert.target ? ` — ${alert.target}` : ""}
        </Text>
      )}

      {!alert.acknowledged && (
        <View style={styles.actionBtns}>
          {alert.alert_type === "access_request" ? (
            <>
              <Pressable
                style={styles.btnAllow}
                onPress={() => onAcknowledge(alert.id)}
              >
                <Text style={styles.btnAllowText}>Allow</Text>
              </Pressable>
              <Pressable
                style={styles.btnDeny}
                onPress={() => onAcknowledge(alert.id)}
              >
                <Text style={styles.btnDenyText}>Not now</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              style={styles.dismissButton}
              onPress={() => onAcknowledge(alert.id)}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color={colors.forest}
              />
              <Text style={styles.dismissText}>Acknowledge</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

export default function AlertsScreen() {
  const [filter, setFilter] = useState<FilterType>("all");
  const { data: alerts, isLoading } = useAlerts();
  const { data: children } = useChildren();
  const acknowledge = useAcknowledgeAlert();

  const childList = children ?? [];
  const alertList = alerts ?? [];
  const filtered = alertList.filter((a) => matchesFilter(a, filter));
  const pendingCount = alertList.filter((a) => !a.acknowledged).length;

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Alerts</Text>
          <Text style={styles.pendingCount}>
            {pendingCount} pending
          </Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text
              style={[
                styles.filterText,
                filter === f.key && styles.filterTextActive,
              ]}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.forest} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(a) => a.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <AlertCard
              alert={item}
              childList={childList}
              onAcknowledge={(id) => acknowledge.mutate(id)}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="checkmark-circle" size={48} color={colors.sage} />
              <Text style={styles.emptyText}>All caught up!</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.meadow },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: spacing.md,
    paddingBottom: 14,
    backgroundColor: colors.meadow,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.earth,
    letterSpacing: -0.5,
  },
  pendingCount: {
    fontSize: 12,
    color: colors.stone,
    fontWeight: "600",
  },
  filterRow: {
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
    marginBottom: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  filterActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.stone,
  },
  filterTextActive: {
    color: colors.white,
  },
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xxl + 24,
  },
  alertCard: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 20,
    padding: spacing.md,
    shadowColor: "#2A3130",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  reviewed: {
    opacity: 0.6,
  },
  alertTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  alertAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  alertAvatarText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
  },
  alertWho: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.earth,
    flex: 1,
  },
  alertWhen: {
    fontSize: 11,
    color: colors.stone,
  },
  alertMsgBg: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.meadow,
    borderRadius: 14,
    marginBottom: 12,
  },
  alertMsgText: {
    fontSize: 13,
    color: colors.stone,
    lineHeight: 19,
    fontStyle: "italic",
  },
  alertWhat: {
    fontSize: 13,
    color: colors.stone,
    lineHeight: 19,
    marginBottom: 12,
  },
  actionBtns: {
    flexDirection: "row",
    gap: 8,
  },
  btnAllow: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.forest,
    alignItems: "center",
  },
  btnAllowText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  btnDeny: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#fbeae6",
    alignItems: "center",
  },
  btnDenyText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.coral,
  },
  dismissButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  dismissText: {
    fontSize: 14,
    color: colors.forest,
    fontWeight: "600",
  },
  empty: {
    alignItems: "center",
    paddingTop: spacing.xxl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 16,
    color: colors.stone,
  },
});
