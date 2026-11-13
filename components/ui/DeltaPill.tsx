export type DeltaTone = "good" | "bad" | "neutral";

const TONE_CLASSES: Record<DeltaTone, string> = {
  good: "bg-good-soft text-good",
  bad: "bg-bad-soft text-bad",
  neutral: "bg-canvas text-muted",
};

const TONE_LABELS: Record<DeltaTone, string> = {
  good: "better",
  bad: "worse",
  neutral: "no change",
};

/** `direction` is which way the underlying number moved, independent of tone. */
export function DeltaPill({
  text,
  tone,
  direction,
}: {
  text: string;
  tone: DeltaTone;
  direction: "up" | "down" | "flat";
}) {
  const arrow = direction === "up" ? "▲" : direction === "down" ? "▼" : "●";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${TONE_CLASSES[tone]}`}
    >
      <span aria-hidden="true" className="text-[0.6rem]">
        {arrow}
      </span>
      {text}
      <span className="sr-only">({TONE_LABELS[tone]})</span>
    </span>
  );
}
