import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelOrder, cancelSaleItem, confirmItemDelivery, createOrder, updateOrderStatus, updateSaleItemStatus } from "../api/order";
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

export function useCancelOrder(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => cancelOrder(orderId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      void queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}

export function useCancelSaleItem(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => cancelSaleItem(orderId, itemId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...orderKeys.sales(), "detail", orderId] });
      void queryClient.invalidateQueries({ queryKey: [...orderKeys.sales(), "items", orderId] });
    },
  });
}

export function useUpdateSaleItemStatus(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, status }: { itemId: string; status: string }) =>
      updateSaleItemStatus(orderId, itemId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...orderKeys.sales(), "detail", orderId] });
    },
  });
}

export function useConfirmItemDelivery(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => confirmItemDelivery(orderId, itemId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      void queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}
