import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PLAN_FILTER_LABELS } from "@/lib/domain/plans";
import type { PlanFilter } from "@/lib/domain/types";
import { formatPercent } from "@/lib/format";
import type { CohortRow, CohortTable as CohortTableData } from "@/lib/metrics";
import { formatMonth } from "@/lib/metrics/months";

/** Shading strength grows from 50% retention up to 100%, so drops stand out as pale cells. */
function cellStyle(rate: number) {
  const strength = Math.min(1, Math.max(0, (rate - 0.5) / 0.5));
  return {
    backgroundColor: `color-mix(in oklab, var(--color-accent) ${Math.round(12 + strength * 70)}%, white)`,
    color: strength > 0.55 ? "white" : "var(--color-ink)",
  };
}

const MIN_COMPARABLE_COHORTS = 3;
const MIN_SHORTFALL = 0.05;

/**
 * The cohort whose latest retention falls furthest below the average of every
 * cohort that reached the same month, if it is meaningfully below.
 */
function findWeakest(rows: CohortRow[]) {
  let weakest: { row: CohortRow; offset: number; rate: number; average: number } | null = null;
  for (const row of rows) {
    const offset = row.retention.findLastIndex((rate) => rate !== null) + 1;
    if (row.size === 0 || offset === 0) continue;

    const peers = rows.filter((r) => r.size > 0 && r.retention[offset - 1] !== null);
    if (peers.length < MIN_COMPARABLE_COHORTS) continue;

    const rate = row.retention[offset - 1]!;
    const average = peers.reduce((sum, r) => sum + r.retention[offset - 1]!, 0) / peers.length;
    if (average - rate >= MIN_SHORTFALL && (!weakest || rate - average < weakest.rate - weakest.average)) {
      weakest = { row, offset, rate, average };
    }
  }
  return weakest;
}

export function CohortTable({ data, plan }: { data: CohortTableData; plan: PlanFilter }) {
  const { rows, maxOffset } = data;
  const hasCohorts = rows.some((r) => r.size > 0);
  const weakest = findWeakest(rows);
  const offsets = Array.from({ length: maxOffset }, (_, i) => i + 1);

  return (
    <Card
      title="Cohort retention"
      description={
        <>
          Customers grouped by the month they first paid{plan === "all" ? "" : ` for ${PLAN_FILTER_LABELS[plan]}`}. Each cell
          is the percent still paying that many months later.
        </>
      }
    >
      {!hasCohorts ? (
        <EmptyState
          title="No new paying customers in this range"
          description="Widen the date range or choose another plan to see cohorts."
        />
      ) : (
        <>
          {weakest && (
            <p className="mb-4 rounded-lg border border-bad/20 bg-bad-soft px-4 py-3 text-sm text-ink">
              <span className="font-semibold">Weakest cohort: {formatMonth(weakest.row.month, "long")}.</span>{" "}
              {formatPercent(weakest.rate, 0)} still paying after {weakest.offset} month{weakest.offset === 1 ? "" : "s"},
              against an average of {formatPercent(weakest.average, 0)} for cohorts at the same point.
            </p>
          )}
          {maxOffset === 0 && (
            <p className="mb-4 text-sm text-muted">Pick a range longer than one month to see retention.</p>
          )}
          <div className="-mx-5 overflow-x-auto px-5 sm:-mx-6 sm:px-6">
            <table className="w-full min-w-max border-separate border-spacing-1 text-sm">
              <caption className="sr-only">
                Percent of each cohort still paying in each later month
              </caption>
              <thead>
                <tr className="text-xs font-medium text-muted">
                  <th scope="col" className="px-2 py-1 text-left font-medium">
                    First paid
                  </th>
                  <th scope="col" className="px-2 py-1 text-right font-medium">
                    Customers
                  </th>
                  {offsets.map((offset) => (
                    <th key={offset} scope="col" className="min-w-14 px-2 py-1 text-center font-medium">
                      <span className="sr-only">Month </span>M{offset}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.month}>
                    <th
                      scope="row"
                      className={`whitespace-nowrap px-2 py-1.5 text-left font-medium ${
                        weakest?.row === row ? "text-bad" : "text-ink"
                      }`}
                    >
                      {formatMonth(row.month)}
                    </th>
                    <td className="px-2 py-1.5 text-right tabular-nums text-muted">{row.size}</td>
                    {row.retention.map((rate, index) => (
                      <td
                        key={index}
                        className="rounded-md px-2 py-1.5 text-center text-xs font-medium tabular-nums"
                        style={rate === null ? undefined : cellStyle(rate)}
                      >
                        {rate === null ? <span className="text-faint">{row.size === 0 ? "–" : ""}</span> : formatPercent(rate, 0)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  );
}
