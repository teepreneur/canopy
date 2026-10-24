import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import type {
  LocationUpdate,
  Geofence,
  GeofenceCreate,
} from "../types/api";

export function useLatestLocations() {
  return useQuery({
    queryKey: ["locations", "latest"],
    queryFn: () => apiFetch<LocationUpdate[]>("/location/latest"),
    refetchInterval: 60_000,
  });
}

export function useLocationHistory(childProfileId: string | undefined) {
  return useQuery({
    queryKey: ["locations", "history", childProfileId],
    queryFn: () =>
      apiFetch<LocationUpdate[]>(
        `/location/history/${childProfileId}?limit=50`,
      ),
    enabled: !!childProfileId,
  });
}

export function useGeofences() {
  return useQuery({
    queryKey: ["geofences"],
    queryFn: () => apiFetch<Geofence[]>("/location/geofences"),
  });
}

export function useCreateGeofence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: GeofenceCreate) =>
      apiFetch<Geofence>("/location/geofences", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["geofences"] });
    },
  });
}

export function useDeleteGeofence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/location/geofences/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["geofences"] });
    },
  });
}
