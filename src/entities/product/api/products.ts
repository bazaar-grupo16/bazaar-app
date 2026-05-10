import { apiGet, apiPostForm, apiPatch, apiDeleteWithBody, publicApiGet } from "@/shared/api";
import type { MyProductsParams, ProductListParams, ProductListResponse, ProductResponse, UpdateProductBody } from "../model/types";

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
  return publicApiGet<ProductListResponse>(`/catalog/products${toQueryString(params)}`);
}

export function getProduct(productId: string) {
  return publicApiGet<ProductResponse>(`/catalog/products/${productId}`);
}

export function createProduct(formData: FormData) {
  return apiPostForm<ProductResponse>("/catalog/products", formData);
}

export interface ShareLinkResponse {
  data: { productId: string; url: string };
}

export function getProductShareLink(productId: string) {
  return publicApiGet<ShareLinkResponse>(`/catalog/products/${productId}/share-link`);
}

export function getMyProducts(params: MyProductsParams = {}) {
  return apiGet<ProductListResponse>(`/catalog/my-products${toQueryString(params)}`);
}

export function updateProduct(productId: string, body: UpdateProductBody) {
  return apiPatch<ProductResponse>(`/catalog/products/${productId}`, body);
}

export function addProductImages(productId: string, formData: FormData) {
  return apiPostForm<ProductResponse>(`/catalog/products/${productId}/images`, formData);
}

export function deleteProductImages(productId: string, urls: string[]) {
  return apiDeleteWithBody<ProductResponse>(
    `/catalog/products/${productId}/images`,
    { urls }
  );
}

export function reorderProductImages(productId: string, urls: string[]) {
  return apiPatch<ProductResponse>(`/catalog/products/${productId}/images/order`, { urls });
}
