import { describe, expect, it } from "vitest";

import { calculateBill } from "@/lib/billing/calculate";

describe("calculateBill", () => {
  it("applies 5 percent tax with half-up paise rounding", () => {
    const result = calculateBill({
      lines: [{ pricePaise: 10000, quantity: 2 }],
      discountPaise: 0,
      taxRateBps: 500,
    });
    expect(result).toEqual({
      ok: true,
      totals: {
        subtotalPaise: 20000,
        discountPaise: 0,
        taxablePaise: 20000,
        taxPaise: 1000,
        totalPaise: 21000,
      },
    });
  });

  it("rounds a half-paise tax up", () => {
    const result = calculateBill({
      lines: [{ pricePaise: 150, quantity: 1 }],
      discountPaise: 0,
      taxRateBps: 500,
    });
    expect(result.ok && result.totals.taxPaise).toBe(8);
  });

  it("refuses a discount above the subtotal", () => {
    const result = calculateBill({
      lines: [{ pricePaise: 1000, quantity: 1 }],
      discountPaise: 1001,
      taxRateBps: 500,
    });
    expect(result).toEqual({
      ok: false,
      error: "Discount cannot be more than the subtotal.",
    });
  });
});
