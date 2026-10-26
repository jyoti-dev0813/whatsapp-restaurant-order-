export type PhoneResult =
  | { ok: true; e164Digits: string }
  | { ok: false; error: string };

/**
 * Normalize a phone number to digits without a leading plus.
 * 10-digit numbers and 11-digit numbers starting with 0 use the cafe country code.
 */
export function normalizePhone(
  input: string,
  defaultCountryCode: string,
): PhoneResult {
  const country = defaultCountryCode.trim();
  if (!/^[1-9]\d{0,3}$/.test(country)) {
    return { ok: false, error: "Cafe country code is invalid." };
  }

  let digits = input.trim().replace(/[\s().-]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  else if (digits.startsWith("00")) digits = digits.slice(2);

  if (!/^\d+$/.test(digits)) {
    return { ok: false, error: "Phone number can contain digits only." };
  }

  if (digits.startsWith("0") && digits.length === 11) {
    digits = `${country}${digits.slice(1)}`;
  } else if (digits.length === 10) {
    digits = `${country}${digits}`;
  }

  if (!/^[1-9]\d{9,14}$/.test(digits)) {
    return {
      ok: false,
      error: "Enter a valid phone number, or include the country code.",
    };
  }

  return { ok: true, e164Digits: digits };
}

export function formatPhone(e164Digits: string): string {
  if (!e164Digits) return "";
  return `+${e164Digits}`;
}
