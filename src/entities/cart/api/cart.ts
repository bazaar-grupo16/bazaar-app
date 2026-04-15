import { ApiError } from "@/shared/api";
import type { CartItemResponse, CartResponse } from "../model/types";

const CART_BASE_URL = process.env.EXPO_PUBLIC_CART_BASE_URL;

function getCartBaseUrl() {
  if (!CART_BASE_URL) {
    throw new Error("Missing EXPO_PUBLIC_CART_BASE_URL");
  }

  return CART_BASE_URL.replace(/\/$/, "");
}

function buildCartUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getCartBaseUrl()}${normalizedPath}`;
}

async function handleErrorResponse(response: Response) {
  let details: unknown;

  try {
    details = await response.json();
  } catch {
    details = await response.text();
  }

  if (process.env.NODE_ENV !== "production") {
    console.warn("Cart API request failed", {
      url: response.url,
      status: response.status,
      details,
    });
  }

  throw new ApiError(response.statusText, response.status, details);
}

export async function cartGet<TResponse>(path: string): Promise<TResponse> {
  const url = buildCartUrl(path);
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    await handleErrorResponse(response);
  }

  return response.json() as Promise<TResponse>;
}

async function cartMutate(
  method: "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
): Promise<Response> {
  const url = buildCartUrl(path);

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : null,
  });

  if (!response.ok) {
    await handleErrorResponse(response);
  }

  return response;
}

// ---------- Endpoints ----------

export function getCart(userId: number) {
  return cartGet<CartResponse>(`/cart/${userId}`);
}

export function addToCart(userId: number, productId: number) {
  return cartMutate("POST", `/cart/${userId}/items`, { productId }).then(
    (res) => res.json() as Promise<CartItemResponse>,
  );
}

export function removeCartItem(userId: number, productId: number) {
  return cartMutate("DELETE", `/cart/${userId}/items/${productId}`);
}

export function clearCart(userId: number) {
  return cartMutate("DELETE", `/cart/${userId}`);
}

export function incrementCartItem(
  userId: number,
  productId: number,
  quantity: number,
) {
  return cartMutate("PUT", `/cart/${userId}/${productId}/increment`, {
    quantity,
  });
}

export function decrementCartItem(
  userId: number,
  productId: number,
  quantity: number,
) {
  return cartMutate("PUT", `/cart/${userId}/${productId}/decrement`, {
    quantity,
  });
}
