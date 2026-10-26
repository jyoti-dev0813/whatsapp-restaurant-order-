import type { Role } from "@/lib/domain/types";

export function canManageMenu(role: Role): boolean {
  return role === "owner";
}

export function canManageSettings(role: Role): boolean {
  return role === "owner";
}

export function canBill(role: Role): boolean {
  return role === "owner" || role === "staff";
}
