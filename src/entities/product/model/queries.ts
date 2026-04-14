import { useQuery } from "@tanstack/react-query";
import { getProduct, getProducts } from "../api/products";
import type { ProductListParams } from "./types";

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
