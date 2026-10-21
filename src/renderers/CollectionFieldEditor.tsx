"use client";
import React from "react";
import type { CollectionBlockPayload, CollectionField, CollectionSources } from "../collections/model";
import { recordTitle } from "../collections/model";
import { relationIds, encodeRelationIds } from "../collections/collectionRelations";
export const inputClass = "rounded-md border border-[var(--planner-border)] bg-[var(--planner-surface)] px-3 py-2 text-sm text-[var(--planner-text)] outline-none transition placeholder:text-xs placeholder:text-[var(--planner-secondary)] focus-visible:border-[var(--planner-accent)] focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)]";
export const hintClass = "text-xs leading-relaxed text-[var(--planner-secondary)]";
export const emptyValueClass = "text-xs text-[var(--planner-secondary)]";
export const btnClass = "inline-flex min-h-8 items-center justify-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-[var(--planner-secondary)] transition-colors hover:bg-[var(--planner-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)] disabled:opacity-40";
export const fieldTypeLabels: Record<CollectionField["type"], string> = {
  text: "Text", number: "Number", date: "Date", select: "Dropdown", checkbox: "Checkbox",
  url: "URL", image: "Image", relation: "Linked records", lookup: "Related value",
  rollup: "Related calculation", formula: "Calculated value",
};
export const fieldTypeGuidance = "Text stores names or notes; Number stores quantities; Dropdown limits choices; Linked records connects records; related and calculated fields show derived values.";
export function FieldEditor({ field, value, onSet, readOnly, data, recordId, sources, compact = false }: {
  field: CollectionField; value: string; onSet: (value: string) => void;
  readOnly: boolean; data?: CollectionBlockPayload; recordId?: string; sources?: CollectionSources;
  compact?: boolean;
}) {
  if (field.type === "lookup" || field.type === "formula" || field.type === "rollup") return <output aria-label={field.name}
    className={`block ${compact ? "min-w-0" : "min-w-20"} truncate rounded bg-[var(--planner-hover)] p-1 text-xs text-[var(--planner-text)]`} title={value}>{value}</output>;
  if (field.type === "relation") {
    const target = field.relationTargetBlockId ? sources?.[field.relationTargetBlockId] : data;
    const options = target?.records.filter(record => field.relationTargetBlockId || record.id !== recordId) ?? [];
    if (field.relationMultiple) return <select aria-label={field.name} className={inputClass + " min-h-24" + (compact ? " w-full min-w-0" : "")}
      multiple value={relationIds(value)} disabled={readOnly || !data}
      onChange={event => onSet(encodeRelationIds(Array.from(event.currentTarget.selectedOptions, option => option.value), true))}>
      {options.map(record => <option key={record.id} value={record.id}>{recordTitle(target!, record)}</option>)}
    </select>;
    return <select aria-label={field.name} className={inputClass + (compact ? " w-full min-w-0" : "") + (!value ? " " + emptyValueClass : "")}
      value={value} disabled={readOnly || !data} onChange={event => onSet(event.target.value)}>
      <option value="">Unlinked</option>
      {options.map(record => <option key={record.id} value={record.id}>{recordTitle(target!, record)}</option>)}
    </select>;
  }
  if (field.type === "checkbox") return <input aria-label={field.name} type="checkbox"
    checked={value === "true"} disabled={readOnly} onChange={event => onSet(String(event.target.checked))} />;
  if (field.type === "select") return <select aria-label={field.name} className={inputClass + (compact ? " w-full min-w-0" : "") + (!value ? " " + emptyValueClass : "")}
    value={value} disabled={readOnly} onChange={event => onSet(event.target.value)}>
    <option value="">Unassigned</option>
    {(field.options ?? []).map(option => <option key={option} value={option}>{option}</option>)}
  </select>;
  const emptyDate = field.type === "date" && !value;
  return <input aria-label={field.name} className={inputClass + ` w-full ${compact ? "min-w-0" : "min-w-20"}` + (field.type === "number" ? " text-right" : " text-left") + (emptyDate ? " " + emptyValueClass : "")}
    value={value} type={field.type === "date" ? "date" : field.type === "number" ? "number" :
      field.type === "url" ? "url" : "text"} disabled={readOnly} onChange={event => onSet(event.target.value)} />;
}
