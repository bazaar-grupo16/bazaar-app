import { apiGet, apiPostForm } from "@/shared/api";
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

  if (params.sortBy) {
    searchParams.set("sort_by", params.sortBy);
  }

  if (params.order) {
    searchParams.set("order", params.order);
  }

  if (params.minPrice !== undefined) {
    searchParams.set("min_price", String(params.minPrice));
  }

  if (params.maxPrice !== undefined) {
    searchParams.set("max_price", String(params.maxPrice));
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

export function getProducts(params: ProductListParams = {}) {
  return apiGet<ProductListResponse>(`/catalog/products${toQueryString(params)}`);
}

export function getProduct(productId: string) {
  return apiGet<ProductResponse>(`/catalog/products/${productId}`);
}

export function createProduct(formData: FormData) {
  return apiPostForm<ProductResponse>("/catalog/products", formData);
}
