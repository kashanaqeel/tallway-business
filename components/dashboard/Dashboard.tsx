"use client";

import { useMemo, useState } from "react";
import type { Customer, DashboardFilters, MonthKey } from "@/lib/domain/types";
import { computeDashboard } from "@/lib/metrics";
import { CohortTable } from "./CohortTable";
import { FilterBar } from "./FilterBar";
import { HeadlineCards } from "./HeadlineCards";
import { MrrTrendChart } from "./MrrTrendChart";

interface DashboardProps {
  customers: Customer[];
  months: MonthKey[];
  dataThroughLabel: string;
}

export function Dashboard({ customers, months, dataThroughLabel }: DashboardProps) {
  const defaults = useMemo<DashboardFilters>(
    () => ({ plan: "all", from: months[0], to: months[months.length - 1] }),
    [months],
  );
  const [filters, setFilters] = useState<DashboardFilters>(defaults);
  const data = useMemo(() => computeDashboard(customers, filters), [customers, filters]);
  const isDefault = filters.plan === defaults.plan && filters.from === defaults.from && filters.to === defaults.to;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-accent">Tallyway</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Revenue overview</h1>
          <p className="mt-1 text-sm text-muted">Data through {dataThroughLabel}. Mock data; not connected to Stripe.</p>
        </div>
        <FilterBar
          filters={filters}
          months={months}
          onChange={setFilters}
          onReset={() => setFilters(defaults)}
          isDefault={isDefault}
        />
      </header>

      <HeadlineCards current={data.current} previous={data.previous} plan={filters.plan} />
      <MrrTrendChart points={data.trend} plan={filters.plan} />
      <CohortTable data={data.cohorts} plan={filters.plan} />
    </div>
  );
}
