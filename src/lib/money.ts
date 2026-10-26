export const MAX_PRICE_PAISE = 10_000_000;
export const MAX_QUANTITY = 99;
export const MAX_LINES = 40;

export type MoneyResult =
  | { ok: true; paise: number }
  | { ok: false; error: string };

/**
 * Convert a rupee string to integer paise without binary floating point.
 * "199.5" => 19950. Empty is 0 only when allowEmpty is set (discount field).
 */
export function rupeesToPaise(
  input: string,
  options?: { allowEmpty?: boolean },
): MoneyResult {
  const trimmed = input.trim();
  if (!trimmed) {
    if (options?.allowEmpty) return { ok: true, paise: 0 };
    return { ok: false, error: "Enter an amount." };
  }
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    return {
      ok: false,
      error: "Enter an amount with up to 2 decimal places.",
    };
  }
  const [rupees, fraction = ""] = trimmed.split(".");
  const paise = Number(rupees) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(paise) || paise > Number.MAX_SAFE_INTEGER) {
    return { ok: false, error: "Amount is too large." };
  }
  return { ok: true, paise };
}

export type PercentResult =
  | { ok: true; bps: number }
  | { ok: false; error: string };

/** "5" => 500 basis points. "5.5" => 550. Range is 0 to 100 percent. */
export function percentToBps(input: string): PercentResult {
  const trimmed = input.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    return {
      ok: false,
      error: "Enter a tax percent with up to 2 decimal places.",
    };
  }
  const [whole, fraction = ""] = trimmed.split(".");
  const bps = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (bps > 10_000) {
    return { ok: false, error: "Tax percent must be between 0 and 100." };
  }
  return { ok: true, bps };
}

export function bpsToPercentInput(bps: number): string {
  const whole = Math.trunc(bps / 100);
  const fraction = Math.abs(bps % 100);
  if (fraction === 0) return String(whole);
  if (fraction % 10 === 0) return `${whole}.${fraction / 10}`;
  return `${whole}.${String(fraction).padStart(2, "0")}`;
}

/** Display only. Calculations stay in integer paise. */
export function formatInr(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(paise / 100);
}
