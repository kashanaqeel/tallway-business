import type { MonthKey } from "../domain/types";

const SHORT_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LONG_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function toIndex(month: MonthKey): number {
  const [year, mon] = month.split("-").map(Number);
  return year * 12 + (mon - 1);
}

function fromIndex(index: number): MonthKey {
  const year = Math.floor(index / 12);
  const mon = (index % 12) + 1;
  return `${year}-${String(mon).padStart(2, "0")}`;
}

export function addMonths(month: MonthKey, count: number): MonthKey {
  return fromIndex(toIndex(month) + count);
}

/** Whole months from `from` to `to`; negative if `to` is earlier. */
export function monthsBetween(from: MonthKey, to: MonthKey): number {
  return toIndex(to) - toIndex(from);
}

/** Every month from `from` to `to`, inclusive. Empty if `to` is earlier. */
export function monthRange(from: MonthKey, to: MonthKey): MonthKey[] {
  const months: MonthKey[] = [];
  for (let i = toIndex(from); i <= toIndex(to); i++) {
    months.push(fromIndex(i));
  }
  return months;
}

export function formatMonth(month: MonthKey, style: "short" | "long" = "short"): string {
  const [year, mon] = month.split("-").map(Number);
  const names = style === "short" ? SHORT_NAMES : LONG_NAMES;
  return `${names[mon - 1]} ${year}`;
}

export function monthName(month: MonthKey): string {
  return SHORT_NAMES[Number(month.split("-")[1]) - 1];
}

export function lastDayLabel(month: MonthKey): string {
  const [year, mon] = month.split("-").map(Number);
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const lastDay = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mon - 1];
  return `${SHORT_NAMES[mon - 1]} ${lastDay}, ${year}`;
}
