export function getStatusColor(status: string): string {
  switch (status) {
    case "PENDIENTE_DE_PAGO":    return "#f59e0b";
    case "CONFIRMADA":
    case "CONFIRMADO":           return "#3b82f6";
    case "EN_PREPARACION":       return "#f97316";
    case "ENVIADA":
    case "ENVIADO":              return "#6366f1";
    case "ENTREGADA":
    case "ENTREGADO":            return "#22c55e";
    case "CANCELADA":
    case "CANCELADO":            return "#ef4444";
    case "PAGO_RECHAZADO":       return "#ef4444";
    case "REEMBOLSO_EN_PROCESO": return "#f97316";
    case "REEMBOLSO_PROCESADO":  return "#6b7280";
    default:                     return "#6b7280";
  }
}
