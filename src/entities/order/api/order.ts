import axios from "axios";

import { ApiError } from "@/shared/api";
import { protectedApi } from "@/shared/api/http";
import type { CreateOrderRequest, OrderCreatedResponse, OrderItemResponse, OrderListResponse, OrderResponse } from "../model/types";

function toApiError(error: unknown) {
  if (axios.isAxiosError(error) && error.response) {
    const responseData = error.response.data;
    const message =
      typeof responseData === "object" && responseData !== null && "detail" in responseData
        ? String((responseData as { detail?: unknown }).detail ?? error.response.statusText)
        : error.response.statusText || "Order API request failed";

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
        console.warn(`Order API request failed (${operation})`, {
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

export function createOrder(
  data: CreateOrderRequest,
  idempotencyKey: string,
) {
  return wrapRequest<OrderCreatedResponse>(
    protectedApi.post("/orders", data, {
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
    }),
    "POST /orders",
  );
}

export function getOrder(orderId: string) {
  return wrapRequest<OrderResponse>(protectedApi.get(`/orders/${orderId}`), `GET /orders/${orderId}`);
}

export function getOrdersHistory(page: number = 1, size: number = 20, status?: string) {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });
  if (status) {
    params.append("order_status", status);
  }

  return wrapRequest<OrderListResponse>(
    protectedApi.get(`/orders?${params.toString()}`),
    "GET /orders",
  );
}

export function getSaleDetail(orderId: string) {
  return wrapRequest<OrderResponse>(
    protectedApi.get(`/orders/sales/${orderId}`),
    `GET /orders/sales/${orderId}`,
  );
}

export function updateOrderStatus(orderId: string, status: string, trackingCode?: string) {
  const payload = trackingCode ? { status, tracking_code: trackingCode } : { status };
  return wrapRequest<OrderResponse>(
    protectedApi.patch(`/orders/${orderId}/status`, payload),
    `PATCH /orders/${orderId}/status`,
  );
}

export function getSalesHistory(page: number = 1, size: number = 50, status?: string) {
  const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
  if (status) {
    params.append("order_status", status);
  }
  return wrapRequest<OrderListResponse>(
    protectedApi.get(`/orders/sales?${params.toString()}`),
    "GET /orders/sales",
  );
}

export function cancelOrder(orderId: string) {
  return wrapRequest<OrderResponse>(
    protectedApi.post(`/orders/${orderId}/cancel`),
    `POST /orders/${orderId}/cancel`,
  );
}

export function updateSaleItemStatus(orderId: string, itemId: string, status: string, trackingCode?: string) {
  const payload = trackingCode ? { status: status, tracking_code: trackingCode } : { status: status };
  return wrapRequest<OrderItemResponse>(
    protectedApi.patch(`/orders/sales/${orderId}/items/${itemId}/status`, payload),
    `PATCH /orders/sales/${orderId}/items/${itemId}/status`,
  );
}

export function cancelOrderItem(orderId: string, itemId: string) {
  return wrapRequest<OrderItemResponse>(
    protectedApi.post(`/orders/${orderId}/items/${itemId}/cancel`, {}),
    `POST /orders/${orderId}/items/${itemId}/cancel`,
  );
}

export function cancelSaleItem(orderId: string, itemId: string) {
  return wrapRequest<OrderItemResponse>(
    protectedApi.post(`/orders/sales/${orderId}/items/${itemId}/cancel`, {}),
    `POST /orders/sales/${orderId}/items/${itemId}/cancel`,
  );
}

export function confirmItemDelivery(orderId: string, itemId: string) {
  return wrapRequest<OrderItemResponse>(
    protectedApi.post(`/orders/${orderId}/items/${itemId}/confirm-delivery`, {}),
    `POST /orders/${orderId}/items/${itemId}/confirm-delivery`,
  );
}
