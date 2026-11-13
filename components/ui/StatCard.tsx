import type { ReactNode } from "react";
import { DeltaPill, type DeltaTone } from "./DeltaPill";

export interface StatDelta {
  text: string;
  tone: DeltaTone;
  direction: "up" | "down" | "flat";
}

interface StatCardProps {
  question: string;
  label: string;
  value: string;
  delta: StatDelta | null;
  comparisonLabel: string;
  detail: ReactNode;
}

export function StatCard({ question, label, value, delta, comparisonLabel, detail }: StatCardProps) {
  return (
    <article className="flex flex-col rounded-xl border border-line bg-surface p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-faint">{question}</p>
      <h2 className="mt-2 text-sm font-medium text-muted">{label}</h2>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-ink tabular-nums">{value}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
        {delta ? (
          <>
            <DeltaPill {...delta} />
            <span>vs {comparisonLabel}</span>
          </>
        ) : (
          <span>No comparison for {comparisonLabel}</span>
        )}
      </div>
      <p className="mt-3 border-t border-line pt-3 text-xs leading-5 text-muted">{detail}</p>
    </article>
  );
}
