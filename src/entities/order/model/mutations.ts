import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createOrder, updateOrderStatus } from "../api/order";
import type { CreateOrderRequest } from "./types";
import { orderKeys } from "./queries";

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, idempotencyKey }: { data: CreateOrderRequest; idempotencyKey: string }) => {
      return createOrder(data, idempotencyKey);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}

export function useUpdateOrderStatus(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: string) => updateOrderStatus(orderId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      void queryClient.invalidateQueries({ queryKey: orderKeys.sales() });
    },
  });
}
