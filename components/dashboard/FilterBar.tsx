"use client";

import { PLAN_FILTER_LABELS } from "@/lib/domain/plans";
import type { DashboardFilters, MonthKey, PlanFilter } from "@/lib/domain/types";
import { formatMonth } from "@/lib/metrics/months";

const PLAN_OPTIONS: PlanFilter[] = ["all", "pro", "enterprise"];

interface FilterBarProps {
  filters: DashboardFilters;
  months: MonthKey[];
  onChange: (filters: DashboardFilters) => void;
  onReset: () => void;
  isDefault: boolean;
}

const selectClasses =
  "h-9 rounded-lg border border-line bg-surface pl-3 pr-8 text-sm text-ink shadow-sm transition-colors hover:border-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function FilterBar({ filters, months, onChange, onReset, isDefault }: FilterBarProps) {
  const setFrom = (from: MonthKey) => onChange({ ...filters, from, to: from > filters.to ? from : filters.to });
  const setTo = (to: MonthKey) => onChange({ ...filters, to, from: to < filters.from ? to : filters.from });

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <span id="plan-filter-label" className="mb-1 block text-xs font-medium text-muted">
          Plan
        </span>
        <div
          role="group"
          aria-labelledby="plan-filter-label"
          className="inline-flex h-9 rounded-lg border border-line bg-canvas p-0.5"
        >
          {PLAN_OPTIONS.map((plan) => {
            const selected = filters.plan === plan;
            return (
              <button
                key={plan}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange({ ...filters, plan })}
                className={`rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent ${
                  selected ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
                }`}
              >
                {PLAN_FILTER_LABELS[plan]}
              </button>
            );
          })}
        </div>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">From</span>
        <select className={selectClasses} value={filters.from} onChange={(e) => setFrom(e.target.value)}>
          {months.map((month) => (
            <option key={month} value={month}>
              {formatMonth(month)}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">To</span>
        <select className={selectClasses} value={filters.to} onChange={(e) => setTo(e.target.value)}>
          {months.map((month) => (
            <option key={month} value={month}>
              {formatMonth(month)}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={onReset}
        disabled={isDefault}
        className="h-9 rounded-lg px-3 text-sm font-medium text-accent transition-colors hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:text-faint disabled:hover:bg-transparent"
      >
        Reset
      </button>
    </div>
  );
}
