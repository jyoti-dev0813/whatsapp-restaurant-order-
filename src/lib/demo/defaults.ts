import type { CafeSettings } from "@/lib/domain/types";

export function defaultCafeSettings(cafeId: string, updatedAt: string): CafeSettings {
  return {
    cafeId,
    currencyCode: "INR",
    taxRateBps: 500,
    taxLabel: "Tax",
    receiptFooter: "Thank you. Please check this bill before leaving.",
    billPrefix: "BILL",
    nextBillSeq: 1,
    whatsappCountryCode: "91",
    updatedAt,
  };
}
