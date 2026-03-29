import { useMutation, useQuery } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export interface LeaderboardEntry {
  id: string;
  userId: string;
  username: string;
  minecraftUsername: string | null;
  hearts: number;
  kills: number;
  owoBalance: number;
  activeRank: string | null;
  avatarUrl: string | null;
  updatedAt: string;
  rank: number;
}

export const useAdminGetLeaderboard = (options?: { query?: object }) => {
  return useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/admin/leaderboard"],
    queryFn: () => customFetch("/api/admin/leaderboard", { method: "GET" }),
    ...(options?.query ?? {}),
  });
};

export const useAdminUpdateLeaderboardStats = () => {
  return useMutation<
    LeaderboardEntry,
    Error,
    { userId: string; data: { hearts?: number; kills?: number; owoBalance?: number; activeRank?: string; minecraftUsername?: string } }
  >({
    mutationFn: ({ userId, data }) =>
      customFetch(`/api/admin/leaderboard/${userId}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }),
  });
};

export const useAdminSetUserRole = () => {
  return useMutation<
    { message: string },
    Error,
    { userId: string; role: "user" | "moderator" | "admin" }
  >({
    mutationFn: ({ userId, role }) =>
      customFetch(`/api/admin/users/${userId}/role`, {
        method: "POST",
        body: JSON.stringify({ role }),
        headers: { "Content-Type": "application/json" },
      }),
  });
};

export const useAdminSyncLeaderboard = () => {
  return useMutation<{ message: string }, Error, void>({
    mutationFn: () =>
      customFetch("/api/admin/leaderboard/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
  });
};
