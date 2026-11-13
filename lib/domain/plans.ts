import type { BillingInterval, PaidPlan, Plan, PlanFilter } from "./types";

export const PAID_PLANS: PaidPlan[] = ["pro", "enterprise"];

export const PLAN_LABELS: Record<Plan, string> = {
  free: "Free",
  pro: "Pro",
  enterprise: "Enterprise",
};

export const PLAN_FILTER_LABELS: Record<PlanFilter, string> = {
  all: "All plans",
  pro: "Pro",
  enterprise: "Enterprise",
};

/** Enterprise annual is 12 x the monthly price; the brief only states the monthly price. */
export const PLAN_PRICES_CENTS: Record<Plan, Partial<Record<BillingInterval, number>>> = {
  free: { month: 0 },
  pro: { month: 4_900 },
  enterprise: { month: 39_900, year: 478_800 },
};

export function priceCents(plan: Plan, interval: BillingInterval): number {
  const price = PLAN_PRICES_CENTS[plan][interval];
  if (price === undefined) {
    throw new Error(`No ${interval}ly price for the ${plan} plan`);
  }
  return price;
}
