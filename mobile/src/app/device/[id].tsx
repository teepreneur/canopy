import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { Card } from "../../components/Card";
import { useActivityLogs } from "../../hooks/useActivity";
import { useDevice, useSendCommand } from "../../hooks/useDevices";
import { useRules, useDeleteRule, useUpdateRule } from "../../hooks/useRules";
import { useChildren } from "../../hooks/useFamily";
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
  const icon =
    log.activity_type === "site_visit" ? "globe-outline" : "apps-outline";
  return (
    <View style={styles.activityRow}>
      <View style={styles.actIcon}>
        <Ionicons name={icon as any} size={18} color={colors.forest} />
      </View>
      <View style={styles.actInfo}>
        <Text style={styles.actTitle}>{log.title ?? log.target}</Text>
        <Text style={styles.actMeta}>
          {log.activity_type === "site_visit" ? "Site" : "App"} ·{" "}
          {timeAgo(log.timestamp)}
        </Text>
      </View>
      {log.duration_seconds > 0 && (
        <Text style={styles.duration}>
          {formatDuration(log.duration_seconds)}
        </Text>
      )}
    </View>
  );
}

function RuleItem({
  rule,
  onToggle,
  onDelete,
}: {
  rule: Rule;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const icon =
    rule.rule_type === "block_site"
      ? "globe-outline"
      : rule.rule_type === "block_app"
        ? "apps-outline"
        : "calendar-outline";

  const typeLabel =
    rule.rule_type === "block_site"
      ? "Block Site"
      : rule.rule_type === "block_app"
        ? "Block App"
        : "Schedule";

  return (
    <View style={styles.ruleRow}>
      <View style={styles.ruleIcon}>
        <Ionicons name={icon as any} size={18} color={colors.forest} />
      </View>
      <View style={styles.ruleInfo}>
        <Text style={styles.ruleTarget}>{rule.target}</Text>
        <Text style={styles.ruleMeta}>{typeLabel}</Text>
        {rule.schedule_days && rule.schedule_start && (
          <Text style={styles.ruleMeta}>
            {rule.schedule_days.join(", ")} · {rule.schedule_start}–
            {rule.schedule_end}
          </Text>
        )}
      </View>
      <Switch
        value={rule.enabled}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.sage }}
        thumbColor={rule.enabled ? colors.forest : colors.stone}
      />
      <Pressable onPress={onDelete} hitSlop={8}>
        <Ionicons name="trash-outline" size={18} color={colors.coral} />
      </Pressable>
    </View>
  );
}

export default function DeviceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: device, isLoading: deviceLoading } = useDevice(id);
  const { data: activityLogs } = useActivityLogs(id);
  const { data: rules, isLoading: rulesLoading } = useRules(id);
  const { data: children } = useChildren();
  const sendCommand = useSendCommand();
  const deleteRule = useDeleteRule();
  const updateRule = useUpdateRule();
  const [activeTab, setActiveTab] = useState<Tab>("activity");

  if (deviceLoading || !device) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.forest} />
      </View>
    );
  }

  const childName = children?.find(
    (c) => c.id === device.child_profile_id,
  )?.name;
  const activity = activityLogs ?? [];
  const ruleList = rules ?? [];

  const handleKillSwitch = (enable: boolean) => {
    sendCommand.mutate({
      device_id: device.id,
      command_type: enable ? "restore_internet" : "kill_internet",
    });
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <Card style={styles.headerCard}>
        <View style={styles.deviceHeader}>
          <View>
            <Text style={styles.deviceName}>{device.name}</Text>
            <Text style={styles.childLabel}>
              {childName ?? "Unassigned"} · {device.platform}
            </Text>
          </View>
          <View style={styles.statusChip}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: device.is_online
                    ? colors.success
                    : colors.stone,
                },
              ]}
            />
            <Text style={styles.statusText}>
              {device.is_online ? "Online" : "Offline"}
            </Text>
          </View>
        </View>
        <View style={styles.killSwitchRow}>
          <View>
            <Text style={styles.killTitle}>Internet Access</Text>
            <Text style={styles.killSub}>
              Send kill/restore command to device
            </Text>
          </View>
          <View style={styles.killButtons}>
            <Pressable
              style={[styles.killBtn, styles.killBtnDanger]}
              onPress={() => handleKillSwitch(false)}
            >
              <Ionicons name="close-circle" size={16} color={colors.white} />
              <Text style={styles.killBtnText}>Kill</Text>
            </Pressable>
            <Pressable
              style={[styles.killBtn, styles.killBtnRestore]}
              onPress={() => handleKillSwitch(true)}
            >
              <Ionicons name="checkmark-circle" size={16} color={colors.white} />
              <Text style={styles.killBtnText}>Restore</Text>
            </Pressable>
          </View>
        </View>
      </Card>

      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tab, activeTab === "activity" && styles.tabActive]}
          onPress={() => setActiveTab("activity")}
        >
          <Ionicons
            name="list-outline"
            size={16}
            color={activeTab === "activity" ? colors.forest : colors.stone}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "activity" && styles.tabTextActive,
            ]}
          >
            Activity
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "rules" && styles.tabActive]}
          onPress={() => setActiveTab("rules")}
        >
          <Ionicons
            name="shield-outline"
            size={16}
            color={activeTab === "rules" ? colors.forest : colors.stone}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "rules" && styles.tabTextActive,
            ]}
          >
            Rules ({ruleList.length})
          </Text>
        </Pressable>
      </View>

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
            onPress={() =>
              router.push({
                pathname: "/add-rule",
                params: { deviceId: device.id },
              })
            }
          >
            <Ionicons
              name="add-circle-outline"
              size={20}
              color={colors.forest}
            />
            <Text style={styles.addRuleText}>Add Rule</Text>
          </Pressable>
          <Card>
            {ruleList.length === 0 ? (
              <Text style={styles.emptyText}>No rules configured</Text>
            ) : (
              ruleList.map((rule) => (
                <RuleItem
                  key={rule.id}
                  rule={rule}
                  onToggle={() =>
                    updateRule.mutate({
                      ruleId: rule.id,
                      enabled: !rule.enabled,
                    })
                  }
                  onDelete={() => deleteRule.mutate(rule.id)}
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
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
  killButtons: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  killBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  killBtnDanger: {
    backgroundColor: colors.coral,
  },
  killBtnRestore: {
    backgroundColor: colors.forest,
  },
  killBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.white,
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
