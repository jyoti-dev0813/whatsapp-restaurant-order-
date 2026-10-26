import { describe, expect, it } from "vitest";

import { normalizePhone } from "@/lib/phone";

describe("phone", () => {
  it("adds the cafe country code to a 10 digit Indian mobile", () => {
    expect(normalizePhone("98765 43210", "91")).toEqual({
      ok: true,
      e164Digits: "919876543210",
    });
  });

  it("strips a trunk zero and keeps an explicit country code", () => {
    expect(normalizePhone("09876543210", "91")).toEqual({
      ok: true,
      e164Digits: "919876543210",
    });
    expect(normalizePhone("+44 7700 900123", "91")).toEqual({
      ok: true,
      e164Digits: "447700900123",
    });
  });

  it("rejects numbers that are too short", () => {
    expect(normalizePhone("12345", "91").ok).toBe(false);
  });
});
