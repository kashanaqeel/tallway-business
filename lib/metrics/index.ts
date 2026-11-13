import type { Customer, DashboardFilters } from "../domain/types";
import { computeCohorts, type CohortTable } from "./cohorts";
import { computeMonthMetrics, type MonthMetrics } from "./headline";
import { addMonths } from "./months";
import { computeMrrTrend, type TrendPoint } from "./trend";

export interface DashboardData {
  filters: DashboardFilters;
  current: MonthMetrics;
  previous: MonthMetrics;
  trend: TrendPoint[];
  cohorts: CohortTable;
}

/** Headline cards compare the last month of the range with the month before it. */
export function computeDashboard(customers: Customer[], filters: DashboardFilters): DashboardData {
  const [from, to] = filters.from <= filters.to ? [filters.from, filters.to] : [filters.to, filters.from];
  const normalized = { ...filters, from, to };
  return {
    filters: normalized,
    current: computeMonthMetrics(customers, to, filters.plan),
    previous: computeMonthMetrics(customers, addMonths(to, -1), filters.plan),
    trend: computeMrrTrend(customers, from, to, filters.plan),
    cohorts: computeCohorts(customers, from, to, filters.plan),
  };
}

export type { CohortRow, CohortTable } from "./cohorts";
export type { MonthMetrics } from "./headline";
export type { TrendPoint } from "./trend";
