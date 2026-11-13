import { StatCard, type StatDelta } from "@/components/ui/StatCard";
import { PLAN_FILTER_LABELS } from "@/lib/domain/plans";
import type { PlanFilter } from "@/lib/domain/types";
import {
  formatCurrency,
  formatPercent,
  formatPoints,
  formatSignedCurrency,
  formatSignedNumber,
  formatSignedPercent,
} from "@/lib/format";
import type { MonthMetrics } from "@/lib/metrics";
import { formatMonth } from "@/lib/metrics/months";

function delta(
  diff: number | null,
  text: (diff: number) => string,
  higherIsBetter: boolean,
): StatDelta | null {
  if (diff === null || !Number.isFinite(diff)) return null;
  if (Math.abs(diff) < 1e-9) return { text: text(0), tone: "neutral", direction: "flat" };
  const up = diff > 0;
  return { text: text(diff), tone: up === higherIsBetter ? "good" : "bad", direction: up ? "up" : "down" };
}

function rateDiff(current: number | null, previous: number | null): number | null {
  return current === null || previous === null ? null : current - previous;
}

interface HeadlineCardsProps {
  current: MonthMetrics;
  previous: MonthMetrics;
  plan: PlanFilter;
}

export function HeadlineCards({ current, previous, plan }: HeadlineCardsProps) {
  const comparisonLabel = formatMonth(previous.month);
  const scope = plan === "all" ? "" : ` on ${PLAN_FILTER_LABELS[plan]}`;
  const mrrChange = previous.mrrCents > 0 ? (current.mrrCents - previous.mrrCents) / previous.mrrCents : null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        question="Are we growing?"
        label="Monthly recurring revenue"
        value={formatCurrency(current.mrrCents)}
        delta={delta(mrrChange, formatSignedPercent, true)}
        comparisonLabel={comparisonLabel}
        detail={
          <>
            {current.payingCustomers} paying customers{scope}.{" "}
            {formatSignedCurrency(current.mrrCents - previous.mrrCents)} since {comparisonLabel}.
          </>
        }
      />
      <StatCard
        question="Are we keeping customers?"
        label="Customer churn"
        value={current.churn.rate === null ? "n/a" : formatPercent(current.churn.rate)}
        delta={delta(rateDiff(current.churn.rate, previous.churn.rate), formatPoints, false)}
        comparisonLabel={comparisonLabel}
        detail={
          current.churn.rate === null ? (
            <>No paying customers{scope} at the start of {formatMonth(current.month)}.</>
          ) : (
            <>
              {current.churn.cancelled} of {current.churn.startingCustomers} customers paying{scope} at the start of{" "}
              {formatMonth(current.month)} cancelled.
            </>
          )
        }
      />
      <StatCard
        question="Are we keeping customers?"
        label="Net revenue retention"
        value={current.nrr.rate === null ? "n/a" : formatPercent(current.nrr.rate)}
        delta={delta(rateDiff(current.nrr.rate, previous.nrr.rate), formatPoints, true)}
        comparisonLabel={comparisonLabel}
        detail={
          current.nrr.rate === null ? (
            <>No customers were paying{scope} in {formatMonth(current.nrr.baseMonth)}.</>
          ) : (
            <>
              {current.nrr.baseCustomers} customers paying{scope} in {formatMonth(current.nrr.baseMonth)}:{" "}
              {formatCurrency(current.nrr.baseMrrCents)} MRR then, {formatCurrency(current.nrr.currentMrrCents)} now.
            </>
          )
        }
      />
      <StatCard
        question="Are we growing?"
        label="New paying customers"
        value={String(current.newPaying)}
        delta={delta(current.newPaying - previous.newPaying, formatSignedNumber, true)}
        comparisonLabel={comparisonLabel}
        detail={
          <>
            First paid{plan === "all" ? "" : ` for ${PLAN_FILTER_LABELS[plan]}`} in {formatMonth(current.month)}, including
            upgrades from Free.
          </>
        }
      />
    </div>
  );
}
