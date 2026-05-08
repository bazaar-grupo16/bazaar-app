import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createOrder } from "../api/order";
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
