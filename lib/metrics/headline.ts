import type { Customer, MonthKey, PlanFilter } from "../domain/types";
import { addMonths } from "./months";
import { firstPaid, isPayingAt, matchesPlan, mrrAt, paidPlanAt } from "./status";

export interface MonthMetrics {
  month: MonthKey;
  mrrCents: number;
  payingCustomers: number;
  churn: {
    /** null when nobody was paying at the start of the month. */
    rate: number | null;
    cancelled: number;
    startingCustomers: number;
  };
  nrr: {
    /** null when nobody was paying 12 months earlier. */
    rate: number | null;
    baseMonth: MonthKey;
    baseCustomers: number;
    baseMrrCents: number;
    currentMrrCents: number;
  };
  newPaying: number;
}

/**
 * With a plan filter, MRR and churn use the plan the customer was on in that
 * month, NRR uses the plan they were on 12 months earlier, and new paying
 * customers use their first paid plan.
 */
export function computeMonthMetrics(customers: Customer[], month: MonthKey, plan: PlanFilter): MonthMetrics {
  const previousMonth = addMonths(month, -1);
  const baseMonth = addMonths(month, -12);

  let mrrCents = 0;
  let payingCustomers = 0;
  let startingCustomers = 0;
  let cancelled = 0;
  let baseCustomers = 0;
  let baseMrrCents = 0;
  let currentMrrCents = 0;
  let newPaying = 0;

  for (const customer of customers) {
    if (matchesPlan(paidPlanAt(customer, month), plan)) {
      payingCustomers++;
      mrrCents += mrrAt(customer, month);
    }

    if (matchesPlan(paidPlanAt(customer, previousMonth), plan)) {
      startingCustomers++;
      if (!isPayingAt(customer, month)) cancelled++;
    }

    if (matchesPlan(paidPlanAt(customer, baseMonth), plan)) {
      baseCustomers++;
      baseMrrCents += mrrAt(customer, baseMonth);
      currentMrrCents += mrrAt(customer, month);
    }

    const first = firstPaid(customer);
    if (first && first.month === month && matchesPlan(first.plan, plan)) newPaying++;
  }

  return {
    month,
    mrrCents,
    payingCustomers,
    churn: {
      rate: startingCustomers > 0 ? cancelled / startingCustomers : null,
      cancelled,
      startingCustomers,
    },
    nrr: {
      rate: baseMrrCents > 0 ? currentMrrCents / baseMrrCents : null,
      baseMonth,
      baseCustomers,
      baseMrrCents,
      currentMrrCents,
    },
    newPaying,
  };
}
