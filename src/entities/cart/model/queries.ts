import { useQuery } from "@tanstack/react-query";
import { getCart } from "../api/cart";

export const cartKeys = {
  all: ["cart"] as const,
  byUser: (userId: number) => [...cartKeys.all, userId] as const,
};

export function useCart(userId: number) {
  return useQuery({
    queryKey: cartKeys.byUser(userId),
    queryFn: () => getCart(userId),
  });
}
