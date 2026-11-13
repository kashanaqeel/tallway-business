export type Plan = "free" | "pro" | "enterprise";
export type PaidPlan = Exclude<Plan, "free">;
export type BillingInterval = "month" | "year";

/** Calendar month as "YYYY-MM". Zero-padded, so string order is date order. */
export type MonthKey = string;

/**
 * A stretch of time a customer spent on one price, at month granularity.
 * The period is active at the end of every month from `start` up to, but not
 * including, `end`. `end: null` means it is still active.
 */
export interface SubscriptionPeriod {
  plan: Plan;
  interval: BillingInterval;
  /** Price charged per billing interval, in cents. */
  amountCents: number;
  start: MonthKey;
  end: MonthKey | null;
}

/** Periods are ordered by start and never overlap. */
export interface Customer {
  id: string;
  signupMonth: MonthKey;
  periods: SubscriptionPeriod[];
}

export type PlanFilter = "all" | PaidPlan;

export interface DashboardFilters {
  plan: PlanFilter;
  from: MonthKey;
  to: MonthKey;
}
