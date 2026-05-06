import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addWishlistItem, removeWishlistItem } from "../api/wishlist";
import { wishlistKeys } from "./queries";
import { ApiError } from "@/shared/api/client";
import type { WishlistResponse, WishlistItem } from "./types";

export function useAddToWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => addWishlistItem(productId),
    onMutate: async (productId: string) => {
      await queryClient.cancelQueries({ queryKey: wishlistKeys.items() });
      const previous = queryClient.getQueryData<WishlistResponse>(wishlistKeys.items());

      queryClient.setQueryData<WishlistResponse>(wishlistKeys.items(), (old) => {
        if (!old) return old;
        const optimistic: WishlistItem = {
          id: `optimistic-${productId}`,
          user_id: "",
          product_id: productId,
          added_at: new Date().toISOString(),
          name: null,
          price: null,
          image_url: null,
          in_stock: true,
          is_available: true,
          catalog_available: true,
        };
        return { items: [...old.items, optimistic], total: old.total + 1 };
      });

      return { previous };
    },
    onError: (err, _productId, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(wishlistKeys.items(), context.previous);
      }
      if (err instanceof ApiError && err.status === 409) return;
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: wishlistKeys.items() });
    },
  });
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => removeWishlistItem(productId),
    onMutate: async (productId: string) => {
      await queryClient.cancelQueries({ queryKey: wishlistKeys.items() });
      const previous = queryClient.getQueryData<WishlistResponse>(wishlistKeys.items());

      queryClient.setQueryData<WishlistResponse>(wishlistKeys.items(), (old) => {
        if (!old) return old;
        const filtered = old.items.filter((i) => i.product_id !== productId);
        return { items: filtered, total: filtered.length };
      });

      return { previous };
    },
    onError: (err, _productId, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(wishlistKeys.items(), context.previous);
      }
      if (err instanceof ApiError && err.status === 404) return;
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: wishlistKeys.items() });
    },
  });
}
