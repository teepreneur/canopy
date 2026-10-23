import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { Card } from "../../components/Card";
import { mockActivity, mockDevices, mockRules } from "../../lib/mock-data";
import { colors, borderRadius, spacing } from "../../lib/theme";
import type { ActivityLog, Rule } from "../../types/api";

type Tab = "activity" | "rules";

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function ActivityItem({ log }: { log: ActivityLog }) {
  const icon = log.activity_type === "website" ? "globe-outline" : "apps-outline";
  return (
    <View style={styles.activityRow}>
      <View style={[styles.actIcon, log.is_blocked && { backgroundColor: colors.coral + "20" }]}>
        <Ionicons
          name={icon as any}
          size={18}
          color={log.is_blocked ? colors.coral : colors.forest}
        />
      </View>
      <View style={styles.actInfo}>
        <Text style={[styles.actTitle, log.is_blocked && { color: colors.coral }]}>
          {log.title}
          {log.is_blocked && " (Blocked)"}
        </Text>
        <Text style={styles.actMeta}>
          {log.category ?? log.activity_type} · {timeAgo(log.timestamp)}
        </Text>
      </View>
      {log.duration_seconds > 0 && (
        <Text style={styles.duration}>{formatDuration(log.duration_seconds)}</Text>
      )}
    </View>
  );
}

function RuleItem({ rule, onToggle, onDelete }: { rule: Rule; onToggle: () => void; onDelete: () => void }) {
  const icon =
    rule.rule_type === "block_site" ? "globe-outline" :
    rule.rule_type === "block_app" ? "apps-outline" :
    rule.rule_type === "time_limit" ? "time-outline" :
    "calendar-outline";

  const typeLabel =
    rule.rule_type === "block_site" ? "Block Site" :
    rule.rule_type === "block_app" ? "Block App" :
    rule.rule_type === "time_limit" ? "Time Limit" :
    "Schedule";

  return (
    <View style={styles.ruleRow}>
      <View style={styles.ruleIcon}>
        <Ionicons name={icon as any} size={18} color={colors.forest} />
      </View>
      <View style={styles.ruleInfo}>
        <Text style={styles.ruleTarget}>{rule.target}</Text>
        <Text style={styles.ruleMeta}>{typeLabel}</Text>
        {rule.schedule && (
          <Text style={styles.ruleMeta}>
            {rule.schedule.days.join(", ")} · {rule.schedule.start_time}–{rule.schedule.end_time}
          </Text>
        )}
      </View>
      <Switch
        value={rule.is_active}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.sage }}
        thumbColor={rule.is_active ? colors.forest : colors.stone}
      />
      <Pressable onPress={onDelete} hitSlop={8}>
        <Ionicons name="trash-outline" size={18} color={colors.coral} />
      </Pressable>
    </View>
  );
}

export default function DeviceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const device = mockDevices.find((d) => d.id === id) ?? mockDevices[0];
  const [activeTab, setActiveTab] = useState<Tab>("activity");
  const [rules, setRules] = useState(mockRules.filter((r) => r.device_id === device.id));
  const activity = mockActivity.filter((a) => a.device_id === device.id);

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      {/* Device header */}
      <Card style={styles.headerCard}>
        <View style={styles.deviceHeader}>
          <View>
            <Text style={styles.deviceName}>{device.name}</Text>
            <Text style={styles.childLabel}>{device.child_name} · {device.device_type}</Text>
          </View>
          <View style={styles.statusChip}>
            <View style={[styles.statusDot, { backgroundColor: device.is_online ? colors.success : colors.stone }]} />
            <Text style={styles.statusText}>{device.is_online ? "Online" : "Offline"}</Text>
          </View>
        </View>
        <View style={styles.killSwitchRow}>
          <View>
            <Text style={styles.killTitle}>Internet Access</Text>
            <Text style={styles.killSub}>Toggle to instantly block all internet</Text>
          </View>
          <Switch
            value={device.internet_enabled}
            onValueChange={() => {}}
            trackColor={{ false: colors.coral + "40", true: colors.sage }}
            thumbColor={device.internet_enabled ? colors.forest : colors.coral}
          />
        </View>
      </Card>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tab, activeTab === "activity" && styles.tabActive]}
          onPress={() => setActiveTab("activity")}
        >
          <Ionicons name="list-outline" size={16} color={activeTab === "activity" ? colors.forest : colors.stone} />
          <Text style={[styles.tabText, activeTab === "activity" && styles.tabTextActive]}>Activity</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "rules" && styles.tabActive]}
          onPress={() => setActiveTab("rules")}
        >
          <Ionicons name="shield-outline" size={16} color={activeTab === "rules" ? colors.forest : colors.stone} />
          <Text style={[styles.tabText, activeTab === "rules" && styles.tabTextActive]}>
            Rules ({rules.length})
          </Text>
        </Pressable>
      </View>

      {/* Tab content */}
      {activeTab === "activity" ? (
        <Card>
          {activity.length === 0 ? (
            <Text style={styles.emptyText}>No activity recorded yet</Text>
          ) : (
            activity.map((log) => <ActivityItem key={log.id} log={log} />)
          )}
        </Card>
      ) : (
        <>
          <Pressable
            style={styles.addRuleButton}
            onPress={() => router.push({ pathname: "/add-rule", params: { deviceId: device.id } })}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.forest} />
            <Text style={styles.addRuleText}>Add Rule</Text>
          </Pressable>
          <Card>
            {rules.length === 0 ? (
              <Text style={styles.emptyText}>No rules configured</Text>
            ) : (
              rules.map((rule) => (
                <RuleItem
                  key={rule.id}
                  rule={rule}
                  onToggle={() =>
                    setRules((prev) =>
                      prev.map((r) => (r.id === rule.id ? { ...r, is_active: !r.is_active } : r)),
                    )
                  }
                  onDelete={() => setRules((prev) => prev.filter((r) => r.id !== rule.id))}
                />
              ))
            )}
          </Card>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  headerCard: {
    marginBottom: spacing.md,
  },
  deviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  deviceName: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.earth,
  },
  childLabel: {
    fontSize: 14,
    color: colors.stone,
    marginTop: 2,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.meadow,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.earth,
  },
  killSwitchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  killTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.earth,
  },
  killSub: {
    fontSize: 12,
    color: colors.stone,
    marginTop: 1,
  },
  tabRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.forest + "10",
    borderColor: colors.forest,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.stone,
  },
  tabTextActive: {
    color: colors.forest,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.forest + "10",
    alignItems: "center",
    justifyContent: "center",
  },
  actInfo: {
    flex: 1,
  },
  actTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.earth,
  },
  actMeta: {
    fontSize: 12,
    color: colors.stone,
    marginTop: 1,
  },
  duration: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.forest,
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ruleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.forest + "10",
    alignItems: "center",
    justifyContent: "center",
  },
  ruleInfo: {
    flex: 1,
  },
  ruleTarget: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.earth,
  },
  ruleMeta: {
    fontSize: 12,
    color: colors.stone,
    marginTop: 1,
  },
  addRuleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.forest + "10",
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.forest + "30",
    borderStyle: "dashed",
  },
  addRuleText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.forest,
  },
  emptyText: {
    textAlign: "center",
    color: colors.stone,
    paddingVertical: spacing.lg,
  },
});
