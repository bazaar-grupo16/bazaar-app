import { useQuery } from "@tanstack/react-query";
import { useSessionUserId } from "@/shared/auth";
import { getWishlist } from "../api/wishlist";

export const wishlistKeys = {
  all: ["wishlist"] as const,
  items: (userId: string | null | undefined) => [...wishlistKeys.all, "items", userId ?? "guest"] as const,
};

export function useWishlist(enabled = true) {
  const userId = useSessionUserId();

  return useQuery({
    queryKey: wishlistKeys.items(userId),
    queryFn: getWishlist,
    staleTime: 30_000,
    retry: 1,
    enabled: enabled && !!userId,
  });
}
