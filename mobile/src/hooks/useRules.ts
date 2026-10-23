import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import type { CreateRuleRequest, Rule } from "../types/api";

export function useRules(deviceId: string) {
  return useQuery({
    queryKey: ["rules", deviceId],
    queryFn: () => apiFetch<Rule[]>(`/rules?device_id=${deviceId}`),
    enabled: !!deviceId,
  });
}

export function useCreateRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rule: CreateRuleRequest) =>
      apiFetch<Rule>("/rules", {
        method: "POST",
        body: JSON.stringify(rule),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rules", variables.device_id] });
    },
  });
}

export function useDeleteRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ruleId, deviceId }: { ruleId: string; deviceId: string }) =>
      apiFetch(`/rules/${ruleId}`, { method: "DELETE" }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rules", variables.deviceId] });
    },
  });
}

export function useUpdateRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ruleId, ...body }: { ruleId: string; deviceId: string; is_active?: boolean; target?: string }) =>
      apiFetch(`/rules/${ruleId}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rules", variables.deviceId] });
    },
  });
}
