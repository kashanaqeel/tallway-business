import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PAID_PLANS, PLAN_LABELS } from "@/lib/domain/plans";
import type { PaidPlan, PlanFilter } from "@/lib/domain/types";
import { formatCompactCurrency, formatCurrency, formatSignedCurrency, formatSignedPercent } from "@/lib/format";
import type { TrendPoint } from "@/lib/metrics";
import { formatMonth, monthName } from "@/lib/metrics/months";

const SEGMENT_CLASSES: Record<PaidPlan, string> = {
  pro: "bg-pro",
  enterprise: "bg-enterprise",
};

const GRID_LINES = 4;

function niceCeiling(value: number): number {
  if (value <= 0) return 1;
  const rawStep = value / GRID_LINES;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((s) => s * magnitude >= rawStep) ?? 10;
  return step * magnitude * GRID_LINES;
}

function GrowthSummary({ points, plans }: { points: TrendPoint[]; plans: PaidPlan[] }) {
  const first = points[0];
  const last = points[points.length - 1];
  if (points.length < 2) {
    return <>Total MRR in {formatMonth(last.month)}: {formatCurrency(last.totalCents)}.</>;
  }
  const change = last.totalCents - first.totalCents;
  return (
    <>
      {formatCurrency(first.totalCents)} in {formatMonth(first.month)} to {formatCurrency(last.totalCents)} in{" "}
      {formatMonth(last.month)}
      {first.totalCents > 0 && <> ({formatSignedPercent(change / first.totalCents)})</>}.{" "}
      {plans.length > 1 &&
        plans.map((plan, index) => (
          <span key={plan}>
            {PLAN_LABELS[plan]} {formatSignedCurrency(last.byPlan[plan] - first.byPlan[plan])}
            {index < plans.length - 1 ? ", " : "."}
          </span>
        ))}
    </>
  );
}

export function MrrTrendChart({ points, plan }: { points: TrendPoint[]; plan: PlanFilter }) {
  const plans = plan === "all" ? PAID_PLANS : [plan];
  const hasData = points.some((p) => p.totalCents > 0);
  const max = niceCeiling(Math.max(...points.map((p) => p.totalCents)));

  return (
    <Card
      title="MRR trend by plan"
      description={hasData ? <GrowthSummary points={points} plans={plans} /> : undefined}
      actions={
        <ul className="flex gap-4 text-xs text-muted" aria-label="Legend">
          {plans.map((p) => (
            <li key={p} className="flex items-center gap-1.5">
              <span aria-hidden="true" className={`size-2.5 rounded-sm ${SEGMENT_CLASSES[p]}`} />
              {PLAN_LABELS[p]}
            </li>
          ))}
        </ul>
      }
    >
      {!hasData ? (
        <EmptyState title="No MRR in this range" description="No paying customers match the selected plan and months." />
      ) : (
        <div className="flex gap-3">
          <div className="relative h-64 w-12 shrink-0 text-right text-[0.7rem] text-faint tabular-nums" aria-hidden="true">
            {Array.from({ length: GRID_LINES + 1 }, (_, i) => (
              <span
                key={i}
                className="absolute right-0 -translate-y-1/2"
                style={{ top: `${(i / GRID_LINES) * 100}%` }}
              >
                {formatCompactCurrency((max * (GRID_LINES - i)) / GRID_LINES)}
              </span>
            ))}
          </div>

          <div className="min-w-0 flex-1">
            <div className="relative h-64">
              {Array.from({ length: GRID_LINES + 1 }, (_, i) => (
                <div
                  key={i}
                  aria-hidden="true"
                  className="absolute inset-x-0 border-t border-line"
                  style={{ top: `${(i / GRID_LINES) * 100}%` }}
                />
              ))}
              <ol className="relative flex h-full items-end gap-1 sm:gap-2" aria-label="Monthly MRR">
                {points.map((point) => (
                  <li
                    key={point.month}
                    tabIndex={0}
                    aria-label={`${formatMonth(point.month, "long")}: ${formatCurrency(point.totalCents)} total, ${plans
                      .map((p) => `${PLAN_LABELS[p]} ${formatCurrency(point.byPlan[p])}`)
                      .join(", ")}`}
                    className="group relative flex h-full flex-1 flex-col justify-end rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <div
                      className="flex flex-col-reverse overflow-hidden rounded-t-sm transition-opacity group-hover:opacity-85"
                      style={{ height: `${(point.totalCents / max) * 100}%` }}
                    >
                      {plans.map((p) => (
                        <div
                          key={p}
                          className={SEGMENT_CLASSES[p]}
                          style={{ height: point.totalCents > 0 ? `${(point.byPlan[p] / point.totalCents) * 100}%` : 0 }}
                        />
                      ))}
                    </div>
                    <div
                      role="presentation"
                      className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-max -translate-x-1/2 rounded-lg bg-ink px-3 py-2 text-xs text-white shadow-lg group-hover:block group-focus-visible:block"
                    >
                      <p className="font-semibold">{formatMonth(point.month, "long")}</p>
                      {plans.map((p) => (
                        <p key={p} className="tabular-nums text-white/80">
                          {PLAN_LABELS[p]}: {formatCurrency(point.byPlan[p])}
                        </p>
                      ))}
                      <p className="mt-1 tabular-nums">Total: {formatCurrency(point.totalCents)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="mt-2 flex gap-1 text-center text-[0.7rem] text-faint sm:gap-2" aria-hidden="true">
              {points.map((point) => (
                <span key={point.month} className="min-w-0 flex-1">
                  <span className="sm:hidden">{monthName(point.month)[0]}</span>
                  <span className="hidden sm:inline">{monthName(point.month)}</span>
                  {(point.month.endsWith("-01") || point === points[0]) && (
                    <span className="block">
                      <span className="sm:hidden">’{point.month.slice(2, 4)}</span>
                      <span className="hidden sm:inline">{point.month.slice(0, 4)}</span>
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
