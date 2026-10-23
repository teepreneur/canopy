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
import { Card } from "../../components/Card";
import { useAlerts, useAcknowledgeAlert } from "../../hooks/useAlerts";
import { colors, borderRadius, spacing } from "../../lib/theme";
import type { Alert } from "../../types/api";

function alertIcon(type: Alert["alert_type"]): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case "blocked_attempt":
      return "ban-outline";
    case "suspicious_activity":
      return "warning-outline";
    case "access_request":
      return "key-outline";
    case "device_offline":
      return "cloud-offline-outline";
  }
}

function typeColor(type: Alert["alert_type"]): string {
  switch (type) {
    case "suspicious_activity":
      return colors.coral;
    case "access_request":
      return colors.sunlight;
    case "blocked_attempt":
      return colors.forest;
    case "device_offline":
      return colors.stone;
  }
}

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function AlertCard({
  alert,
  onAcknowledge,
}: {
  alert: Alert;
  onAcknowledge: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const color = typeColor(alert.alert_type);

  return (
    <Card style={[styles.alertCard, alert.acknowledged && styles.reviewed]}>
      <Pressable onPress={() => setExpanded(!expanded)}>
        <View style={styles.alertHeader}>
          <View style={[styles.iconBg, { backgroundColor: color + "20" }]}>
            <Ionicons
              name={alertIcon(alert.alert_type)}
              size={20}
              color={color}
            />
          </View>
          <View style={styles.alertInfo}>
            <Text style={styles.alertTitle}>{alert.title}</Text>
            <Text style={styles.alertMeta}>{timeAgo(alert.created_at)}</Text>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: color + "20" }]}>
            <Text style={[styles.typeText, { color }]}>
              {alert.alert_type.replace("_", " ")}
            </Text>
          </View>
        </View>

        {expanded && (
          <View style={styles.expandedContent}>
            {alert.detail && (
              <Text style={styles.description}>{alert.detail}</Text>
            )}
            {alert.target && (
              <Text style={styles.targetText}>Target: {alert.target}</Text>
            )}
            {!alert.acknowledged && (
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
      </Pressable>
    </Card>
  );
}

export default function AlertsScreen() {
  const [filter, setFilter] = useState<"all" | "unacknowledged">("all");
  const acknowledged = filter === "unacknowledged" ? false : undefined;
  const { data: alerts, isLoading } = useAlerts(acknowledged);
  const acknowledge = useAcknowledgeAlert();

  const alertList = alerts ?? [];
  const unackCount = alertList.filter((a) => !a.acknowledged).length;

  const handleAcknowledge = (id: string) => {
    acknowledge.mutate(id);
  };

  return (
    <View style={styles.flex}>
      <View style={styles.filterRow}>
        <Pressable
          style={[styles.filterChip, filter === "all" && styles.filterActive]}
          onPress={() => setFilter("all")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "all" && styles.filterTextActive,
            ]}
          >
            All
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.filterChip,
            filter === "unacknowledged" && styles.filterActive,
          ]}
          onPress={() => setFilter("unacknowledged")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "unacknowledged" && styles.filterTextActive,
            ]}
          >
            Unacknowledged ({unackCount})
          </Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.forest} />
        </View>
      ) : (
        <FlatList
          data={alertList}
          keyExtractor={(a) => a.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <AlertCard alert={item} onAcknowledge={handleAcknowledge} />
          )}
          ItemSeparatorComponent={() => (
            <View style={{ height: spacing.sm }} />
          )}
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
  flex: { flex: 1 },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  filterRow: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    paddingBottom: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.stone,
  },
  filterTextActive: {
    color: colors.white,
  },
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  alertCard: {},
  reviewed: {
    opacity: 0.6,
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.earth,
  },
  alertMeta: {
    fontSize: 12,
    color: colors.stone,
    marginTop: 1,
  },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  typeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  expandedContent: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  description: {
    fontSize: 14,
    color: colors.earth,
    lineHeight: 20,
  },
  targetText: {
    fontSize: 13,
    color: colors.stone,
    marginTop: spacing.xs,
  },
  dismissButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.sm,
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
