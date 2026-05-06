import { useQuery } from "@tanstack/react-query";
import { getWishlist } from "../api/wishlist";

export const wishlistKeys = {
  all: ["wishlist"] as const,
  items: () => [...wishlistKeys.all, "items"] as const,
};

export function useWishlist() {
  return useQuery({
    queryKey: wishlistKeys.items(),
    queryFn: getWishlist,
    staleTime: 30_000,
    retry: 1,
  });
}
