import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "../../lib/auth";
import { useAlerts, useAcknowledgeAlert } from "../../hooks/useAlerts";
import { useDevices } from "../../hooks/useDevices";
import { useChildren } from "../../hooks/useFamily";
import { useActivityLogs } from "../../hooks/useActivity";
import { colors, spacing } from "../../lib/theme";
import { CanopyLogo } from "../../components/CanopyLogo";
import { ChildAvatar, getAvatarForChild } from "../../components/ChildAvatar";
import type { Alert as AlertType, ChildProfile, Device } from "../../types/api";

const SCREEN_WIDTH = Dimensions.get("window").width;
const HERO_CONTENT_WIDTH = SCREEN_WIDTH - 32 - 40; // minus padding and inner padding

const CHILD_COLORS: [string, string][] = [
  ["#fdf4e4", "#f8e6c4"],
  ["#e8f4ee", "#c8e4d4"],
  ["#fdf4ef", "#f0d8c8"],
  ["#e8f0f8", "#d4e3f2"],
];

const CHILD_AVATAR_COLORS = [
  colors.sunlight,
  colors.sage,
  "#c9947d",
  colors.stone,
];

function timeAgo(timestamp: string | null): string {
  if (!timestamp) return "never";
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface HeroSlide {
  childName: string;
  avatarColor: string;
  avatarInitial: string;
  avatarIndex: number;
  message: string;
  meta: string;
  category: string;
  ctaLabel?: string;
  ctaRoute?: string;
}

function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ index?: number | null }> }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    [],
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  return (
    <View>
      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <View style={styles.heroSlide}>
            <View style={styles.heroSlideAvatar}>
              <ChildAvatar id={getAvatarForChild(item.childName, item.avatarIndex)} size={40} />
            </View>
            <View style={styles.heroSlideBody}>
              <Text style={styles.heroSlideMsg}>
                <Text style={styles.heroSlideBold}>{item.childName}</Text>
                {" "}{item.message}
              </Text>
              <View style={styles.heroSlideMeta}>
                <Text style={styles.heroSlideMetaText}>{item.meta}</Text>
                <View style={styles.heroSlideDot} />
                <Text style={styles.heroSlideMetaText}>{item.category}</Text>
              </View>
              {item.ctaLabel && (
                <Pressable
                  style={styles.heroSlideCta}
                  onPress={() => {
                    if (item.ctaRoute) router.push(item.ctaRoute as any);
                  }}
                >
                  <Text style={styles.heroSlideCtaText}>{item.ctaLabel}</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}
      />
      {slides.length > 1 && (
        <View style={styles.heroDots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.heroDot,
                i === activeIndex && styles.heroDotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function ChildCard({
  child,
  index,
  devices,
}: {
  child: ChildProfile;
  index: number;
  devices: Device[];
}) {
  const childDevices = devices.filter((d) => d.child_profile_id === child.id);
  const isOnline = childDevices.some((d) => d.is_online);
  const gradientColors = CHILD_COLORS[index % 4];
  const avatarBg = CHILD_AVATAR_COLORS[index % 4];

  return (
    <Pressable
      style={styles.childCard}
      onPress={() => {
        const device = childDevices[0];
        if (device) router.push(`/device/${device.id}`);
      }}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.childGradient}
      >
        <View style={styles.childAvatar}>
          <ChildAvatar id={getAvatarForChild(child.name, index)} size={56} />
        </View>
        <Text style={styles.childName}>{child.name}</Text>
        <View style={styles.childStatus}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isOnline ? colors.success : colors.stone },
            ]}
          />
          <Text style={styles.childStatusText}>
            {isOnline ? "Online" : "Offline"}
          </Text>
        </View>
        <Text style={styles.childScreenTime}>
          {isOnline ? "Active" : "--"}
        </Text>
        <Text style={styles.childScreenLabel}>screen time</Text>
      </LinearGradient>
    </Pressable>
  );
}

function ActionCard({
  icon,
  title,
  subtitle,
  gradientColors,
  iconBg,
  iconColor,
  textColor,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  gradientColors: readonly [string, string];
  iconBg: string;
  iconColor: string;
  textColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.actionCard}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.actionGradient}
      >
        <View style={[styles.actionIcon, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={24} color={iconColor} />
        </View>
        <Text style={[styles.actionTitle, { color: textColor }]}>{title}</Text>
        <Text style={[styles.actionSub, { color: textColor }]}>{subtitle}</Text>
      </LinearGradient>
    </Pressable>
  );
}

function AlertPreviewCard({
  alert,
  childList,
  onAcknowledge,
}: {
  alert: AlertType;
  childList: ChildProfile[];
  onAcknowledge: (id: string) => void;
}) {
  const child = childList.find((c) => c.id === alert.child_profile_id);
  const childIndex = child ? childList.indexOf(child) : 0;

  return (
    <View style={styles.alertCard}>
      <View style={styles.alertTop}>
        <View style={styles.alertAvatar}>
          {child ? (
            <ChildAvatar id={getAvatarForChild(child.name, childIndex)} size={32} />
          ) : (
            <View style={[styles.alertAvatarFallback, { backgroundColor: colors.stone }]}>
              <Text style={styles.alertAvatarText}>?</Text>
            </View>
          )}
        </View>
        <Text style={styles.alertWho}>{child?.name ?? "Unknown"}</Text>
        <Text style={styles.alertWhen}>{timeAgo(alert.created_at)}</Text>
      </View>
      {alert.detail && (
        <View style={styles.alertMsgBg}>
          <Text style={styles.alertMsg}>{alert.detail}</Text>
        </View>
      )}
      {!alert.detail && alert.title && (
        <Text style={styles.alertWhat}>{alert.title}</Text>
      )}
      {alert.alert_type === "access_request" && !alert.acknowledged && (
        <View style={styles.alertBtns}>
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
        </View>
      )}
    </View>
  );
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const { data: devices, isLoading: devicesLoading } = useDevices();
  const { data: alerts } = useAlerts(false, 5);
  const { data: children } = useChildren();
  const acknowledge = useAcknowledgeAlert();

  const deviceList = devices ?? [];
  const childList = children ?? [];
  const recentAlerts = alerts ?? [];
  const onlineCount = deviceList.filter((d) => d.is_online).length;

  if (devicesLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.forest} />
      </View>
    );
  }

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const heroSlides: HeroSlide[] = childList.map((child, i) => ({
    childName: child.name,
    avatarColor: CHILD_AVATAR_COLORS[i % 4],
    avatarInitial: child.name.charAt(0).toUpperCase(),
    avatarIndex: i,
    message:
      i === 0
        ? "has been active online — a gentle check-in might be a good idea."
        : i === 1
          ? "visited new websites today — review them when you're free."
          : "has had a balanced day. Great habits growing!",
    meta: i === 0 ? "5 min ago" : i === 1 ? "12 min ago" : "Just now",
    category: i === 0 ? "Activity" : i === 1 ? "Browsing" : "Screen Time",
    ctaLabel: i < 2 ? "View activity" : undefined,
    ctaRoute: i < 2 ? "/(tabs)/activity" : undefined,
  }));

  if (heroSlides.length === 0) {
    heroSlides.push({
      childName: "Canopy",
      avatarColor: colors.forest,
      avatarInitial: "C",
      avatarIndex: 0,
      message: onlineCount > 0
        ? `${onlineCount} device${onlineCount > 1 ? "s" : ""} online. Everything looks good.`
        : "All devices are offline. Your boundaries are still active.",
      meta: "Just now",
      category: "Status",
    });
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.canopyMark}>
          <CanopyLogo size={28} color={colors.forest} />
          <Text style={styles.canopyText}>canopy</Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable
            style={styles.headerIcon}
            onPress={() => router.push("/(tabs)/alerts")}
          >
            <Ionicons name="notifications" size={20} color={colors.stone} />
            {recentAlerts.length > 0 && <View style={styles.notifDot} />}
          </Pressable>
          <Pressable
            style={styles.profileBtn}
            onPress={() => router.push("/settings")}
          >
            <Text style={styles.profileInitial}>
              {(user?.full_name ?? "P").charAt(0).toUpperCase()}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Greeting */}
      <View style={styles.greetingSection}>
        <Text style={styles.greetingHi}>{greeting}</Text>
        <Text style={styles.greetingName}>
          {user?.full_name?.split(" ").pop() ?? "Family"} Family
        </Text>
      </View>

      {/* AI Guide Hero with Carousel */}
      <LinearGradient
        colors={["#1B5E43", "#2a7d5c", "#74B49B"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        {/* Decorative circles */}
        <View style={styles.heroCircle1} />
        <View style={styles.heroCircle2} />

        <View style={styles.heroTop}>
          <View style={styles.heroTopLeft}>
            <CanopyLogo size={18} color="#fff" />
            <Text style={styles.heroTitle}>Your Guide</Text>
          </View>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>LIVE</Text>
          </View>
        </View>

        <HeroCarousel slides={heroSlides} />
      </LinearGradient>

      {/* Children */}
      {childList.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your children</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.childScroll}
          >
            {childList.map((child, i) => (
              <ChildCard
                key={child.id}
                child={child}
                index={i}
                devices={deviceList}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.actionsGrid}>
        <ActionCard
          icon="power"
          title="Pause Internet"
          subtitle="All devices"
          gradientColors={["#fbeae6", "#f9d4cc"]}
          iconBg="rgba(212,101,74,0.15)"
          iconColor={colors.coral}
          textColor="#8b3a2a"
          onPress={() => router.push("/(tabs)/boundaries")}
        />
        <ActionCard
          icon="eye"
          title="View Activity"
          subtitle="See what's happening"
          gradientColors={["#e8f4ee", "#d4eadf"]}
          iconBg="rgba(27,94,67,0.12)"
          iconColor={colors.forest}
          textColor="#1a4a32"
          onPress={() => router.push("/(tabs)/activity")}
        />
        <ActionCard
          icon="time"
          title="Set Limits"
          subtitle="Screen time rules"
          gradientColors={["#fdf4e4", "#fcecd0"]}
          iconBg="rgba(232,168,56,0.15)"
          iconColor={colors.sunlight}
          textColor="#7a5f1a"
          onPress={() => router.push("/(tabs)/boundaries")}
        />
        <ActionCard
          icon="location"
          title="Location"
          subtitle="Track & zones"
          gradientColors={["#e8f0f8", "#d4e3f2"]}
          iconBg="rgba(74,127,181,0.12)"
          iconColor="#4a7fb5"
          textColor="#2a4a6b"
          onPress={() => router.push("/location")}
        />
      </View>

      {/* Alerts Preview */}
      {recentAlerts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Needs your attention</Text>
            <Pressable onPress={() => router.push("/(tabs)/alerts")}>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>
          {recentAlerts.slice(0, 3).map((alert) => (
            <AlertPreviewCard
              key={alert.id}
              alert={alert}
              childList={childList}
              onAcknowledge={(id) => acknowledge.mutate(id)}
            />
          ))}
        </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 56,
    paddingBottom: spacing.sm,
  },
  canopyMark: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  canopyText: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.forest,
    letterSpacing: 0.2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitial: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: "#2A3130",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  notifDot: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.coral,
    borderWidth: 2,
    borderColor: colors.white,
  },
  greetingSection: {
    marginTop: 18,
    marginBottom: spacing.md,
  },
  greetingHi: {
    fontSize: 14,
    color: colors.stone,
    fontWeight: "600",
  },
  greetingName: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.earth,
    letterSpacing: -0.5,
    marginTop: 2,
  },

  // Hero card
  heroCard: {
    borderRadius: 20,
    padding: 18,
    paddingBottom: 16,
    marginBottom: spacing.lg,
    overflow: "hidden",
    shadowColor: "#2A3130",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 30,
    elevation: 8,
  },
  heroCircle1: {
    position: "absolute",
    right: -30,
    top: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  heroCircle2: {
    position: "absolute",
    right: 30,
    bottom: -40,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    zIndex: 1,
  },
  heroTopLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  heroBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  heroBadgeText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  // Hero carousel slides
  heroSlide: {
    width: SCREEN_WIDTH - 32 - 36, // account for heroCard padding
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingRight: 8,
  },
  heroSlideAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  heroSlideAvatarText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
  },
  heroSlideBody: {
    flex: 1,
  },
  heroSlideMsg: {
    fontSize: 13.5,
    color: "#fff",
    lineHeight: 19,
  },
  heroSlideBold: {
    fontWeight: "700",
  },
  heroSlideMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 5,
  },
  heroSlideMetaText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
  },
  heroSlideDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  heroSlideCta: {
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 14,
    alignSelf: "flex-start",
  },
  heroSlideCtaText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },
  heroDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 14,
    zIndex: 1,
  },
  heroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  heroDotActive: {
    width: 18,
    borderRadius: 4,
    backgroundColor: "#fff",
  },

  // Children section
  section: {
    marginBottom: spacing.lg,
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
  seeAll: {
    fontSize: 13,
    color: colors.forest,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  childScroll: {
    gap: 12,
    paddingRight: spacing.md,
  },
  childCard: {
    minWidth: 150,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#2A3130",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  childGradient: {
    padding: 18,
    alignItems: "center",
    borderRadius: 20,
  },
  childAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    overflow: "hidden",
  },
  childAvatarText: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
  },
  childName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1a1e1d",
    marginBottom: 4,
  },
  childStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  childStatusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#3a4240",
  },
  childScreenTime: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1a1e1d",
    marginTop: 10,
  },
  childScreenLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#5a6260",
  },

  // Actions
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: spacing.lg,
  },
  actionCard: {
    width: "48%",
    flexGrow: 1,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#2A3130",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  actionGradient: {
    padding: 20,
    paddingBottom: 16,
    borderRadius: 20,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
  },
  actionSub: {
    fontSize: 11,
    marginTop: 4,
    opacity: 0.6,
    fontWeight: "600",
  },

  // Alert preview cards (matching artifact style)
  alertCard: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 20,
    padding: spacing.md,
    marginBottom: 10,
    shadowColor: "#2A3130",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  alertTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  alertAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  alertAvatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  alertAvatarText: {
    fontSize: 14,
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
  alertMsg: {
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
  alertBtns: {
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
});
