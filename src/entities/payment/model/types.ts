export type DebugPaymentRequest = {
  operation_id: string;
  accepted: boolean;
};

export type DebugPaymentResponse = Record<string, unknown>;
