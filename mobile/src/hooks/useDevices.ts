import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import type { CommandCreate, Device, PairingCode, PairingCodeCreate } from "../types/api";

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
    mutationFn: (body?: PairingCodeCreate) =>
      apiFetch<PairingCode>("/devices/pairing-code", {
        method: "POST",
        body: JSON.stringify(body ?? {}),
      }),
  });
}

export function useSendCommand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cmd: CommandCreate) =>
      apiFetch("/commands", {
        method: "POST",
        body: JSON.stringify(cmd),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
  });
}
