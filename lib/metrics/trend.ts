import type { Customer, MonthKey, PaidPlan, PlanFilter } from "../domain/types";
import { monthRange } from "./months";
import { matchesPlan, mrrAt, paidPlanAt } from "./status";

export interface TrendPoint {
  month: MonthKey;
  byPlan: Record<PaidPlan, number>;
  totalCents: number;
}

export function computeMrrTrend(
  customers: Customer[],
  from: MonthKey,
  to: MonthKey,
  plan: PlanFilter,
): TrendPoint[] {
  return monthRange(from, to).map((month) => {
    const byPlan: Record<PaidPlan, number> = { pro: 0, enterprise: 0 };
    for (const customer of customers) {
      const current = paidPlanAt(customer, month);
      if (current && matchesPlan(current, plan)) {
        byPlan[current] += mrrAt(customer, month);
      }
    }
    return { month, byPlan, totalCents: byPlan.pro + byPlan.enterprise };
  });
}
