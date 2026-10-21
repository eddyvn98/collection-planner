"use client";
import React, { useState } from "react";
import { SquareArrowOutUpRight } from "lucide-react";
import { recordTitle, type CollectionBlockPayload, type CollectionField, type CollectionRecord,
  type CollectionView, type CollectionSources } from "../collections/model";
import { btnClass, FieldEditor } from "./CollectionFieldEditor";
import { CollectionRecordDetails } from "./CollectionRecordDetails";
import { CollectionSelectChip } from "./CollectionSelectChip";
import { collectionTablePage } from "./collectionTablePaging";
import { CollectionWrappedTextCell } from "./CollectionWrappedTextCell";
interface Props { data: CollectionBlockPayload; sources?: CollectionSources;
  view: CollectionView; rows: CollectionRecord[];
  titleField?: CollectionField; readOnly: boolean;
  patch: (record: CollectionRecord, field: CollectionField, value: string) => void;
  onChange: (data: CollectionBlockPayload) => void; }
const PAGE = 25;
export function CollectionGalleryView({ data, sources, view, rows, titleField, readOnly, patch, onChange }: Props) {
  const [requestedPage, setRequestedPage] = useState(0);
  const page = collectionTablePage(rows, requestedPage, PAGE);
  const [openRecordId, setOpenRecordId] = useState<string | null>(null);
  const eligible = data.fields.filter(field => field.id !== titleField?.id && field.type !== "image");
  const fieldIds = view.galleryFieldIds ?? eligible.slice(0, 3).map(field => field.id);
  const details = eligible.filter(field => fieldIds.includes(field.id));
  const image = data.fields.find(field => field.type === "image");
  return <div className="space-y-3" data-testid="collection-gallery">
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {page.rows.map(record => {
        const url = image ? record.values[image.id] : undefined;
        return <article key={record.id} className="group min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
          data-testid="collection-gallery-card" data-record-id={record.id}>
          {url && /^https?:\/\//i.test(url)
            && <img src={url} alt={`${recordTitle(data, record)} cover`} loading="lazy" className="h-36 w-full bg-slate-100 object-cover dark:bg-slate-800" />}
          <div className="space-y-3 p-4">
            <header className="flex min-w-0 items-start justify-between gap-2">
              <h3 className="min-w-0 flex-1 whitespace-normal break-words text-sm font-semibold leading-5" title={recordTitle(data, record)}>{recordTitle(data, record)}</h3>
              <button type="button" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-slate-800"
                onClick={() => setOpenRecordId(record.id)} aria-label={`Open ${recordTitle(data, record)}`} title="Open record details">
                <SquareArrowOutUpRight aria-hidden="true" className="h-4 w-4" />
              </button>
            </header>
            {details.map(field => <label key={field.id} className={`flex min-w-0 gap-3 border-t border-slate-100 pt-2 text-xs dark:border-slate-800 ${field.type === "text" ? "items-start" : "items-center justify-between"}`}>
              <span className="shrink-0 text-slate-500 dark:text-slate-400">{field.name}</span>
              {field.type === "select" ? <CollectionSelectChip label={`${field.name} for ${recordTitle(data, record)}`}
                value={record.values[field.id] ?? ""} options={field.options ?? []} disabled={readOnly}
                onChange={value => patch(record, field, value)} />
                : field.type === "text" ? <span className="min-w-0 flex-1"><CollectionWrappedTextCell label={`${field.name} for ${recordTitle(data, record)}`}
                    value={record.values[field.id] ?? ""} disabled={readOnly} resize="none" onChange={value => patch(record, field, value)} /></span>
                : <span className="min-w-0 flex-1"> <FieldEditor field={field} value={record.values[field.id] ?? ""}
                    readOnly={readOnly} data={data} sources={sources} recordId={record.id}
                    onSet={value => patch(record, field, value)} /> </span>}
            </label>)}
          </div>
        </article>;
      })}
    </div>
    {openRecordId && <CollectionRecordDetails data={data} sources={sources} recordId={openRecordId}
      readOnly={readOnly} onChange={onChange} onClose={() => setOpenRecordId(null)} />}
    <nav aria-label="Collection Gallery pagination" className="flex flex-wrap items-center gap-2 text-xs">
      <span data-testid="collection-gallery-page-summary">{page.total ? page.start + 1 : 0}–{page.end} of {page.total} cards</span>
      <button type="button" className={btnClass} aria-label="Previous gallery page" disabled={page.pageIndex === 0}
        onClick={() => setRequestedPage(page.pageIndex - 1)}>Previous</button>
      <span data-testid="collection-gallery-page-number">Page {page.pageIndex + 1} of {page.pageCount}</span>
      <button type="button" className={btnClass} aria-label="Next gallery page"
        disabled={page.pageIndex >= page.pageCount - 1}
        onClick={() => setRequestedPage(page.pageIndex + 1)}>Next</button>
    </nav>
  </div>;
}
