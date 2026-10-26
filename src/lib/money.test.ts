import { describe, expect, it } from "vitest";

import { bpsToPercentInput, percentToBps, rupeesToPaise } from "@/lib/money";

describe("money", () => {
  it("converts rupee strings to paise without floating point", () => {
    expect(rupeesToPaise("199.5")).toEqual({ ok: true, paise: 19950 });
    expect(rupeesToPaise("80")).toEqual({ ok: true, paise: 8000 });
    expect(rupeesToPaise("0.05")).toEqual({ ok: true, paise: 5 });
  });

  it("rejects extra decimals and empty prices", () => {
    expect(rupeesToPaise("1.999").ok).toBe(false);
    expect(rupeesToPaise("").ok).toBe(false);
    expect(rupeesToPaise("", { allowEmpty: true })).toEqual({ ok: true, paise: 0 });
  });

  it("converts tax percent to basis points", () => {
    expect(percentToBps("5")).toEqual({ ok: true, bps: 500 });
    expect(percentToBps("5.5")).toEqual({ ok: true, bps: 550 });
    expect(percentToBps("5.05")).toEqual({ ok: true, bps: 505 });
    expect(percentToBps("101").ok).toBe(false);
    expect(bpsToPercentInput(500)).toBe("5");
    expect(bpsToPercentInput(550)).toBe("5.5");
    expect(bpsToPercentInput(505)).toBe("5.05");
  });
});
