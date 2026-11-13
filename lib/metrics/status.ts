import type { Customer, MonthKey, PaidPlan, PlanFilter, SubscriptionPeriod } from "../domain/types";

export function periodAt(customer: Customer, month: MonthKey): SubscriptionPeriod | undefined {
  return customer.periods.find((p) => p.start <= month && (p.end === null || month < p.end));
}

/** Annual prices count as the yearly price divided by 12. */
export function monthlyAmountCents(period: SubscriptionPeriod): number {
  return period.interval === "year" ? period.amountCents / 12 : period.amountCents;
}

/** Paid plan at the end of `month`, or null if the customer is on Free or gone. */
export function paidPlanAt(customer: Customer, month: MonthKey): PaidPlan | null {
  const period = periodAt(customer, month);
  return period && period.plan !== "free" ? period.plan : null;
}

export function isPayingAt(customer: Customer, month: MonthKey): boolean {
  return paidPlanAt(customer, month) !== null;
}

export function mrrAt(customer: Customer, month: MonthKey): number {
  const period = periodAt(customer, month);
  return period && period.plan !== "free" ? monthlyAmountCents(period) : 0;
}

/** The month a customer first became paying, and the plan they paid for. */
export function firstPaid(customer: Customer): { month: MonthKey; plan: PaidPlan } | null {
  for (const period of customer.periods) {
    if (period.plan !== "free") {
      return { month: period.start, plan: period.plan };
    }
  }
  return null;
}

export function matchesPlan(plan: PaidPlan | null, filter: PlanFilter): boolean {
  return plan !== null && (filter === "all" || plan === filter);
}
