import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  addToCart,
  removeCartItem,
  clearCart,
  incrementCartItem,
  decrementCartItem,
} from "../api/cart";
import { cartKeys } from "./queries";

export function useAddToCart(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity?: number }) => addToCart(userId, productId, quantity),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cartKeys.byUser(userId) });
    },
  });
}

export function useRemoveCartItem(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => removeCartItem(userId, productId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cartKeys.byUser(userId) });
    },
  });
}

export function useClearCart(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => clearCart(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cartKeys.byUser(userId) });
    },
  });
}

export function useIncrementCartItem(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      quantity,
    }: {
      productId: string;
      quantity: number;
    }) => incrementCartItem(userId, productId, quantity),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cartKeys.byUser(userId) });
    },
  });
}

export function useDecrementCartItem(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      quantity,
    }: {
      productId: string;
      quantity: number;
    }) => decrementCartItem(userId, productId, quantity),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cartKeys.byUser(userId) });
    },
  });
}
