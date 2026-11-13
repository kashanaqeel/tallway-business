import type { Customer, MonthKey, PlanFilter } from "../domain/types";
import { addMonths, monthRange, monthsBetween } from "./months";
import { firstPaid, isPayingAt, matchesPlan } from "./status";

export interface CohortRow {
  month: MonthKey;
  size: number;
  /**
   * Share of the cohort paying at the end of each later month: index 0 is one
   * month after the cohort month. null where that month is after the range or
   * the cohort is empty.
   */
  retention: (number | null)[];
}

export interface CohortTable {
  /** Number of later-month columns. */
  maxOffset: number;
  rows: CohortRow[];
}

/**
 * A cohort is every customer whose first paying month is the same. With a plan
 * filter, customers are grouped by their first paid plan, and count as still
 * paying on any paid plan.
 */
export function computeCohorts(
  customers: Customer[],
  from: MonthKey,
  to: MonthKey,
  plan: PlanFilter,
): CohortTable {
  const maxOffset = Math.max(0, monthsBetween(from, to));
  const members = new Map<MonthKey, Customer[]>();
  for (const customer of customers) {
    const first = firstPaid(customer);
    if (first && first.month >= from && first.month <= to && matchesPlan(first.plan, plan)) {
      const list = members.get(first.month) ?? [];
      list.push(customer);
      members.set(first.month, list);
    }
  }

  const rows = monthRange(from, to).map((month) => {
    const cohort = members.get(month) ?? [];
    const retention: (number | null)[] = [];
    for (let offset = 1; offset <= maxOffset; offset++) {
      const later = addMonths(month, offset);
      if (later > to || cohort.length === 0) {
        retention.push(null);
      } else {
        const stillPaying = cohort.filter((c) => isPayingAt(c, later)).length;
        retention.push(stillPaying / cohort.length);
      }
    }
    return { month, size: cohort.length, retention };
  });

  return { maxOffset, rows };
}
