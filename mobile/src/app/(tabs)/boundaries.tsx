import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useDevices, useSendCommand } from "../../hooks/useDevices";
import { useRules, useUpdateRule, useDeleteRule } from "../../hooks/useRules";
import { useChildren } from "../../hooks/useFamily";
import { colors, spacing, borderRadius } from "../../lib/theme";
import type { ChildProfile, Device, Rule } from "../../types/api";

function ChildInternetRow({
  child,
  devices,
}: {
  child: ChildProfile;
  devices: Device[];
}) {
  const sendCommand = useSendCommand();
  const childDevices = devices.filter(
    (d) => d.child_profile_id === child.id,
  );
  const isOnline = childDevices.some((d) => d.is_online);
  const device = childDevices[0];

  const AVATAR_COLORS = [colors.sunlight, colors.sage, "#c9947d", colors.stone];
  const colorIndex = child.name.charCodeAt(0) % AVATAR_COLORS.length;

  return (
    <View style={[styles.childRow, !isOnline && { opacity: 0.5 }]}>
      <View
        style={[
          styles.childAvatar,
          { backgroundColor: AVATAR_COLORS[colorIndex] },
        ]}
      >
        <Text style={styles.childAvatarText}>
          {child.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.childInfo}>
        <Text style={styles.childName}>{child.name}</Text>
        <Text style={styles.childMeta}>
          {device?.name ?? "No device"}{isOnline ? "" : " · Offline"}
        </Text>
      </View>
      <Switch
        value={isOnline}
        trackColor={{ false: colors.border, true: colors.sage }}
        thumbColor={isOnline ? colors.forest : colors.stone}
        onValueChange={(value) => {
          if (device) {
            sendCommand.mutate({
              device_id: device.id,
              command_type: value ? "restore_internet" : "kill_internet",
            });
          }
        }}
      />
    </View>
  );
}

const RULE_CARD_STYLES: Record<
  string,
  { colors: [string, string]; iconBg: string; iconColor: string; textColor: string }
> = {
  block_site: {
    colors: ["#fbeae6", "#f5d2ca"],
    iconBg: "rgba(212,101,74,0.15)",
    iconColor: colors.coral,
    textColor: "#7a3020",
  },
  block_app: {
    colors: ["#e8f0f8", "#d4e3f2"],
    iconBg: "rgba(74,127,181,0.12)",
    iconColor: "#4a7fb5",
    textColor: "#1e3a5a",
  },
  schedule: {
    colors: ["#fdf4e4", "#fcecd0"],
    iconBg: "rgba(232,168,56,0.15)",
    iconColor: colors.sunlight,
    textColor: "#6a5010",
  },
};

function RuleCard({ rule }: { rule: Rule }) {
  const style = RULE_CARD_STYLES[rule.rule_type] ?? RULE_CARD_STYLES.block_site;
  const icon =
    rule.rule_type === "block_site"
      ? "ban-outline"
      : rule.rule_type === "block_app"
        ? "shield-outline"
        : "time-outline";

  return (
    <LinearGradient
      colors={style.colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.ruleCard}
    >
      <View style={[styles.ruleIcon, { backgroundColor: style.iconBg }]}>
        <Ionicons name={icon as any} size={18} color={style.iconColor} />
      </View>
      <Text style={[styles.ruleTitle, { color: style.textColor }]}>
        {rule.target}
      </Text>
      <Text style={[styles.ruleSub, { color: style.textColor }]}>
        {rule.rule_type === "block_site"
          ? "Block Site"
          : rule.rule_type === "block_app"
            ? "Block App"
            : "Schedule"}
      </Text>
      {rule.schedule_days && rule.schedule_start && (
        <Text style={[styles.ruleSub, { color: style.textColor }]}>
          {rule.schedule_days.join(", ")} · {rule.schedule_start}–
          {rule.schedule_end}
        </Text>
      )}
    </LinearGradient>
  );
}

export default function BoundariesScreen() {
  const { data: devices, isLoading: devicesLoading } = useDevices();
  const { data: children } = useChildren();
  const { data: rules, isLoading: rulesLoading } = useRules();
  const sendCommand = useSendCommand();

  const deviceList = devices ?? [];
  const childList = children ?? [];
  const ruleList = rules ?? [];

  if (devicesLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.forest} />
      </View>
    );
  }

  const handlePauseAll = (pause: boolean) => {
    deviceList.forEach((device) => {
      sendCommand.mutate({
        device_id: device.id,
        command_type: pause ? "kill_internet" : "restore_internet",
      });
    });
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Boundaries</Text>
      </View>

      {/* Kill switch */}
      <Pressable onPress={() => handlePauseAll(true)}>
        <LinearGradient
          colors={["#fbeae6", "#f9d4cc"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.killSwitch}
        >
          <View style={styles.ksDecorCircle} />
          <View style={styles.ksIcon}>
            <Ionicons name="power" size={26} color={colors.coral} />
          </View>
          <View style={styles.ksInfo}>
            <Text style={styles.ksTitle}>Pause All Internet</Text>
            <Text style={styles.ksSub}>All devices, right now</Text>
          </View>
          <Switch
            value={true}
            trackColor={{ false: colors.border, true: colors.forest }}
            thumbColor={colors.white}
          />
        </LinearGradient>
      </Pressable>

      {/* Per child internet */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Internet by child</Text>
        {childList.map((child) => (
          <ChildInternetRow
            key={child.id}
            child={child}
            devices={deviceList}
          />
        ))}
      </View>

      {/* Active rules */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active rules</Text>
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/add-rule",
                params: { deviceId: deviceList[0]?.id },
              })
            }
          >
            <Ionicons
              name="add-circle-outline"
              size={24}
              color={colors.forest}
            />
          </Pressable>
        </View>
        <View style={styles.ruleGrid}>
          {ruleList.length === 0 ? (
            <Text style={styles.emptyText}>No rules configured yet</Text>
          ) : (
            ruleList.map((rule) => <RuleCard key={rule.id} rule={rule} />)
          )}
        </View>
      </View>
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
  header: {
    paddingTop: 56,
    paddingBottom: 14,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.earth,
    letterSpacing: -0.5,
  },
  killSwitch: {
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
    overflow: "hidden",
    shadowColor: "#2A3130",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  ksDecorCircle: {
    position: "absolute",
    right: -20,
    bottom: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(212,101,74,0.1)",
  },
  ksIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(212,101,74,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  ksInfo: {
    flex: 1,
  },
  ksTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#8b3a2a",
  },
  ksSub: {
    fontSize: 12,
    color: "#b8574a",
    marginTop: 2,
    fontWeight: "600",
  },
  section: {
    marginBottom: 26,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.earth,
    marginBottom: spacing.sm,
  },
  childRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    marginBottom: 8,
    shadowColor: "#2A3130",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  childAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  childAvatarText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#fff",
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.earth,
  },
  childMeta: {
    fontSize: 11,
    color: colors.stone,
    marginTop: 1,
  },
  ruleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  ruleCard: {
    width: "48%",
    flexGrow: 1,
    borderRadius: 14,
    padding: 16,
  },
  ruleIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  ruleTitle: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 16,
  },
  ruleSub: {
    fontSize: 10,
    marginTop: 4,
    opacity: 0.6,
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    color: colors.stone,
    paddingVertical: spacing.lg,
    width: "100%",
  },
});
