"use client";
import React from "react";
import type { CollectionBlockPayload } from "../collections/model";
import { MAX_COLLECTION_AUDIT } from "../collections/collectionAudit";
import { btnClass } from "./CollectionFieldEditor";

interface Props { data: CollectionBlockPayload; onClose: () => void }
const label = (data: CollectionBlockPayload, fieldId: string) =>
  fieldId === "$parent" ? "Parent" : fieldId === "$body" ? "Record notes" :
    fieldId === "$dependencies" ? "Task dependencies" : fieldId === "$checklist" ? "Checklist" :
    data.fields.find(field => field.id === fieldId)?.name ?? "Removed field";

export function CollectionAuditPanel({ data, onClose }: Props) {
  const history = (data.auditTrail ?? []).filter(entry => entry && typeof entry.id === "string" &&
    typeof entry.at === "number" && Number.isFinite(entry.at) &&
    Array.isArray(entry.changes)).map(entry => ({ ...entry,
      changes: entry.kind === "update" ? entry.changes.filter(change => change.before !== change.after) : entry.changes,
    })).filter(entry => entry.kind !== "update" || entry.changes.length > 0).slice(0, MAX_COLLECTION_AUDIT);
  return <section className="space-y-3 text-xs"
    aria-label="Collection record history" data-testid="collection-record-history">
    <div className="flex items-center justify-between gap-2">
      <div><h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Change history</h2>
        <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">{history.length} recent changes</p></div>
      <button type="button" className={btnClass} onClick={onClose}>Close</button>
    </div>
    {!history.length && <p className="rounded-lg border border-dashed p-4 text-center text-slate-600 dark:border-slate-700 dark:text-slate-400">No recorded changes yet.</p>}
    {history.map(entry => <article key={entry.id} className="space-y-2 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className={"inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide " +
            (entry.kind === "create" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300")}>{entry.kind}</span>
          <p className="mt-1 truncate font-semibold text-slate-800 dark:text-slate-100" title={entry.title}>{entry.title}</p>
        </div>
        <time dateTime={new Date(entry.at).toISOString()} className="shrink-0 text-[11px] text-slate-600 dark:text-slate-400">
          {new Date(entry.at).toLocaleString()}
        </time>
      </div>
      <div className="space-y-1.5">
        {entry.changes.map(change => <div key={change.fieldId} className="break-words rounded-md bg-slate-50 px-2 py-1.5 dark:bg-slate-800">
          <p className="font-medium text-slate-600 dark:text-slate-300">{label(data, change.fieldId)}</p>
          <p className="mt-0.5 text-slate-700 dark:text-slate-200"><span className="text-slate-500">{change.before || "(empty)"}</span>
            <span aria-hidden="true" className="mx-1.5 text-slate-400">→</span>{change.after || "(empty)"}</p>
        </div>)}
      </div>
      <p className="text-[11px] text-slate-600 dark:text-slate-400">{entry.actor}</p>
    </article>)}
  </section>;
}
