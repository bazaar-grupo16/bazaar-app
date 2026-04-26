import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProduct } from "../api/products";

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => createProduct(formData),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
