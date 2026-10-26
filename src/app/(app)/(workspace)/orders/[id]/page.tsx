import Link from "next/link";
import { notFound } from "next/navigation";

import { BillActions } from "@/components/orders/bill-actions";
import { CancelBillForm } from "@/components/orders/cancel-bill-form";
import { ReceiptView } from "@/components/orders/receipt-view";
import { buildBillMessage, buildWhatsappUrl } from "@/lib/billing/whatsapp";
import { loadOrder } from "@/server/data";
import { requireActor } from "@/server/session";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const actor = await requireActor();
  const order = await loadOrder(actor.cafeId, id);
  if (!order) notFound();

  const whatsappUrl = order.customerPhone
    ? buildWhatsappUrl(
        order.customerPhone,
        buildBillMessage({
          cafeName: order.cafeName,
          customerName: order.customerName,
          billNumber: order.billNumber,
          items: order.items.map((item) => ({
            quantity: item.quantity,
            name: item.name,
            lineTotalPaise: item.lineTotalPaise,
          })),
          subtotalPaise: order.subtotalPaise,
          discountPaise: order.discountPaise,
          taxLabel: order.taxLabel,
          taxPaise: order.taxPaise,
          totalPaise: order.totalPaise,
        }),
      )
    : null;

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted">
            <Link href="/orders">Bills</Link>
          </p>
          <h1 className="text-2xl font-semibold">{order.billNumber}</h1>
        </div>
        {order.status !== "cancelled" ? <CancelBillForm orderId={order.id} /> : null}
      </div>
      <BillActions order={order} whatsappUrl={whatsappUrl} />
      <ReceiptView order={order} />
    </div>
  );
}
