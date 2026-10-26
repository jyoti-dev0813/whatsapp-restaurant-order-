import { formatInr } from "@/lib/money";

export type WhatsappLine = {
  quantity: number;
  name: string;
  lineTotalPaise: number;
};

export function buildBillMessage(input: {
  cafeName: string;
  customerName: string;
  billNumber: string;
  items: WhatsappLine[];
  subtotalPaise: number;
  discountPaise: number;
  taxLabel: string;
  taxPaise: number;
  totalPaise: number;
}): string {
  const itemLines = input.items.map(
    (item) =>
      `${item.quantity} x ${item.name} - ${formatInr(item.lineTotalPaise)}`,
  );

  const cafeName = input.cafeName.replace(/[.!?]+$/, "");
  return [
    `Hello ${input.customerName},`,
    `This is ${cafeName}.`,
    `Bill ${input.billNumber}`,
    "",
    ...itemLines,
    "",
    `Subtotal: ${formatInr(input.subtotalPaise)}`,
    `Discount: ${formatInr(input.discountPaise)}`,
    `${input.taxLabel}: ${formatInr(input.taxPaise)}`,
    `Total: ${formatInr(input.totalPaise)}`,
    "",
    "Please reply if a correction is needed. A staff member sends this message manually.",
  ].join("\n");
}

export function buildWhatsappUrl(phoneDigits: string, message: string): string {
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
}
