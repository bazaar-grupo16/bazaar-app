import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  addToCart,
  removeCartItem,
  clearCart,
  incrementCartItem,
  decrementCartItem,
} from "../api/cart";
import { cartKeys } from "./queries";

export function useAddToCart(userId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: number) => addToCart(userId, productId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cartKeys.byUser(userId) });
    },
  });
}

export function useRemoveCartItem(userId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: number) => removeCartItem(userId, productId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cartKeys.byUser(userId) });
    },
  });
}

export function useClearCart(userId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => clearCart(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cartKeys.byUser(userId) });
    },
  });
}

export function useIncrementCartItem(userId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      quantity,
    }: {
      productId: number;
      quantity: number;
    }) => incrementCartItem(userId, productId, quantity),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cartKeys.byUser(userId) });
    },
  });
}

export function useDecrementCartItem(userId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      quantity,
    }: {
      productId: number;
      quantity: number;
    }) => decrementCartItem(userId, productId, quantity),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cartKeys.byUser(userId) });
    },
  });
}
