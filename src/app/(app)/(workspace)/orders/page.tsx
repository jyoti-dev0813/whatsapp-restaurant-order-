import Link from "next/link";

import { Badge, Card } from "@/components/ui/card";
import { Input } from "@/components/ui/fields";
import { formatDateTimeIst } from "@/lib/billing/bill-number";
import { ORDER_STATUS_LABEL } from "@/lib/billing/status";
import { formatInr } from "@/lib/money";
import type { OrderStatus } from "@/lib/domain/types";
import { loadOrders } from "@/server/data";
import { requireActor } from "@/server/session";

const statuses = ["all", "billed", "whatsapp_opened", "cancelled"] as const;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const status = statuses.includes(params.status as (typeof statuses)[number]) ? params.status ?? "all" : "all";
  const actor = await requireActor();
  const orders = await loadOrders(actor.cafeId, { query: params.q ?? "", status });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Bills</h1>
        <p className="text-sm text-muted">Search by bill number, customer name, or phone.</p>
      </div>
      <form className="flex flex-col gap-3 sm:flex-row">
        <Input name="q" defaultValue={params.q ?? ""} placeholder="Search bills" aria-label="Search bills" />
        <select
          name="status"
          defaultValue={status}
          aria-label="Bill status"
          className="min-h-11 rounded-xl border border-border bg-card px-3 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="billed">Billed</option>
          <option value="whatsapp_opened">WhatsApp opened</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button type="submit" className="min-h-11 rounded-xl border border-border bg-card px-4 text-sm font-semibold">
          Filter
        </button>
      </form>
      {orders.length === 0 ? (
        <Card>
          <p className="font-medium">No bills match</p>
          <p className="mt-1 text-sm text-muted">Create an order from the New order page.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Link href={`/orders/${order.id}`} className="font-semibold">
                  {order.billNumber}
                </Link>
                <p className="text-sm text-muted">
                  {order.customerName} · {formatDateTimeIst(order.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={toneFor(order.status)}>{ORDER_STATUS_LABEL[order.status]}</Badge>
                <span className="font-semibold">{formatInr(order.totalPaise)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function toneFor(status: OrderStatus) {
  if (status === "cancelled") return "danger" as const;
  if (status === "whatsapp_opened") return "warning" as const;
  return "success" as const;
}
