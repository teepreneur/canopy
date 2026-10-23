import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { colors } from "../../lib/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.forest,
        tabBarInactiveTintColor: colors.stone,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
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
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: "Alerts",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" size={size} color={color as string} />
          ),
        }}
      />
    </Tabs>
  );
}
