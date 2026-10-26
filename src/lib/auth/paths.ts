export function safeNextPath(value: FormDataEntryValue | string | null | undefined): string {
  if (typeof value !== "string") return "/dashboard";
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/dashboard";
  }
  if (value.startsWith("/login") || value.startsWith("/signup")) return "/dashboard";
  return value;
}
