import { useQuery } from "@tanstack/react-query";
import { getOrder, getOrdersHistory } from "../api/order";
import { useSessionUserId } from "@/shared/auth";
import type { OrderResponse } from "./types";

export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (filters: string) => [...orderKeys.lists(), { filters }] as const,
  details: () => [...orderKeys.all, "detail"] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
};

export function useOrder(
  orderId: string | undefined, 
  refetchInterval?: number | false | ((query: any) => number | false)
) {
  const userId = useSessionUserId();
  return useQuery<OrderResponse, Error, OrderResponse>({
    queryKey: orderId ? orderKeys.detail(orderId) : [],
    queryFn: () => {
      if (!orderId) throw new Error("No order ID provided");
      return getOrder(orderId);
    },
    enabled: !!userId && !!orderId,
    refetchInterval,
  });
}

export function useOrdersHistory(page: number = 1, size: number = 20, status?: string) {
  const userId = useSessionUserId();
  const filters = JSON.stringify({ page, size, status });
  return useQuery({
    queryKey: orderKeys.list(filters),
    queryFn: () => getOrdersHistory(page, size, status),
    enabled: !!userId,
  });
}
