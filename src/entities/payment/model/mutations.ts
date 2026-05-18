import { useMutation } from "@tanstack/react-query";
import { debugPayment } from "../api/payment";
import type { DebugPaymentRequest } from "./types";

export function useDebugPayment() {
  return useMutation({
    mutationFn: (data: DebugPaymentRequest) => debugPayment(data),
  });
}
