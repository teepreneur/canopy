import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import type { Alert } from "../types/api";

export function useAlerts(familyId?: string) {
  return useQuery({
    queryKey: ["alerts", familyId],
    queryFn: () => {
      const params = familyId ? `?family_id=${familyId}` : "";
      return apiFetch<Alert[]>(`/alerts${params}`);
    },
  });
}

export function useMarkAlertReviewed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (alertId: string) =>
      apiFetch(`/alerts/${alertId}`, {
        method: "PUT",
        body: JSON.stringify({ is_reviewed: true }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}
