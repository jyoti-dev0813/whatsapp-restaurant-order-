"use client";

import { jsPDF } from "jspdf";

import { formatDateTimeIst } from "@/lib/billing/bill-number";
import { formatInr } from "@/lib/money";
import { formatPhone } from "@/lib/phone";
import type { OrderDetail } from "@/lib/domain/types";
import { Button } from "@/components/ui/button";

export function ReceiptActions({
  order,
  whatsappUrl,
}: {
  order: OrderDetail;
  whatsappUrl: string | null;
}) {
  return (
    <div className="no-print flex flex-wrap gap-2">
      <Button type="button" variant="secondary" onClick={() => window.print()}>
        Print
      </Button>
      <Button type="button" variant="secondary" onClick={() => downloadReceiptPdf(order)}>
        Download PDF
      </Button>
      {whatsappUrl ? (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground"
        >
          Open WhatsApp
        </a>
      ) : null}
    </div>
  );
}

function downloadReceiptPdf(order: OrderDetail) {
  const doc = new jsPDF({ unit: "mm", format: "a5" });
  let y = 14;
  const write = (text: string, size = 11, bold = false) => {
    doc.setFont("courier", bold ? "bold" : "normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, 118) as string[];
    doc.text(lines, 14, y);
    y += lines.length * 5 + 1;
  };

  write(order.cafeName, 16, true);
  if (order.cafeAddress) write(order.cafeAddress, 10);
  if (order.cafePhone) write(order.cafePhone, 10);
  write(`Bill ${order.billNumber}`, 12, true);
  write(formatDateTimeIst(order.createdAt), 10);
  write(`Customer: ${order.customerName}`);
  if (order.customerPhone) write(formatPhone(order.customerPhone), 10);
  write("--------------------------------");
  for (const item of order.items) {
    write(`${item.quantity} x ${item.name}`);
    write(`${formatInr(item.pricePaise)} each    ${formatInr(item.lineTotalPaise)}`, 10);
  }
  write("--------------------------------");
  write(`Subtotal ${formatInr(order.subtotalPaise)}`);
  write(`Discount ${formatInr(order.discountPaise)}`);
  write(`${order.taxLabel} ${formatInr(order.taxPaise)}`);
  write(`Total ${formatInr(order.totalPaise)}`, 13, true);
  if (order.notes) write(order.notes, 10);
  if (order.receiptFooter) write(order.receiptFooter, 10);
  doc.save(`${order.billNumber}.pdf`);
}
