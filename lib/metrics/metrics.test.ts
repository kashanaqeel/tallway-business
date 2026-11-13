import { describe, expect, it } from "vitest";
import type { Customer } from "../domain/types";
import { computeCohorts } from "./cohorts";
import { computeMonthMetrics } from "./headline";
import { computeDashboard } from "./index";
import { lastDayLabel, monthRange } from "./months";
import { computeMrrTrend } from "./trend";

const PRO = 4_900;
const ENT = 39_900;
const ENT_YEAR = 478_800;

/*
 * Paying at month end, by customer:
 *   A  Pro monthly from Jan 2025, still active
 *   B  Enterprise annual Jan 2025 to Dec 2025, gone from Jan 2026
 *   C  Free from Jan 2025, Pro from Jun 2025
 *   D  Pro Dec 2025 and Jan 2026, gone from Feb 2026
 *   E  Pro from Jan 2025, upgrades to Enterprise monthly in Dec 2025
 *   F  Pro in Dec 2025, moves to Free in Jan 2026
 */
const fixture: Customer[] = [
  {
    id: "A",
    signupMonth: "2025-01",
    periods: [{ plan: "pro", interval: "month", amountCents: PRO, start: "2025-01", end: null }],
  },
  {
    id: "B",
    signupMonth: "2025-01",
    periods: [{ plan: "enterprise", interval: "year", amountCents: ENT_YEAR, start: "2025-01", end: "2026-01" }],
  },
  {
    id: "C",
    signupMonth: "2025-01",
    periods: [
      { plan: "free", interval: "month", amountCents: 0, start: "2025-01", end: "2025-06" },
      { plan: "pro", interval: "month", amountCents: PRO, start: "2025-06", end: null },
    ],
  },
  {
    id: "D",
    signupMonth: "2025-12",
    periods: [{ plan: "pro", interval: "month", amountCents: PRO, start: "2025-12", end: "2026-02" }],
  },
  {
    id: "E",
    signupMonth: "2025-01",
    periods: [
      { plan: "pro", interval: "month", amountCents: PRO, start: "2025-01", end: "2025-12" },
      { plan: "enterprise", interval: "month", amountCents: ENT, start: "2025-12", end: null },
    ],
  },
  {
    id: "F",
    signupMonth: "2025-12",
    periods: [
      { plan: "pro", interval: "month", amountCents: PRO, start: "2025-12", end: "2026-01" },
      { plan: "free", interval: "month", amountCents: 0, start: "2026-01", end: null },
    ],
  },
];

describe("MRR", () => {
  it("counts annual plans as the yearly price divided by 12, and Free as $0", () => {
    // A, B (478,800 / 12), C, D, E, F
    expect(computeMonthMetrics(fixture, "2025-12", "all").mrrCents).toBe(PRO * 4 + ENT * 2);
  });

  it("drops cancelled and Free customers", () => {
    const jan = computeMonthMetrics(fixture, "2026-01", "all");
    expect(jan.mrrCents).toBe(PRO * 3 + ENT); // A, C, D, E
    expect(jan.payingCustomers).toBe(4);
  });

  it("filters by the plan the customer is on in that month", () => {
    expect(computeMonthMetrics(fixture, "2026-01", "pro").mrrCents).toBe(PRO * 3);
    expect(computeMonthMetrics(fixture, "2026-01", "enterprise").mrrCents).toBe(ENT);
  });
});

describe("customer churn", () => {
  it("divides customers who stopped paying by customers paying at the start of the month", () => {
    const { churn } = computeMonthMetrics(fixture, "2026-01", "all");
    // Paying at end of Dec: A, B, C, D, E, F. Stopped paying in Jan: B, F.
    expect(churn).toEqual({ rate: 2 / 6, cancelled: 2, startingCustomers: 6 });
  });

  it("counts a move to Free as churn but an upgrade as not churn", () => {
    // Pro at end of Dec: A, C, D, F (E is already Enterprise). F moved to Free.
    expect(computeMonthMetrics(fixture, "2026-01", "pro").churn).toEqual({
      rate: 1 / 4,
      cancelled: 1,
      startingCustomers: 4,
    });
    // E upgraded Pro to Enterprise in Dec 2025: no Pro customer stopped paying.
    expect(computeMonthMetrics(fixture, "2025-12", "pro").churn.cancelled).toBe(0);
  });

  it("returns null when nobody was paying at the start of the month", () => {
    expect(computeMonthMetrics(fixture, "2025-01", "all").churn.rate).toBeNull();
  });
});

