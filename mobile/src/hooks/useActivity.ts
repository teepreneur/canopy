import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import type { ActivityLog, ActivitySummary } from "../types/api";

export function useActivityLogs(deviceId: string) {
  return useQuery({
    queryKey: ["activity", deviceId],
    queryFn: () => apiFetch<ActivityLog[]>(`/activity/logs?device_id=${deviceId}`),
    enabled: !!deviceId,
  });
}

export function useActivitySummary(deviceId: string) {
  return useQuery({
    queryKey: ["activity-summary", deviceId],
    queryFn: () => apiFetch<ActivitySummary>(`/activity/summary/${deviceId}`),
    enabled: !!deviceId,
  });
}
