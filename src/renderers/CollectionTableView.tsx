"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { Plus, Circle, CheckCircle2 } from "lucide-react";
import { setTaskProgress } from "./collectionBoardGroups";
import { flexRender, getCoreRowModel, useReactTable,
  type ColumnDef, type SortingState } from "@tanstack/react-table";
import { addField, addRecord, deleteRecord, removeField, recordTitle, viewSorts, type CollectionBlockPayload,
  type CollectionField, type CollectionRecord, type CollectionView, type CollectionSources } from "../collections/model";
import { CollectionTableColumnHeader } from "./CollectionTableColumnHeader";
import { CollectionWrappedTextCell } from "./CollectionWrappedTextCell";
import { btnClass, FieldEditor } from "./CollectionFieldEditor";
import { CollectionRecordDetails } from "./CollectionRecordDetails";
import { CollectionSelectChip } from "./CollectionSelectChip";
import { calculateCollectionAggregate } from "../collections/collectionFormula";
import { COLLECTION_PAGE_SIZES, collectionTablePage, type CollectionPageSize } from "./collectionTablePaging";
import { gridFields } from "../collections/collectionPlannerFilters";
import { CollectionGridToolbar } from "./CollectionGridToolbar";
import { CollectionGridAddRow } from "./CollectionGridAddRow";
import { CollectionGridMobileCards } from "./CollectionGridMobileCards";
import { CollectionGridAddQuick } from "./CollectionGridAddRow";
import { gridTaskColumns } from "./collectionGridTaskColumns";

interface Props {
  data: CollectionBlockPayload; sources?: CollectionSources;
  view: CollectionView; rows: CollectionRecord[];
  readOnly: boolean; onChange: (next: CollectionBlockPayload) => void;
  patch: (record: CollectionRecord, field: CollectionField, value: string) => void;
  onOpenFieldSettings: (fieldId: string) => void;
}
const getRecordId = (row: CollectionRecord) => row.id;

