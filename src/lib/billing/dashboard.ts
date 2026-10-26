import { istDayKey } from "@/lib/billing/bill-number";
import type { DashboardStats, OrderSummary } from "@/lib/domain/types";

export function summarizeOrders(orders: OrderSummary[], now = new Date()): DashboardStats {
  const day = istDayKey(now);
  const month = day.slice(0, 7);
  const active = orders.filter((order) => order.status !== "cancelled");
  const today = active.filter((order) => istDayKey(new Date(order.createdAt)) === day);
  const thisMonth = active.filter((order) => istDayKey(new Date(order.createdAt)).startsWith(month));
  const recent = [...orders].sort((left, right) => right.createdAt.localeCompare(left.createdAt)).slice(0, 5);

  return {
    todayOrders: today.length,
    todayRevenuePaise: today.reduce((sum, order) => sum + order.totalPaise, 0),
    monthOrders: thisMonth.length,
    monthRevenuePaise: thisMonth.reduce((sum, order) => sum + order.totalPaise, 0),
    recent,
  };
}
