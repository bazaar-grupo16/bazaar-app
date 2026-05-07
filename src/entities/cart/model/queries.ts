import { useQuery } from "@tanstack/react-query";
import { getCart } from "../api/cart";

export const cartKeys = {
  all: ["cart"] as const,
  byUser: (userId: string) => [...cartKeys.all, userId] as const,
};

export function useCart(userId: string) {
  return useQuery({
    queryKey: cartKeys.byUser(userId),
    queryFn: () => getCart(userId),
  });
}