export function CollectionTableView({ data, sources, view, rows, readOnly, onChange, patch, onOpenFieldSettings }: Props) {
  // Keep the cell renderer identity stable while edits update Collection data.
  // Calling the latest patch via a ref avoids unmounting the focused input.
  const patchRef = useRef(patch);
  patchRef.current = patch;
  const dataRef = useRef(data);
  dataRef.current = data;
  const sourcesRef = useRef(sources);
  sourcesRef.current = sources;
  const [requestedPage, setRequestedPage] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [openRecordId, setOpenRecordId] = useState<string | null>(null);
  const [pendingDeleteFieldId, setPendingDeleteFieldId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor));
  const [pageSize, setPageSize] = useState<CollectionPageSize>(50);
  const tableScroll = useRef<HTMLDivElement>(null);
  const previousFieldCount = useRef(data.fields.length);
  useEffect(() => {
    if (data.fields.length > previousFieldCount.current) {
      tableScroll.current?.scrollTo({ left: tableScroll.current.scrollWidth, behavior: "smooth" });
    }
    previousFieldCount.current = data.fields.length;
  }, [data.fields.length]);
  const visibleFields = useMemo(() => gridFields(data, view), [data, view]);
  const selectedIds = selected.filter(id => rows.some(record => record.id === id));
  useEffect(() => {
    setSelected(ids => {
      const next = ids.filter(id => rows.some(row => row.id === id));
      return next.length === ids.length ? ids : next;
    });
  }, [rows]);
  const page = useMemo(() => collectionTablePage(rows, requestedPage, pageSize),
    [rows, requestedPage, pageSize]);
  // Stable controlled state: one sorting array per saved View configuration.
  const sorting = useMemo<SortingState>(() => viewSorts(view).map(s =>
    ({ id: s.fieldId, desc: s.direction === "desc" })), [view]);
  const columns = useMemo<ColumnDef<CollectionRecord>[]>(() => {
    const base = visibleFields.map(field => ({
    id: field.id, accessorFn: record => record.values[field.id] ?? "", header: () => field.name,
    sortingFn: field.type === "number" ? "basic" : "alphanumeric",
    cell: ctx => field.type === "select"
      ? <CollectionSelectChip label={`${field.name} for ${recordTitle(dataRef.current, ctx.row.original)}`}
        value={ctx.row.original.values[field.id] ?? ""} options={field.options ?? []} disabled={readOnly}
        onChange={value => patchRef.current(ctx.row.original, field, value)} />
      : field.type === "text" && field.wrapText
        ? <CollectionWrappedTextCell label={field.name} value={ctx.row.original.values[field.id] ?? ""}
            disabled={readOnly} onChange={value => patchRef.current(ctx.row.original, field, value)} />
        : <FieldEditor field={field} value={ctx.row.original.values[field.id] ?? ""}
        readOnly={readOnly} data={dataRef.current} sources={sourcesRef.current}
        recordId={ctx.row.original.id}
        compact onSet={value => patchRef.current(ctx.row.original, field, value)} />,
  })) as ColumnDef<CollectionRecord>[];
    return [base[0], ...gridTaskColumns(() => dataRef.current, onChange, readOnly), ...base.slice(1)].filter(Boolean);
  }, [visibleFields, readOnly, onChange]);
  const numericFieldIds = useMemo(() => new Set(data.fields.filter(field => field.type === "number").map(field => field.id)), [data.fields]);
  const table = useReactTable({
    // Bind TanStack only to the visible page, not thousands of input editors.
    data: page.rows, columns, getRowId: getRecordId,
    getCoreRowModel: getCoreRowModel(),
    // visibleRecords already applies all saved sorts. Do not sort twice or
    // auto-reset table state in response to a controlled input keystroke.
    manualSorting: true, autoResetAll: false,
    defaultColumn: { size: 160, minSize: 80, maxSize: 640 },
    columnResizeMode: "onEnd", enableColumnResizing: !readOnly,
    state: { sorting, columnSizing: view.columnWidths ?? {} }, enableMultiSort: true,
    onColumnSizingChange: updater => {
      if (readOnly) return;
      const current = view.columnWidths ?? {};
      const columnWidths = typeof updater === "function" ? updater(current) : updater;
      onChange({ ...data, views: data.views.map(item => item.id === view.id ? { ...item, columnWidths } : item) });
    },
    onSortingChange: update => {
      if (readOnly) return;
      const next = typeof update === "function" ? update(sorting) : update;
      const sorts = next.map(item => ({ fieldId: item.id, direction: item.desc ? "desc" as const : "asc" as const }));
      onChange({ ...data, views: data.views.map(v => v.id === view.id ? { ...v, sorts, sort: undefined } : v) });
    },
  });
  const adjustColumnSize = (fieldId: string, delta: number) => {
    const currentSize = table.getColumn(fieldId)?.getSize() ?? 160;
    table.setColumnSizing(previous => ({
      ...previous,
      [fieldId]: Math.max(80, Math.min(640, (previous[fieldId] ?? currentSize) + delta)),
    }));
  };
  const reorderColumn = ({ active, over }: DragEndEvent) => {
    if (readOnly || !over || active.id === over.id) return;
    const from = data.fields.findIndex(field => field.id === active.id);
    const to = data.fields.findIndex(field => field.id === over.id);
    if (from < 0 || to < 0) return;
    const fields = [...data.fields];
    fields.splice(to, 0, fields.splice(from, 1)[0]);
    onChange({ ...data, fields });
  };
  return <div className="min-w-0 space-y-2" data-testid="collection-paged-table">
    <CollectionGridToolbar data={data} view={view} visibleCount={rows.length} selectedIds={selectedIds} readOnly={readOnly}
      onChange={onChange} onClear={() => setSelected([])} />
    <CollectionGridMobileCards data={data} rows={page.rows} selected={selectedIds} readOnly={readOnly}
      onSelect={(id,checked)=>setSelected(current=>checked?[...new Set([...current,id])]:current.filter(value=>value!==id))}
      onOpen={setOpenRecordId} onChange={onChange}/>
    {!page.rows.length && <p role="status" className="hidden rounded-lg border border-dashed p-4 text-center text-sm text-[var(--planner-secondary)] sm:block">
      No matching tasks. Change filters or add a task.</p>}
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={reorderColumn}>
    <div ref={tableScroll} className="hidden max-w-full overflow-x-auto rounded-md border border-[var(--planner-border)] bg-[var(--planner-surface)] sm:block" role="region" aria-label="Scrollable Grid. Swipe to see all columns" tabIndex={0}>
    <table style={{ width: table.getTotalSize() + 188 }} className="table-fixed border-collapse text-left text-sm text-[var(--planner-text)]" data-testid="collection-tanstack-table">
    <colgroup>
      <col style={{ width: 76 }} />
      {table.getAllLeafColumns().map(column => <col key={column.id}
        style={{ width: column.getSize() }} />)}
      <col style={{ width: 40 }} /><col style={{ width: 108 }} />
    </colgroup>
    <thead>{table.getHeaderGroups().map(group => <tr key={group.id}>
      <th style={{width:76}} className="sticky top-0 z-30 border-b border-[var(--planner-border)] bg-[var(--planner-surface)] p-2">
        <input type="checkbox" aria-label="Select all visible tasks" disabled={readOnly || !page.rows.length}
          checked={!!page.rows.length && page.rows.every(item => selectedIds.includes(item.id))}
          onChange={e => setSelected(current => e.target.checked
            ? [...new Set([...current, ...page.rows.map(item => item.id)])]
            : current.filter(id => !page.rows.some(item => item.id === id)))} />
      </th>
      {group.headers.map(header => {
        const field = data.fields.find(item => item.id === header.column.id);
        return field ? <CollectionTableColumnHeader key={header.id} field={field} header={header} data={data}
          readOnly={readOnly} onChange={onChange} onOpenFieldSettings={onOpenFieldSettings}
          onRequestDelete={setPendingDeleteFieldId} onAdjustColumnSize={adjustColumnSize} /> :
          <th key={header.id} className="sticky top-0 z-20 border-b border-[var(--planner-border)] bg-[var(--planner-surface)] p-2 text-left font-semibold">
            {flexRender(header.column.columnDef.header, header.getContext())}</th>;
      })}
      <th style={{ width: 40 }} className="sticky top-0 border-b border-[var(--planner-border)] bg-[var(--planner-surface)] p-1">
        <button type="button" className="inline-flex h-7 w-7 items-center justify-center rounded text-[var(--planner-secondary)] hover:bg-[var(--planner-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-[var(--planner-hover)]"
          aria-label="Add column" title="Add column" disabled={readOnly}
          onClick={() => {
            let index = data.fields.length + 1;
            while (data.fields.some(field => field.name === `Property ${index}`)) index++;
            onChange(addField(data, `Property ${index}`, "text"));
          }}><Plus aria-hidden="true" className="h-4 w-4" /></button>
      </th>
      <th style={{ width: 108 }} className="border-b border-[var(--planner-border)]"> </th>
    </tr>)}</thead>
    <tbody>{table.getRowModel().rows.map(row => <tr key={row.original.id} data-record-id={row.original.id} className="h-10 hover:bg-[var(--planner-hover)]">
      <td className="border-b border-[var(--planner-border)] p-1">
        <div className="flex items-center gap-1">
        <button type="button" aria-label={(row.original.progress==="completed"?"Reopen ":"Complete ")+recordTitle(data,row.original)}
          disabled={readOnly} className="grid h-8 w-8 place-items-center rounded-full text-[var(--planner-accent)] hover:bg-[var(--planner-hover)]"
          onClick={()=>onChange(setTaskProgress(data,row.original.id,row.original.progress==="completed"?"not_started":"completed"))}>
          {row.original.progress==="completed"?<CheckCircle2 size={18}/>:<Circle size={18}/>}
        </button><input type="checkbox" disabled={readOnly} checked={selectedIds.includes(row.original.id)}
        aria-label={"Select task " + recordTitle(data, row.original)} onChange={e => setSelected(current => e.target.checked
          ? [...new Set([...current, row.original.id])] : current.filter(id => id !== row.original.id))} /></div></td>
      {row.getVisibleCells().map(cell => <td style={{ width: cell.column.getSize() }} className={`border-b border-[var(--planner-border)] p-1 ${numericFieldIds.has(cell.column.id) ? "text-right" : "text-left"}`} key={cell.id}>
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
      </td>)}
      <td aria-hidden="true" />
      <td><button className={btnClass} aria-label={"Open " + recordTitle(data, row.original)}
        onClick={() => setOpenRecordId(row.original.id)}>Open</button>
        <button aria-label={"Delete " + recordTitle(data, row.original)} className={btnClass}
        disabled={readOnly} onClick={() => onChange(deleteRecord(data, row.original.id))}>×</button></td>
    </tr>)}
    <CollectionGridAddRow data={data} colSpan={table.getAllLeafColumns().length + 3} readOnly={readOnly} onChange={onChange} />
    </tbody>
    {!!view.aggregations?.length && <tfoot><tr><td className="border-t" />{table.getAllLeafColumns().map(column => {
      const aggregate = view.aggregations?.find(item => item.fieldId === column.id);
      return <td key={column.id} className="border-t bg-[var(--planner-hover)] p-2 text-xs font-semibold dark:bg-[var(--planner-surface)]">
        {aggregate ? aggregate.operation + ": " + calculateCollectionAggregate(rows, aggregate) : ""}</td>;
    })}<td className="border-t" /><td className="border-t text-xs">Visible totals</td></tr></tfoot>}
    </table>
    </div>
    </DndContext>
    <div className="sm:hidden"><CollectionGridAddQuick data={data} readOnly={readOnly} onChange={onChange}/></div>
    <nav aria-label="Collection Table pagination" className="flex flex-wrap items-center gap-2 text-xs">
      <span role="status" aria-live="polite" data-testid="collection-page-summary">
        {page.total ? page.start + 1 : 0}–{page.end} of {page.total} matching records
      </span>
      <label>Rows per page <select aria-label="Rows per page" className="rounded border p-1"
        value={pageSize} onChange={event => { setPageSize(Number(event.target.value) as CollectionPageSize); setRequestedPage(0); }}>
        {COLLECTION_PAGE_SIZES.map(size => <option key={size} value={size}>{size}</option>)}
      </select></label>
      <button type="button" className={btnClass} aria-label="First collection page" disabled={page.pageIndex === 0}
        onClick={() => setRequestedPage(0)}>«</button>
      <button type="button" className={btnClass} aria-label="Previous collection page" disabled={page.pageIndex === 0}
        onClick={() => setRequestedPage(page.pageIndex - 1)}>‹</button>
      <span data-testid="collection-page-number">Page {page.pageIndex + 1} of {page.pageCount}</span>
      <button type="button" className={btnClass} aria-label="Next collection page"
        disabled={page.pageIndex >= page.pageCount - 1}
        onClick={() => setRequestedPage(page.pageIndex + 1)}>›</button>
      <button type="button" className={btnClass} aria-label="Last collection page"
        disabled={page.pageIndex >= page.pageCount - 1}
        onClick={() => setRequestedPage(page.pageCount - 1)}>»</button>
    </nav>
    {openRecordId && <CollectionRecordDetails data={data} sources={sources} recordId={openRecordId}
      readOnly={readOnly} onChange={onChange} onClose={() => setOpenRecordId(null)} />}
    {pendingDeleteFieldId && (() => {
      const field = data.fields.find(item => item.id === pendingDeleteFieldId);
      if (!field) return null;
      return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--planner-surface)]/40 p-4" onMouseDown={event => { if (event.target === event.currentTarget) setPendingDeleteFieldId(null); }}>
        <section role="alertdialog" aria-modal="true" aria-labelledby="delete-property-title" aria-describedby="delete-property-description"
          onKeyDown={event => { if (event.key === "Escape") setPendingDeleteFieldId(null); }}
          className="w-full max-w-sm rounded-xl bg-[var(--planner-surface)] p-5 shadow-xl dark:bg-[var(--planner-surface)]">
          <h2 id="delete-property-title" className="text-base font-semibold text-[var(--planner-text)] dark:text-[var(--planner-secondary)]">Delete “{field.name}”?</h2>
          <p id="delete-property-description" className="mt-2 text-sm text-[var(--planner-secondary)] dark:text-[var(--planner-secondary)]">This removes the column and its values from every record, view, and automation that uses it.</p>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" autoFocus className={btnClass} onClick={() => setPendingDeleteFieldId(null)}>Cancel</button>
            <button type="button" className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500" onClick={() => {
              onChange(removeField(data, field.id));
              setPendingDeleteFieldId(null);
            }}>Delete property</button>
          </div>
        </section>
      </div>;
    })()}
  </div>;
}
