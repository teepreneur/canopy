import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../lib/auth";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { colors } from "../lib/theme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function NotificationSetup({ children }: { children: React.ReactNode }) {
  usePushNotifications();
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationSetup>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.meadow },
            headerTintColor: colors.earth,
            headerTitleStyle: { fontWeight: "600" },
            contentStyle: { backgroundColor: colors.meadow },
          }}
        >
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="device/[id]" options={{ title: "Device" }} />
          <Stack.Screen name="add-device" options={{ title: "Add Device", presentation: "modal" }} />
          <Stack.Screen name="add-rule" options={{ title: "Add Rule", presentation: "modal" }} />
          <Stack.Screen name="settings" options={{ title: "Settings" }} />
          <Stack.Screen name="location" options={{ title: "Location", headerShown: false }} />
        </Stack>
        </NotificationSetup>
      </AuthProvider>
    </QueryClientProvider>
  );
}
