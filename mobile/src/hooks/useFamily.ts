import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import type {
  ChildProfile,
  ChildProfileCreate,
  Family,
  FamilyCreate,
} from "../types/api";

export function useFamily() {
  return useQuery({
    queryKey: ["family"],
    queryFn: () => apiFetch<Family>("/auth/family"),
    retry: false,
  });
}

export function useCreateFamily() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: FamilyCreate) =>
      apiFetch<Family>("/auth/family", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family"] });
    },
  });
}

export function useChildren() {
  return useQuery({
    queryKey: ["children"],
    queryFn: () => apiFetch<ChildProfile[]>("/auth/family/children"),
  });
}

export function useCreateChild() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ChildProfileCreate) =>
      apiFetch<ChildProfile>("/auth/family/children", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["children"] });
    },
  });
}
