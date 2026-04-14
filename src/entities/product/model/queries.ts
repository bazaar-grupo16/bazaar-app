import { useQuery } from "@tanstack/react-query";
import { getProducts } from "../api/products";
import type { ProductListParams } from "./types";

export function useProducts(params: ProductListParams = {}) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => getProducts(params),
  });
}
