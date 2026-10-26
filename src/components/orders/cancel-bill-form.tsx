"use client";

import { SubmitButton } from "@/components/submit-button";
import { cancelOrderAction } from "@/server/order-actions";

export function CancelBillForm({ orderId }: { orderId: string }) {
  return (
    <form
      action={cancelOrderAction}
      onSubmit={(event) => {
        if (!window.confirm("Cancel this bill? It stays in history and is left out of revenue.")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="orderId" value={orderId} />
      <SubmitButton variant="danger">Cancel bill</SubmitButton>
    </form>
  );
}
