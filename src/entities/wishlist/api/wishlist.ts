import { apiGet, apiPost, apiDelete } from "@/shared/api/client";
import type {
  WishlistResponse,
  AddWishlistResponse,
  CheckWishlistResponse,
} from "../model/types";

export function getWishlist(): Promise<WishlistResponse> {
  return apiGet<WishlistResponse>("/wishlist/items");
}

export function addWishlistItem(productId: string): Promise<AddWishlistResponse> {
  return apiPost<AddWishlistResponse, { product_id: string }>("/wishlist/items", {
    product_id: productId,
  });
}

export function removeWishlistItem(productId: string): Promise<void> {
  return apiDelete<void>(`/wishlist/items/${productId}`);
}

export function checkWishlistItem(productId: string): Promise<CheckWishlistResponse> {
  return apiGet<CheckWishlistResponse>(`/wishlist/items/${productId}/check`);
}
