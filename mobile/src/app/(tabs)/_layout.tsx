import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet, View, Text } from "react-native";
import { colors } from "../../lib/theme";
import { useAlerts } from "../../hooks/useAlerts";

function AlertBadge() {
  const { data: alerts } = useAlerts(false);
  const count = alerts?.filter((a) => !a.acknowledged).length ?? 0;
  if (count === 0) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 9 ? "9+" : count}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.forest,
        tabBarInactiveTintColor: colors.stone,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          height: 72,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          letterSpacing: 0.2,
        },
        headerStyle: { backgroundColor: colors.meadow },
        headerTintColor: colors.earth,
        headerTitleStyle: { fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={22} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: "Activity",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pulse" size={22} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: "Alerts",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons
                name="notifications"
                size={22}
                color={color as string}
              />
              <AlertBadge />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="boundaries"
        options={{
          title: "Boundaries",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shield" size={22} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="devices"
        options={{
          title: "Devices",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="laptop" size={22} color={color as string} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -4,
    right: -10,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: colors.coral,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.white,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.white,
  },
});
