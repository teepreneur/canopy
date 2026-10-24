import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import type { Rule, RuleCreate } from "../types/api";

export function useRules(deviceId?: string) {
  return useQuery({
    queryKey: ["rules", deviceId],
    queryFn: () => {
      const qs = deviceId ? `?device_id=${deviceId}` : "";
      return apiFetch<Rule[]>(`/rules${qs}`);
    },
  });
}

export function useCreateRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rule: RuleCreate) =>
      apiFetch<Rule>("/rules", {
        method: "POST",
        body: JSON.stringify(rule),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rules"] });
    },
  });
}

export function useDeleteRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ruleId: string) =>
      apiFetch(`/rules/${ruleId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rules"] });
    },
  });
}

export function useUpdateRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ruleId,
      ...body
    }: { ruleId: string } & Partial<RuleCreate>) =>
      apiFetch<Rule>(`/rules/${ruleId}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rules"] });
    },
  });
}
