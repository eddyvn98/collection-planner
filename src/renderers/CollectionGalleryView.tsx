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
import { CollectionReorderHandle } from "./CollectionReorderHandle";
import { orderedGalleryRows,reorderGallery } from "../collections/collectionViewReorder";
import {groupViewRows,viewGroupName} from "../collections/collectionToolbarGrouping";
interface Props { data: CollectionBlockPayload; sources?: CollectionSources;
  view: CollectionView; rows: CollectionRecord[];
  titleField?: CollectionField; readOnly: boolean;
  patch: (record: CollectionRecord, field: CollectionField, value: string) => void;
  onChange: (data: CollectionBlockPayload) => void; }
const PAGE = 25;
export function CollectionGalleryView({ data, sources, view, rows, titleField, readOnly, patch, onChange }: Props) {
  const [requestedPage, setRequestedPage] = useState(0);
  const groupField=data.fields.find(f=>f.id===view.groupFieldId&&f.type==="select");
  const page = collectionTablePage(groupViewRows(orderedGalleryRows(rows,view),groupField), requestedPage, PAGE);
  const order=page.rows.map(item=>item.id);
  const move=(source:string,target:string)=>{
   const next=reorderGallery(data,view.id,source,target);
   if(next!==data)onChange(next);
  };
  const [openRecordId, setOpenRecordId] = useState<string | null>(null);
  const eligible = data.fields.filter(field => field.id !== titleField?.id && field.type !== "image");
  const fieldIds = view.galleryFieldIds ?? eligible.slice(0, 3).map(field => field.id);
  const details = eligible.filter(field => fieldIds.includes(field.id));
  const image = data.fields.find(field => field.type === "image");
  return <div className="space-y-3" data-testid="collection-gallery">
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {page.rows.map((record,index) => {
        const url = image ? record.values[image.id] : undefined;
        return <React.Fragment key={record.id}>
         {groupField&&(index===0||page.rows[index-1]?.values[groupField.id]!==record.values[groupField.id])&&
          <h3 data-testid="planner-gallery-group" className="col-span-full min-h-11 border-b border-[var(--planner-border)] py-2 text-sm font-semibold">
           {groupField.name}: {viewGroupName(record,groupField)}</h3>}
        <article data-reorder-kind="gallery" data-reorder-id={record.id} className="group min-w-0 overflow-hidden rounded-xl border border-[var(--planner-border)] bg-[var(--planner-surface)] shadow-sm transition-shadow hover:shadow-md dark:border-[var(--planner-border)] dark:bg-[var(--planner-surface)]"
          data-testid="collection-gallery-card" data-record-id={record.id}>
          {url && /^https?:\/\//i.test(url)
            && <img src={url} alt={`${recordTitle(data, record)} cover`} loading="lazy" className="h-36 w-full bg-[var(--planner-hover)] object-cover dark:bg-[var(--planner-surface)]" />}
          <div className="space-y-3 p-4">
            <header className="flex min-h-11 min-w-0 items-center justify-between gap-1">
              <CollectionReorderHandle kind="gallery" itemId={record.id} label={recordTitle(data,record)}
               items={order} disabled={readOnly} onMove={move}/>
              <h3 className="min-w-0 flex-1 whitespace-normal break-words text-sm font-semibold leading-5" title={recordTitle(data, record)}>{recordTitle(data, record)}</h3>
              <button type="button" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-[var(--planner-secondary)] hover:bg-[var(--planner-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-[var(--planner-surface)]"
                onClick={() => setOpenRecordId(record.id)} aria-label={`Open ${recordTitle(data, record)}`} title="Open record details">
                <SquareArrowOutUpRight aria-hidden="true" className="h-4 w-4" />
              </button>
            </header>
            {details.map(field => <label key={field.id} className={`flex min-w-0 gap-3 border-t border-[var(--planner-border)] pt-2 text-xs dark:border-[var(--planner-border)] ${field.type === "text" ? "items-start" : "items-center justify-between"}`}>
              <span className="shrink-0 text-[var(--planner-secondary)] dark:text-[var(--planner-secondary)]">{field.name}</span>
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
        </article></React.Fragment>;
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
