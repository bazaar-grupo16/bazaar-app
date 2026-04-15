import { apiGet } from "@/shared/api";
import type { ProductListParams, ProductListResponse, ProductResponse } from "../model/types";

function toQueryString(params: ProductListParams) {
  const searchParams = new URLSearchParams();

  if (params.limit !== undefined) {
    searchParams.set("limit", String(params.limit));
  }

  if (params.offset !== undefined) {
    searchParams.set("offset", String(params.offset));
  }

  if (params.searchQuery) {
    searchParams.set("search_query", params.searchQuery);
  }

  if (params.category) {
    searchParams.set("category", params.category);
  }

  if (params.sellerId) {
    searchParams.set("seller_id", params.sellerId);
  }

  if (params.includeInactive !== undefined) {
    searchParams.set("include_inactive", String(params.includeInactive));
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

export function getProducts(params: ProductListParams = {}) {
  return apiGet<ProductListResponse>(`/products${toQueryString(params)}`);
}

export function getProduct(productId: string) {
  return apiGet<ProductResponse>(`/products/${productId}`);
}
