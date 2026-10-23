import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Card } from "../../components/Card";
import { mockAlerts } from "../../lib/mock-data";
import { colors, borderRadius, spacing } from "../../lib/theme";
import type { Alert } from "../../types/api";

function severityColor(severity: Alert["severity"]) {
  return severity === "high" ? colors.coral : severity === "medium" ? colors.sunlight : colors.stone;
}

function alertIcon(type: Alert["alert_type"]): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case "blocked_site": return "globe-outline";
    case "blocked_app": return "apps-outline";
    case "time_limit": return "time-outline";
    case "new_app": return "download-outline";
    case "suspicious": return "warning-outline";
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

function AlertCard({ alert, onDismiss }: { alert: Alert; onDismiss: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card style={[styles.alertCard, alert.is_reviewed && styles.reviewed]}>
      <Pressable onPress={() => setExpanded(!expanded)}>
        <View style={styles.alertHeader}>
          <View style={[styles.iconBg, { backgroundColor: severityColor(alert.severity) + "20" }]}>
            <Ionicons name={alertIcon(alert.alert_type)} size={20} color={severityColor(alert.severity)} />
          </View>
          <View style={styles.alertInfo}>
            <Text style={styles.alertTitle}>{alert.title}</Text>
            <Text style={styles.alertMeta}>
              {alert.device_name} · {timeAgo(alert.timestamp)}
            </Text>
          </View>
          <View style={[styles.severityBadge, { backgroundColor: severityColor(alert.severity) + "20" }]}>
            <Text style={[styles.severityText, { color: severityColor(alert.severity) }]}>
              {alert.severity}
            </Text>
          </View>
        </View>

        {expanded && (
          <View style={styles.expandedContent}>
            <Text style={styles.description}>{alert.description}</Text>
            {!alert.is_reviewed && (
              <Pressable style={styles.dismissButton} onPress={() => onDismiss(alert.id)}>
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.forest} />
                <Text style={styles.dismissText}>Mark as reviewed</Text>
              </Pressable>
            )}
          </View>
        )}
      </Pressable>
    </Card>
  );
}

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState(mockAlerts);
  const [filter, setFilter] = useState<"all" | "unreviewed">("all");

  const filtered = filter === "unreviewed" ? alerts.filter((a) => !a.is_reviewed) : alerts;

  const handleDismiss = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, is_reviewed: true } : a)));
  };

  return (
    <View style={styles.flex}>
      <View style={styles.filterRow}>
        <Pressable
          style={[styles.filterChip, filter === "all" && styles.filterActive]}
          onPress={() => setFilter("all")}
        >
          <Text style={[styles.filterText, filter === "all" && styles.filterTextActive]}>All</Text>
        </Pressable>
        <Pressable
          style={[styles.filterChip, filter === "unreviewed" && styles.filterActive]}
          onPress={() => setFilter("unreviewed")}
        >
          <Text style={[styles.filterText, filter === "unreviewed" && styles.filterTextActive]}>
            Unreviewed ({alerts.filter((a) => !a.is_reviewed).length})
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(a) => a.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <AlertCard alert={item} onDismiss={handleDismiss} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle" size={48} color={colors.sage} />
            <Text style={styles.emptyText}>All caught up!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  severityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  severityText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
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
