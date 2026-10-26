const IST = "Asia/Kolkata";

export function istDayKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatBillNumber(
  prefix: string,
  sequence: number,
  date = new Date(),
): string {
  const day = istDayKey(date).replaceAll("-", "");
  return `${prefix}-${day}-${String(sequence).padStart(4, "0")}`;
}

export function formatDateTimeIst(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}
