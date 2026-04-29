import axios from "axios";

import { ApiError } from "@/shared/api";
import { protectedApi } from "@/shared/api/http";
import type { CartItemResponse, CartResponse } from "../model/types";

function toApiError(error: unknown) {
  if (axios.isAxiosError(error) && error.response) {
    const responseData = error.response.data;
    const message =
      typeof responseData === "object" && responseData !== null && "detail" in responseData
        ? String((responseData as { detail?: unknown }).detail ?? error.response.statusText)
        : error.response.statusText || "Cart API request failed";

    return new ApiError(message, error.response.status, responseData);
  }

  return null;
}

async function wrapRequest<TResponse>(request: Promise<{ data: TResponse }>, operation: string) {
  try {
    const { data } = await request;
    return data;
  } catch (error) {
    const apiError = toApiError(error);

    if (apiError) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`Cart API request failed (${operation})`, {
          status: apiError.status,
          details: apiError.details,
        });
      }

      throw apiError;
    }

    throw error;
  }
}

// ---------- Endpoints ----------

export function getCart(userId: number) {
  return wrapRequest<CartResponse>(protectedApi.get(`/cart/${userId}`), "GET");
}

export function addToCart(userId: number, productId: string, quantity: number = 1) {
  return wrapRequest<CartItemResponse>(
    protectedApi.post(`/cart/${userId}/items`, { productId, quantity }),
    "POST",
  );
}

export function removeCartItem(userId: number, productId: string) {
  return wrapRequest<void>(protectedApi.delete(`/cart/${userId}/items/${productId}`), "DELETE");
}

export function clearCart(userId: number) {
  return wrapRequest<void>(protectedApi.delete(`/cart/${userId}`), "DELETE");
}

export function incrementCartItem(userId: number, productId: string, quantity: number) {
  return wrapRequest<void>(
    protectedApi.put(`/cart/${userId}/${productId}/increment`, { quantity }),
    "PUT",
  );
}

export function decrementCartItem(userId: number, productId: string, quantity: number) {
  return wrapRequest<void>(
    protectedApi.put(`/cart/${userId}/${productId}/decrement`, { quantity }),
    "PUT",
  );
}
