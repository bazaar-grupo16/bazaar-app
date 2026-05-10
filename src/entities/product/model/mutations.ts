import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProduct, updateProduct } from "../api/products";
import type { UpdateProductBody } from "./types";

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => createProduct(formData),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateProduct(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateProductBody) => updateProduct(productId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["my-products"] });
      void queryClient.invalidateQueries({ queryKey: ["product", productId] });
    },
  });
}
