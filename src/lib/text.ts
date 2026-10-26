/** Remove control characters so names and notes stay on one line in receipts and WhatsApp. */
export function cleanText(input: string, max: number): string {
  return input
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}
