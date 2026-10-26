import Link from "next/link";

import { Card } from "@/components/ui/card";
import { formatInr } from "@/lib/money";
import { ORDER_STATUS_LABEL } from "@/lib/billing/status";
import { loadDashboard } from "@/server/data";
import { requireActor } from "@/server/session";

export default async function DashboardPage() {
  const actor = await requireActor();
  const stats = await loadDashboard(actor.cafeId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Today</h1>
          <p className="text-sm text-muted">Counts use India Standard Time and skip cancelled bills.</p>
        </div>
        <Link
          href="/orders/new"
          className="inline-flex min-h-11 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground"
        >
          New order
        </Link>
      </div>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Bills today" value={String(stats.todayOrders)} />
        <Stat label="Revenue today" value={formatInr(stats.todayRevenuePaise)} />
        <Stat label="Bills this month" value={String(stats.monthOrders)} />
        <Stat label="Revenue this month" value={formatInr(stats.monthRevenuePaise)} />
      </section>
      <Card>
        <h2 className="font-semibold">Recent bills</h2>
        {stats.recent.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No bills yet. The first order will show up here.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {stats.recent.map((order) => (
              <li key={order.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <Link href={`/orders/${order.id}`} className="font-semibold">
                    {order.billNumber}
                  </Link>
                  <p className="text-muted">
                    {order.customerName} · {ORDER_STATUS_LABEL[order.status]}
                  </p>
                </div>
                <span>{formatInr(order.totalPaise)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </Card>
  );
}
