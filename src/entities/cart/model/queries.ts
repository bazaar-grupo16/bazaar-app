import { useQuery } from "@tanstack/react-query";
import { getCart } from "../api/cart";
import { useSessionUserId } from "@/shared/auth";

export const cartKeys = {
  all: ["cart"] as const,
  byUser: (userId: string) => [...cartKeys.all, userId] as const,
};

export function useCart() {
  const userId = useSessionUserId();
  return useQuery({
    queryKey: userId ? cartKeys.byUser(userId) : cartKeys.all,
    queryFn: () => {
      if (!userId) throw new Error("No user ID found");
      return getCart(userId);
    },
    enabled: !!userId,
    refetchInterval: 5000,
  });
}
