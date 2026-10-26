import { MAX_LINES, MAX_PRICE_PAISE, MAX_QUANTITY } from "@/lib/money";

export type BillLineInput = {
  pricePaise: number;
  quantity: number;
};

export type BillTotals = {
  subtotalPaise: number;
  discountPaise: number;
  taxablePaise: number;
  taxPaise: number;
  totalPaise: number;
};

export type BillResult =
  | { ok: true; totals: BillTotals }
  | { ok: false; error: string };

/**
 * Integer paise billing.
 * tax = floor((taxablePaise * taxRateBps + 5000) / 10000)
 * Half-up rounding at 0.5 paise. This expression must match place_order in SQL.
 */
export function calculateBill(input: {
  lines: BillLineInput[];
  discountPaise: number;
  taxRateBps: number;
}): BillResult {
  if (input.lines.length === 0) {
    return { ok: false, error: "Add at least one item." };
  }
  if (input.lines.length > MAX_LINES) {
    return { ok: false, error: "An order can include at most 40 lines." };
  }

  let subtotalPaise = 0;
  for (const line of input.lines) {
    if (
      !Number.isInteger(line.quantity) ||
      line.quantity < 1 ||
      line.quantity > MAX_QUANTITY
    ) {
      return {
        ok: false,
        error: "Quantity must be a whole number from 1 to 99.",
      };
    }
    if (
      !Number.isInteger(line.pricePaise) ||
      line.pricePaise < 0 ||
      line.pricePaise > MAX_PRICE_PAISE
    ) {
      return { ok: false, error: "Item price is invalid." };
    }
    subtotalPaise += line.pricePaise * line.quantity;
  }

  if (!Number.isInteger(input.discountPaise) || input.discountPaise < 0) {
    return { ok: false, error: "Discount is invalid." };
  }
  if (input.discountPaise > subtotalPaise) {
    return { ok: false, error: "Discount cannot be more than the subtotal." };
  }
  if (
    !Number.isInteger(input.taxRateBps) ||
    input.taxRateBps < 0 ||
    input.taxRateBps > 10_000
  ) {
    return { ok: false, error: "Tax rate is invalid." };
  }

  const taxablePaise = subtotalPaise - input.discountPaise;
  const taxPaise = Math.floor((taxablePaise * input.taxRateBps + 5000) / 10_000);

  return {
    ok: true,
    totals: {
      subtotalPaise,
      discountPaise: input.discountPaise,
      taxablePaise,
      taxPaise,
      totalPaise: taxablePaise + taxPaise,
    },
  };
}
