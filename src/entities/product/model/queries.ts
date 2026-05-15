import { useQuery } from "@tanstack/react-query";
import { getMyProducts, getProduct, getProducts } from "../api/products";
import type { MyProductsParams, ProductListParams } from "./types";
import { useSessionUserId } from "@/shared/auth";

export function useProducts(params: ProductListParams = {}) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => getProducts(params),
  });
}

export function useProduct(productId: string) {
  return useQuery({
    queryKey: ["product", productId],
    queryFn: () => getProduct(productId),
  });
}

export function useMyProducts(params: MyProductsParams = {}) {
  const userId = useSessionUserId();
  return useQuery({
    queryKey: ["my-products", params],
    queryFn: () => getMyProducts(params),
    enabled: !!userId,
  });
}

