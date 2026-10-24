import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import type { ActivityLog, DailySummary } from "../types/api";

export function useActivityLogs(deviceId: string, limit = 50) {
  return useQuery({
    queryKey: ["activity", deviceId, limit],
    queryFn: () =>
      apiFetch<ActivityLog[]>(
        `/activity/logs?device_id=${deviceId}&limit=${limit}`,
      ),
    enabled: !!deviceId,
  });
}

export function useActivitySummary(deviceId: string, day?: string) {
  return useQuery({
    queryKey: ["activity-summary", deviceId, day],
    queryFn: () => {
      const params = day ? `?day=${day}` : "";
      return apiFetch<DailySummary>(`/activity/summary/${deviceId}${params}`);
    },
    enabled: !!deviceId,
  });
}
