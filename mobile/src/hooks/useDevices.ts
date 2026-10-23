import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import type { Device, PairingCode } from "../types/api";

export function useDevices() {
  return useQuery({
    queryKey: ["devices"],
    queryFn: () => apiFetch<Device[]>("/devices"),
  });
}

export function useDevice(id: string) {
  return useQuery({
    queryKey: ["devices", id],
    queryFn: () => apiFetch<Device>(`/devices/${id}`),
    enabled: !!id,
  });
}

export function useGeneratePairingCode() {
  return useMutation({
    mutationFn: () =>
      apiFetch<PairingCode>("/devices/pairing-code", { method: "POST" }),
  });
}

export function useToggleInternet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ deviceId, enabled }: { deviceId: string; enabled: boolean }) =>
      apiFetch("/commands", {
        method: "POST",
        body: JSON.stringify({
          device_id: deviceId,
          command_type: enabled ? "restore_internet" : "kill_internet",
          payload: {},
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
  });
}
