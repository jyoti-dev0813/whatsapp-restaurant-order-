import { formatDateTimeIst } from "@/lib/billing/bill-number";
import { ORDER_STATUS_LABEL } from "@/lib/billing/status";
import { bpsToPercentInput, formatInr } from "@/lib/money";
import { formatPhone } from "@/lib/phone";
import type { OrderDetail } from "@/lib/domain/types";

export function ReceiptView({ order }: { order: OrderDetail }) {
  return (
    <article id="receipt" className="mx-auto max-w-md bg-white p-6 font-mono text-sm text-black shadow-sm print:shadow-none">
      <header className="text-center">
        <h1 className="text-xl font-bold">{order.cafeName}</h1>
        {order.cafeAddress ? <p className="mt-1">{order.cafeAddress}</p> : null}
        {order.cafePhone ? <p>{order.cafePhone}</p> : null}
      </header>
      <div className="my-4 border-t border-dashed border-black" />
      <p>Bill {order.billNumber}</p>
      <p>{formatDateTimeIst(order.createdAt)}</p>
      <p>Status: {ORDER_STATUS_LABEL[order.status]}</p>
      <p className="mt-3">Customer: {order.customerName}</p>
      {order.customerPhone ? <p>Phone: {formatPhone(order.customerPhone)}</p> : null}
      <div className="my-4 border-t border-dashed border-black" />
      <ul className="space-y-2">
        {order.items.map((item) => (
          <li key={item.id}>
            <div className="flex justify-between gap-3">
              <span>
                {item.quantity} x {item.name}
              </span>
              <span>{formatInr(item.lineTotalPaise)}</span>
            </div>
            <p className="text-xs">{formatInr(item.pricePaise)} each</p>
          </li>
        ))}
      </ul>
      <div className="my-4 border-t border-dashed border-black" />
      <Total label="Subtotal" value={formatInr(order.subtotalPaise)} />
      <Total label="Discount" value={formatInr(order.discountPaise)} />
      <Total label={`${order.taxLabel} (${bpsToPercentInput(order.taxRateBps)}%)`} value={formatInr(order.taxPaise)} />
      <Total label="Total" value={formatInr(order.totalPaise)} strong />
      {order.notes ? <p className="mt-4">Note: {order.notes}</p> : null}
      {order.receiptFooter ? <p className="mt-4 text-center">{order.receiptFooter}</p> : null}
    </article>
  );
}

function Total({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <p className={`flex justify-between ${strong ? "mt-2 text-base font-bold" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </p>
  );
}
