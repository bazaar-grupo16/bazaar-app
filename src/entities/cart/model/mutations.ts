import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSessionUserId } from "@/shared/auth";
import {
  addToCart,
  removeCartItem,
  clearCart,
  incrementCartItem,
  decrementCartItem,
} from "../api/cart";
import { cartKeys } from "./queries";

export function useAddToCart() {
  const queryClient = useQueryClient();
  const userId = useSessionUserId();

  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity?: number }) => {
      if (!userId) throw new Error("No user ID found");
      return addToCart(userId, productId, quantity);
    },
    onSuccess: () => {
      if (userId) void queryClient.invalidateQueries({ queryKey: cartKeys.byUser(userId) });
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  const userId = useSessionUserId();

  return useMutation({
    mutationFn: (productId: string) => {
      if (!userId) throw new Error("No user ID found");
      return removeCartItem(userId, productId);
    },
    onSuccess: () => {
      if (userId) void queryClient.invalidateQueries({ queryKey: cartKeys.byUser(userId) });
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();
  const userId = useSessionUserId();

  return useMutation({
    mutationFn: () => {
      if (!userId) throw new Error("No user ID found");
      return clearCart(userId);
    },
    onSuccess: () => {
      if (userId) void queryClient.invalidateQueries({ queryKey: cartKeys.byUser(userId) });
    },
  });
}

export function useIncrementCartItem() {
  const queryClient = useQueryClient();
  const userId = useSessionUserId();

  return useMutation({
    mutationFn: ({
      productId,
      quantity,
    }: {
      productId: string;
      quantity: number;
    }) => {
      if (!userId) throw new Error("No user ID found");
      return incrementCartItem(userId, productId, quantity);
    },
    onSuccess: () => {
      if (userId) void queryClient.invalidateQueries({ queryKey: cartKeys.byUser(userId) });
    },
  });
}

export function useDecrementCartItem() {
  const queryClient = useQueryClient();
  const userId = useSessionUserId();

  return useMutation({
    mutationFn: ({
      productId,
      quantity,
    }: {
      productId: string;
      quantity: number;
    }) => {
      if (!userId) throw new Error("No user ID found");
      return decrementCartItem(userId, productId, quantity);
    },
    onSuccess: () => {
      if (userId) void queryClient.invalidateQueries({ queryKey: cartKeys.byUser(userId) });
    },
  });
}
