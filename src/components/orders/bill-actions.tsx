"use client";

import { useState } from "react";

import { WHATSAPP_OPENED_NOTE } from "@/lib/billing/status";
import { markWhatsappOpenedAction } from "@/server/order-actions";
import { ReceiptActions } from "@/components/orders/receipt-actions";
import type { OrderDetail } from "@/lib/domain/types";

export function BillActions({ order, whatsappUrl }: { order: OrderDetail; whatsappUrl: string | null }) {
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div
        onClick={(event) => {
          const target = event.target as HTMLElement;
          if (target.closest("a[href*='wa.me']")) {
            void markWhatsappOpenedAction(order.id).then((result) => {
              setMessage(result.ok ? WHATSAPP_OPENED_NOTE : result.error);
            });
          }
        }}
      >
        <ReceiptActions order={order} whatsappUrl={order.status === "cancelled" ? null : whatsappUrl} />
      </div>
      <p className="no-print text-sm text-muted">
        WhatsApp opens with the bill filled in. Press Send yourself. Opening this link does not mean the message was sent or delivered.
      </p>
      {order.status === "whatsapp_opened" ? <p className="no-print text-sm">{WHATSAPP_OPENED_NOTE}</p> : null}
      {message ? <p className="no-print text-sm">{message}</p> : null}
    </div>
  );
}
