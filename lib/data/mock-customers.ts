import { priceCents } from "../domain/plans";
import type { BillingInterval, Customer, MonthKey, Plan, SubscriptionPeriod } from "../domain/types";
import { addMonths, monthRange, monthsBetween } from "../metrics/months";
import { createRandom } from "./prng";

/** Last complete month of data. */
export const AS_OF: MonthKey = "2026-10";
export const HISTORY_START: MonthKey = "2024-01";

/** Pro customers who first paid from this month on cancel much faster: the problem the dashboard should surface. */
const SLIPPING_PRO_COHORTS_FROM: MonthKey = "2026-04";

const INITIAL_CUSTOMERS = 180;
const SEED = 20261031;

interface State {
  plan: Plan;
  interval: BillingInterval;
}

type Transition = State | "cancel" | null;

function pickStartingState(random: () => number): State {
  const r = random();
  if (r < 0.62) return { plan: "free", interval: "month" };
  if (r < 0.92) return { plan: "pro", interval: "month" };
  return { plan: "enterprise", interval: random() < 0.45 ? "year" : "month" };
}

function nextTransition(
  random: () => number,
  state: State,
  monthsOnPeriod: number,
  firstPaidMonth: MonthKey | null,
): Transition {
  const r = random();
  switch (state.plan) {
    case "free":
      if (r < 0.035) return "cancel";
      if (r < 0.07) return { plan: "pro", interval: "month" };
      return null;
    case "pro": {
      const slipping = firstPaidMonth !== null && firstPaidMonth >= SLIPPING_PRO_COHORTS_FROM;
      const churn = slipping ? 0.11 : 0.028;
      if (r < churn) return random() < 0.75 ? "cancel" : { plan: "free", interval: "month" };
      if (r < churn + 0.009) return { plan: "enterprise", interval: random() < 0.4 ? "year" : "month" };
      return null;
    }
    case "enterprise":
      if (state.interval === "year") {
        // Annual contracts can only end at renewal.
        if (monthsOnPeriod % 12 !== 0) return null;
        return r < 0.06 ? "cancel" : null;
      }
      if (r < 0.009) return "cancel";
      if (r < 0.012) return { plan: "pro", interval: "month" };
      return null;
  }
}

function simulateCustomer(random: () => number, id: string, signupMonth: MonthKey): Customer {
  const periods: SubscriptionPeriod[] = [];
  let state: State | null = pickStartingState(random);
  let start = signupMonth;
  let firstPaidMonth: MonthKey | null = state.plan === "free" ? null : signupMonth;

  for (let month = addMonths(signupMonth, 1); month <= AS_OF && state; month = addMonths(month, 1)) {
    const transition = nextTransition(random, state, monthsBetween(start, month), firstPaidMonth);
    if (transition === null) continue;

    periods.push({ ...state, amountCents: priceCents(state.plan, state.interval), start, end: month });
    if (transition === "cancel") {
      state = null;
    } else {
      state = transition;
      start = month;
      if (firstPaidMonth === null && state.plan !== "free") firstPaidMonth = month;
    }
  }

  if (state) {
    periods.push({ ...state, amountCents: priceCents(state.plan, state.interval), start, end: null });
  }
  return { id, signupMonth, periods };
}

function generateCustomers(): Customer[] {
  const random = createRandom(SEED);
  const customers: Customer[] = [];
  let nextId = 1;
  const add = (month: MonthKey) => {
    customers.push(simulateCustomer(random, `cus_${String(nextId++).padStart(4, "0")}`, month));
  };

  for (let i = 0; i < INITIAL_CUSTOMERS; i++) add(HISTORY_START);

  monthRange(HISTORY_START, AS_OF).forEach((month, index) => {
    const signups = Math.round(14 + index * 0.25 + (random() - 0.5) * 6);
    for (let i = 0; i < signups; i++) add(month);
  });

  return customers;
}

export const customers: Customer[] = generateCustomers();
