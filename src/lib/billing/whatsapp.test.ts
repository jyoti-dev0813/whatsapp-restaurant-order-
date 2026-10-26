import { describe, expect, it } from "vitest";

import { WHATSAPP_OPENED_NOTE } from "@/lib/billing/status";
import { buildBillMessage, buildWhatsappUrl } from "@/lib/billing/whatsapp";

describe("whatsapp", () => {
  it("builds a wa.me link with the bill summary", () => {
    const message = buildBillMessage({
      cafeName: "Hearth & Co.",
      customerName: "Asha",
      billNumber: "BILL-20261026-0001",
      items: [{ quantity: 2, name: "Filter Coffee", lineTotalPaise: 16000 }],
      subtotalPaise: 16000,
      discountPaise: 0,
      taxLabel: "Tax",
      taxPaise: 800,
      totalPaise: 16800,
    });
    const url = buildWhatsappUrl("919876543210", message);
    expect(url.startsWith("https://wa.me/919876543210?text=")).toBe(true);
    const text = decodeURIComponent(url.split("text=")[1] ?? "");
    expect(text).toContain("This is Hearth & Co.");
    expect(text).not.toContain("Co..");
    expect(text).toContain("BILL-20261026-0001");
    expect(text).toContain("2 x Filter Coffee");
    expect(text).toContain("Total:");
    expect(text.toLowerCase()).not.toContain("delivered");
  });

  it("describes WhatsApp opened without claiming delivery", () => {
    const note = WHATSAPP_OPENED_NOTE.toLowerCase();
    expect(note).toContain("cannot confirm");
    expect(note).not.toMatch(/message was delivered|successfully delivered|marked as delivered/);
  });
});
