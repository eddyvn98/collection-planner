"use client";

import { ChevronDown } from "lucide-react";

interface Props {
  label: string;
  value: string;
  options: string[];
  disabled: boolean;
  onChange: (value: string) => void;
}

function tone(value: string): string {
  if (/done|complete|closed|resolved/i.test(value)) return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300";
  if (/progress|doing|active|review/i.test(value)) return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300";
  if (/to do|todo|backlog|not started|new/i.test(value)) return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300";
  if (/blocked|hold/i.test(value)) return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300";
  return "border-[var(--planner-border)] bg-[var(--planner-hover)] text-[var(--planner-secondary)] dark:border-[var(--planner-border)] dark:bg-[var(--planner-surface)] dark:text-[var(--planner-secondary)]";
}

export function CollectionSelectChip({ label, value, options, disabled, onChange }: Props) {
  return <span className="relative inline-flex max-w-full items-center">
    <select aria-label={label} title={`${label}: ${value || "Unassigned"}`}
      className={`max-w-full appearance-none rounded-full border py-1 pl-2.5 pr-7 text-xs font-semibold leading-4 outline-none transition focus-visible:ring-2 focus-visible:ring-blue-500 ${tone(value)}`}
      disabled={disabled} value={value} onChange={event => onChange(event.target.value)}>
      <option value="">Unassigned</option>{options.map(option => <option key={option} value={option}>{option}</option>)}
    </select>
    <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2 h-3 w-3 opacity-70" />
  </span>;
}
