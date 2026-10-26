import type { OrderStatus } from "@/lib/domain/types";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  billed: "Billed",
  whatsapp_opened: "WhatsApp opened",
  cancelled: "Cancelled",
};

export const WHATSAPP_OPENED_NOTE =
  "A staff member opened WhatsApp with a prepared message. CafeBill cannot confirm that it was sent or delivered.";