describe("net revenue retention", () => {
  it("divides this month's MRR from customers paying 12 months ago by their MRR then", () => {
    const { nrr } = computeMonthMetrics(fixture, "2026-01", "all");
    // Paying Jan 2025: A (Pro), B (Enterprise annual), E (Pro). C was on Free.
    // Their MRR in Jan 2026: A Pro, B gone, E Enterprise.
    expect(nrr.baseMonth).toBe("2025-01");
    expect(nrr.baseCustomers).toBe(3);
    expect(nrr.baseMrrCents).toBe(PRO * 2 + ENT);
    expect(nrr.currentMrrCents).toBe(PRO + ENT);
    expect(nrr.rate).toBeCloseTo((PRO + ENT) / (PRO * 2 + ENT));
  });

  it("filters by the plan 12 months ago and counts expansion onto other plans", () => {
    const { nrr } = computeMonthMetrics(fixture, "2026-01", "pro");
    expect(nrr.baseMrrCents).toBe(PRO * 2); // A, E
    expect(nrr.currentMrrCents).toBe(PRO + ENT);
  });

  it("returns null when nobody was paying 12 months ago", () => {
    expect(computeMonthMetrics(fixture, "2025-06", "all").nrr.rate).toBeNull();
  });
});

describe("new paying customers", () => {
  it("counts customers whose first paying month is this month", () => {
    expect(computeMonthMetrics(fixture, "2025-12", "all").newPaying).toBe(2); // D, F
    expect(computeMonthMetrics(fixture, "2025-06", "all").newPaying).toBe(1); // C, after Free
    expect(computeMonthMetrics(fixture, "2025-12", "enterprise").newPaying).toBe(0); // E first paid in Jan 2025
    expect(computeMonthMetrics(fixture, "2026-01", "all").newPaying).toBe(0);
  });
});

describe("MRR trend", () => {
  it("splits each month by plan", () => {
    const [dec] = computeMrrTrend(fixture, "2025-12", "2025-12", "all");
    expect(dec.byPlan).toEqual({ pro: PRO * 4, enterprise: ENT * 2 });
    expect(dec.totalCents).toBe(PRO * 4 + ENT * 2);
  });

  it("shows only the filtered plan", () => {
    const [dec] = computeMrrTrend(fixture, "2025-12", "2025-12", "pro");
    expect(dec.byPlan).toEqual({ pro: PRO * 4, enterprise: 0 });
  });
});

describe("cohorts", () => {
  it("groups by first paying month and tracks the share still paying", () => {
    const table = computeCohorts(fixture, "2025-12", "2026-02", "all");
    expect(table.maxOffset).toBe(2);
    expect(table.rows).toEqual([
      { month: "2025-12", size: 2, retention: [0.5, 0] }, // D, F: F left in Jan, D in Feb
      { month: "2026-01", size: 0, retention: [null, null] },
      { month: "2026-02", size: 0, retention: [null, null] },
    ]);
  });

  it("groups by first paid plan and keeps upgraded customers as still paying", () => {
    const table = computeCohorts(fixture, "2025-01", "2025-12", "pro");
    const jan = table.rows[0];
    expect(jan.size).toBe(2); // A, E. B started on Enterprise, C on Free.
    expect(jan.retention[10]).toBe(1); // Dec 2025: E is on Enterprise and still paying
  });
});

describe("computeDashboard", () => {
  it("compares the last month of the range with the month before it", () => {
    const data = computeDashboard(fixture, { plan: "all", from: "2025-12", to: "2026-01" });
    expect(data.current.month).toBe("2026-01");
    expect(data.previous.month).toBe("2025-12");
    expect(data.trend.map((p) => p.month)).toEqual(["2025-12", "2026-01"]);
  });

  it("accepts a reversed range", () => {
    const data = computeDashboard(fixture, { plan: "all", from: "2026-01", to: "2025-12" });
    expect(data.filters).toMatchObject({ from: "2025-12", to: "2026-01" });
  });
});

describe("months", () => {
  it("handles year boundaries and month lengths", () => {
    expect(monthRange("2025-11", "2026-02")).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
    expect(lastDayLabel("2026-10")).toBe("Oct 31, 2026");
    expect(lastDayLabel("2028-02")).toBe("Feb 29, 2028");
  });
});
