import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useActivityLogs } from "../../hooks/useActivity";
import { useChildren } from "../../hooks/useFamily";
import { useDevices } from "../../hooks/useDevices";
import { colors, spacing } from "../../lib/theme";
import type { ActivityLog } from "../../types/api";

function timeOfDay(timestamp: string): string {
  const d = new Date(timestamp);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  const hr = Math.floor(m / 60);
  return `${hr}h ${m % 60}m`;
}

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const MOCK_WEEKLY = [3.2, 4.5, 2.8, 3.9, 5.0, 4.1, 2.2];
const MAX_BAR = Math.max(...MOCK_WEEKLY);

function barColor(val: number, isToday: boolean): string {
  if (isToday) return colors.forest;
  if (val >= 4.5) return colors.sunlight;
  if (val >= 3.0) return colors.sage + "B3"; // 70% opacity
  return colors.sage + "80"; // 50% opacity
}

function WeeklyBarChart() {
  const avg = (MOCK_WEEKLY.reduce((a, b) => a + b, 0) / MOCK_WEEKLY.length).toFixed(1);
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>This week</Text>
      <View style={styles.barChart}>
        {MOCK_WEEKLY.map((val, i) => {
          const isToday = i === MOCK_WEEKLY.length - 1;
          const heightPct = (val / MAX_BAR) * 100;
          return (
            <View key={i} style={styles.barCol}>
              <Text style={styles.barVal}>{val.toFixed(1)}</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${heightPct}%`,
                      backgroundColor: barColor(val, isToday),
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.barLabel,
                  isToday && { color: colors.forest, fontWeight: "800" },
                ]}
              >
                {DAYS[i]}
              </Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.barAvg}>Avg {avg}h / day</Text>
    </View>
  );
}

const CATEGORIES = [
  { name: "Education", color: colors.forest, pct: 75, val: "1h 42m" },
  { name: "Entertainment", color: colors.sunlight, pct: 52, val: "1h 10m" },
  { name: "Social", color: colors.coral, pct: 30, val: "38m" },
  { name: "Gaming", color: "#4a7fb5", pct: 20, val: "25m" },
];

function CategoriesCard() {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Categories</Text>
      {CATEGORIES.map((cat, i) => (
        <View
          key={cat.name}
          style={[styles.catRow, i > 0 && styles.catRowBorder]}
        >
          <View style={[styles.catDot, { backgroundColor: cat.color }]} />
          <Text style={styles.catName}>{cat.name}</Text>
          <View style={styles.catBarWrap}>
            <View
              style={[
                styles.catBarFill,
                { width: `${cat.pct}%`, backgroundColor: cat.color },
              ]}
            />
          </View>
          <Text style={styles.catVal}>{cat.val}</Text>
        </View>
      ))}
    </View>
  );
}

function TimelineItem({ log }: { log: ActivityLog }) {
  const isWeb = log.activity_type === "site_visit";
  const isBlocked = log.title?.toLowerCase().includes("block") ?? false;

  const iconStyle = isBlocked
    ? styles.tlIconBlocked
    : isWeb
      ? styles.tlIconWeb
      : styles.tlIconApp;

  const iconName: keyof typeof Ionicons.glyphMap = isBlocked
    ? "ban-outline"
    : isWeb
      ? "globe-outline"
      : "grid-outline";

  const iconColor = isBlocked
    ? colors.coral
    : isWeb
      ? colors.forest
      : colors.sunlight;

  return (
    <View style={styles.tlRow}>
      <View style={[styles.tlIcon, iconStyle]}>
        <Ionicons name={iconName} size={16} color={iconColor} />
      </View>
      <View style={styles.tlBody}>
        <Text
          style={[styles.tlName, isBlocked && { color: colors.coral }]}
        >
          {log.title ?? log.target}
        </Text>
        <Text style={styles.tlMeta}>
          {isBlocked
            ? "Blocked"
            : isWeb
              ? "Site"
              : "App"}
          {log.duration_seconds > 0
            ? ` · ${formatDuration(log.duration_seconds)}`
            : ""}
        </Text>
      </View>
      <Text style={styles.tlTime}>{timeOfDay(log.timestamp)}</Text>
    </View>
  );
}

export default function ActivityScreen() {
  const { data: children } = useChildren();
  const { data: devices } = useDevices();
  const [selectedChild, setSelectedChild] = useState<string | null>(null);

  const childList = children ?? [];
  const deviceList = devices ?? [];

  const deviceId = (() => {
    if (!selectedChild) return deviceList[0]?.id;
    const childDevices = deviceList.filter(
      (d) => d.child_profile_id === selectedChild,
    );
    return childDevices[0]?.id;
  })();

  const { data: activityLogs, isLoading } = useActivityLogs(deviceId);
  const activity = activityLogs ?? [];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Activity</Text>
      </View>

      {/* Child pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pills}
      >
        {childList.map((child) => (
          <Pressable
            key={child.id}
            style={[
              styles.pill,
              selectedChild === child.id && styles.pillActive,
            ]}
            onPress={() =>
              setSelectedChild(
                selectedChild === child.id ? null : child.id,
              )
            }
          >
            <Text
              style={[
                styles.pillText,
                selectedChild === child.id && styles.pillTextActive,
              ]}
            >
              {child.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Weekly bar chart */}
      <WeeklyBarChart />

      {/* Categories */}
      <CategoriesCard />

      {/* Timeline */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today</Text>
        {isLoading ? (
          <ActivityIndicator
            size="small"
            color={colors.forest}
            style={{ paddingVertical: spacing.lg }}
          />
        ) : activity.length === 0 ? (
          <Text style={styles.emptyText}>No activity recorded yet</Text>
        ) : (
          activity.map((log) => <TimelineItem key={log.id} log={log} />)
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  pills: {
    gap: 7,
    marginBottom: 18,
    paddingVertical: 2,
  },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.stone,
  },
  pillTextActive: {
    color: "#fff",
  },

  // Bar chart
  barChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    height: 120,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  barTrack: {
    flex: 1,
    width: "100%",
    maxWidth: 28,
    justifyContent: "flex-end",
  },
  bar: {
    width: "100%",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    minHeight: 4,
  },
  barVal: {
    fontSize: 9,
    fontWeight: "800",
    color: colors.stone,
  },
  barLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.stone,
  },
  barAvg: {
    textAlign: "center",
    fontSize: 10,
    color: colors.stone,
    fontWeight: "600",
    marginTop: 8,
  },

  // Cards
  card: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    shadowColor: "#2A3130",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.earth,
    marginBottom: 14,
  },

  // Categories
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  catRowBorder: {
    borderTopWidth: 1,
    borderTopColor: "#edeae4",
  },
  catDot: {
    width: 12,
    height: 12,
    borderRadius: 4,
  },
  catName: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
    color: colors.earth,
  },
  catBarWrap: {
    width: 70,
    height: 6,
    backgroundColor: colors.meadow,
    borderRadius: 3,
    overflow: "hidden",
  },
  catBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  catVal: {
    fontSize: 12,
    fontWeight: "800",
    width: 48,
    textAlign: "right",
    color: colors.earth,
  },

  // Timeline
  tlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#edeae4",
  },
  tlIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tlIconWeb: {
    backgroundColor: "#e8f4ee",
  },
  tlIconApp: {
    backgroundColor: "#fdf4e4",
  },
  tlIconBlocked: {
    backgroundColor: "#fbeae6",
  },
  tlBody: {
    flex: 1,
  },
  tlName: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.earth,
  },
  tlMeta: {
    fontSize: 11,
    color: colors.stone,
    marginTop: 1,
  },
  tlTime: {
    fontSize: 11,
    color: colors.stone,
  },
  emptyText: {
    textAlign: "center",
    color: colors.stone,
    paddingVertical: spacing.lg,
  },
});
