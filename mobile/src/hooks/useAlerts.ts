import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import type { Alert, AlertAction } from "../types/api";

export function useAlerts(acknowledged?: boolean, limit = 50) {
  return useQuery({
    queryKey: ["alerts", acknowledged, limit],
    queryFn: () => {
      const params = new URLSearchParams();
      if (acknowledged !== undefined) params.set("acknowledged", String(acknowledged));
      params.set("limit", String(limit));
      const qs = params.toString();
      return apiFetch<Alert[]>(`/alerts?${qs}`);
    },
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (alertId: string) =>
      apiFetch<Alert>(`/alerts/${alertId}`, {
        method: "PUT",
        body: JSON.stringify({ status: "acknowledged" } satisfies AlertAction),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}
