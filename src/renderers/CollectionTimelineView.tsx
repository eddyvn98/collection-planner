"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { CollectionBlockPayload, CollectionField, CollectionRecord } from "../collections/model";
import { recordTitle, setRecordValue } from "../collections/model";
import { FieldEditor, btnClass, hintClass } from "./CollectionFieldEditor";
import { addUtcDays, timelineLayout } from "./collectionTimelineDates";
import { isoDay, parseCalendarDay } from "./collectionCalendarDates";
import { CollectionGanttBar } from "./CollectionGanttBar";
import { CollectionBlockedBadge } from "./CollectionBlockedBadge";
import { collectionTablePage } from "./collectionTablePaging";
import { availableCollectionDependencies, longestCollectionDependencyChain, scheduleCollectionDependencies, setCollectionDependencies } from "../collections/collectionDependencies";

interface Props { rows: CollectionRecord[]; data: CollectionBlockPayload; start?: CollectionField;
  end?: CollectionField; readOnly: boolean; onChange: (next: CollectionBlockPayload) => void;
  patch: (r: CollectionRecord, f: CollectionField, v: string) => void; }
const DAY_MS = 86_400_000;
const dayIndex = (day: string) => Math.floor(parseCalendarDay(day)!.getTime() / DAY_MS);
export function TimelineView({ rows, data, start, end, readOnly, onChange, patch }: Props) {
  const [scale, setScale] = useState<"day" | "week">("day");
  const [requestedPage, setRequestedPage] = useState(0);
  const [windowOffset, setWindowOffset] = useState(0);
  const [highlightChain, setHighlightChain] = useState(false);
  const timelineScroll = useRef<HTMLDivElement>(null);
  useEffect(() => { timelineScroll.current?.scrollTo({ left: 0, behavior: "smooth" }); }, [windowOffset, scale]);
  const longest = useMemo(() => longestCollectionDependencyChain(data, start?.id, end?.id),
    [data, start?.id, end?.id]);
  const highlightedIds = new Set(highlightChain ? longest.ids : []);
  const view = useMemo(() => timelineLayout(rows, start?.id, end?.id), [rows, start?.id, end?.id]);
  const page = useMemo(() => collectionTablePage(view.entries, requestedPage, 100),
    [view.entries, requestedPage]);
  const cellSize = scale === "day" ? 26 : 6;
  const span = view.days * cellSize;
  const windowStart = addUtcDays(view.from, windowOffset) ?? view.from;
  const windowEnd = addUtcDays(windowStart, view.days - 1) ?? view.to;
  const today = isoDay(new Date());
  const todayOffset = dayIndex(today) - dayIndex(windowStart);
  const visibleTicks = Array.from({ length: view.days }, (_, index) => addUtcDays(windowStart, index)!);
  const outOfWindow = view.entries.filter(item => item.startOffset + item.length <= windowOffset || item.startOffset >= windowOffset + view.days).length;
  const changeDates = (record: CollectionRecord, amount: number) => {
    if (!start || readOnly) return;
    const previousStart = record.values[start.id] ?? "";
    const nextStart = addUtcDays(previousStart, amount);
    if (!nextStart) return;
    let updated = setRecordValue(data, record.id, start.id, nextStart);
    if (end && end.id !== start.id && parseCalendarDay(record.values[end.id] ?? "")) {
      const nextEnd = addUtcDays(record.values[end.id], amount);
      if (nextEnd) updated = setRecordValue(updated, record.id, end.id, nextEnd);
    }
    // Commit one consistent start/end change, never two stale patches.
    onChange(updated);
  };
  const resize = (record: CollectionRecord, amount: number) => {
    if (readOnly || !start || !end || start.id === end.id) return;
    const initial = record.values[end.id] || record.values[start.id];
    const shifted = addUtcDays(initial, amount);
    if (shifted && shifted >= record.values[start.id]) patch(record, end, shifted);
  };
  return <div className="space-y-3 text-xs" data-testid="collection-timeline">
    {!start && <p className="text-amber-600">Add a date field for Timeline.</p>}
    <div className="flex flex-wrap items-center gap-2">
      <strong className="tabular-nums">{windowStart} – {windowEnd}</strong>
      <button className={btnClass} type="button" onClick={() => setWindowOffset(dayIndex(today) - dayIndex(view.from) - Math.floor(view.days / 2))}>Today</button>
      <button className={btnClass} type="button" aria-label="Show previous 30 days" onClick={() => setWindowOffset(offset => offset - 30)}>← 30d</button>
      <button className={btnClass} type="button" aria-label="Show next 30 days" onClick={() => setWindowOffset(offset => offset + 30)}>30d →</button>
      <span className={hintClass}>Drag bars to move them; drag the right edge to change duration.</span>
      <button className={btnClass} type="button" disabled={readOnly || !start}
        onClick={() => onChange(scheduleCollectionDependencies(data, start?.id, end?.id))}>
        Schedule dependencies
      </button>
      <label className="flex items-center gap-1">
        <input type="checkbox" checked={highlightChain}
          onChange={event => setHighlightChain(event.target.checked)} />
        Longest dependency chain ({longest.days} task-days)
      </label>
      <label>Ruler <select className="rounded border p-1" aria-label="Timeline ruler"
        value={scale} onChange={event => setScale(event.target.value as "day" | "week")}>
        <option value="day">Days</option><option value="week">Weeks</option>
      </select></label>
      {view.undated > 0 && <span className={hintClass}>{view.undated} undated records (edit in Table)</span>}
      {outOfWindow > 0 && <span className={hintClass}>{outOfWindow} records outside this date range</span>}
    </div>
    <nav aria-label="Collection Timeline pagination" className="flex flex-wrap items-center gap-2">
      <span data-testid="collection-timeline-page-summary">
        {page.total ? page.start + 1 : 0}–{page.end} of {page.total} scheduled records
      </span>
      <button type="button" className={btnClass} aria-label="Previous timeline page"
        disabled={page.pageIndex === 0} onClick={() => setRequestedPage(page.pageIndex - 1)}>Previous</button>
      <span data-testid="collection-timeline-page-number">Page {page.pageIndex + 1} of {page.pageCount}</span>
      <button type="button" className={btnClass} aria-label="Next timeline page"
        disabled={page.pageIndex >= page.pageCount - 1}
        onClick={() => setRequestedPage(page.pageIndex + 1)}>Next</button>
    </nav>
    {page.total === 0 ? <div role="status" className="rounded-xl border border-dashed border-[var(--planner-border)] bg-[var(--planner-surface)] px-4 py-6 text-center dark:border-[var(--planner-border)] dark:bg-[var(--planner-surface)]">
      <p className="text-sm font-medium text-[var(--planner-text)] dark:text-[var(--planner-secondary)]">Nothing scheduled in this timeline</p>
      <p className="mt-1 text-xs text-[var(--planner-secondary)] dark:text-[var(--planner-secondary)]">Set a Start date in Table view to plot a record. Use End dates to give tasks a duration.</p>
    </div> : <div ref={timelineScroll} className="max-w-full overflow-x-auto rounded-lg border border-[var(--planner-border)] bg-[var(--planner-surface)] dark:border-[var(--planner-border)] dark:bg-[var(--planner-surface)]" data-testid="collection-timeline-scroll">
      <div style={{ minWidth: 220 + span }}>
        <div className="flex border-b bg-[var(--planner-hover)] dark:bg-[var(--planner-surface)]">
          <span className="sticky left-0 z-20 w-[220px] shrink-0 border-r bg-[var(--planner-hover)] p-2 font-semibold dark:bg-[var(--planner-surface)]">Record</span>
          <div className="relative h-10" style={{ width: span }}>
            {visibleTicks.map((day, index) => {
              const monday = new Date(day + "T12:00:00Z").getUTCDay() === 1;
              const shown = scale === "day" ? index % 3 === 0 : monday;
              const showGrid = scale === "day" || monday;
              return <div key={day} className={`absolute top-0 h-full ${showGrid ? "border-l border-[var(--planner-border)] dark:border-[var(--planner-border)]" : ""}`}
                data-testid="collection-timeline-tick" data-date={day}
                style={{ left: index * cellSize, width: cellSize }}>
                {shown && <span className="block whitespace-nowrap text-[10px] tabular-nums" aria-label={"Ruler date " + day}>{day.slice(5).replace("-", "/")}</span>}
              </div>;
            })}
            {todayOffset >= 0 && todayOffset < view.days && <div aria-label="Today" title="Today"
              className="absolute top-0 z-10 h-full border-l-2 border-rose-500" style={{ left: todayOffset * cellSize }} />}
          </div>
        </div>
        {page.rows.map(({ record, startOffset, length }) =>
          <div className="flex min-h-12 items-center border-b" key={record.id}
            data-testid="collection-timeline-row" data-record-id={record.id}>
            <div className="sticky left-0 z-10 flex min-h-12 w-[220px] shrink-0 items-center border-r bg-[var(--planner-surface)] px-2 py-1 leading-4 dark:bg-[var(--planner-surface)]" title={recordTitle(data, record)}>
              <span className="min-w-0 flex-1 truncate">{recordTitle(data, record)}</span>
              <CollectionBlockedBadge data={data} record={record} compact/>
            </div>
            <div className="relative h-11" style={{ width: span }}>
              {Math.max(startOffset, windowOffset) < Math.min(startOffset + length, windowOffset + view.days) && <CollectionGanttBar
                left={(Math.max(startOffset, windowOffset) - windowOffset) * cellSize}
                width={(Math.min(startOffset + length, windowOffset + view.days) - Math.max(startOffset, windowOffset)) * cellSize}
                pixelsPerDay={cellSize} label={recordTitle(data, record)} durationDays={length} disabled={readOnly}
                highlighted={highlightedIds.has(record.id)}
                onMove={days => changeDates(record, days)}
                onResize={days => resize(record, days)} />}
            </div>
          </div>)}
      </div>
    </div>}
    <div className="space-y-2">
      {page.rows.map(({ record }) => <details key={record.id}
        className="group rounded-lg border border-[var(--planner-border)] bg-[var(--planner-surface)] dark:border-[var(--planner-border)] dark:bg-[var(--planner-surface)]" data-testid="collection-timeline-edit">
        <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 px-3 py-2 text-xs hover:bg-[var(--planner-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-[var(--planner-surface)]">
          <strong className="min-w-0 flex-1 truncate">{recordTitle(data, record)}</strong>
          <span className="tabular-nums text-[var(--planner-secondary)]">{record.values[start?.id ?? ""] || "No start"}{end && end.id !== start?.id && record.values[end.id] ? ` → ${record.values[end.id]}` : ""}</span>
          <span className="text-[var(--planner-secondary)] group-open:hidden">Edit schedule</span>
          <span className="hidden text-[var(--planner-secondary)] group-open:inline">Close</span>
        </summary>
        <div className="flex flex-wrap items-center gap-2 border-t border-[var(--planner-border)] px-3 py-2 dark:border-[var(--planner-border)]">
        {start && <FieldEditor field={start} value={record.values[start.id] ?? ""}
          readOnly={readOnly} onSet={value => patch(record, start, value)} />}
        {end && end.id !== start?.id && <FieldEditor field={end} value={record.values[end.id] ?? ""}
          readOnly={readOnly} onSet={value => patch(record, end, value)} />}
        <label>Depends on
          <select className="ml-1 max-w-44 rounded border bg-transparent p-1"
            aria-label={"Add dependency for " + recordTitle(data, record)}
            value="" disabled={readOnly || (record.dependsOn ?? []).length >= 20}
            onChange={event => {
              const dependency = event.target.value;
              if (!dependency) return;
              const next = setCollectionDependencies(data, record.id,
                [...(record.dependsOn ?? []), dependency]);
              if (next === data) window.alert("That dependency would create a cycle or is invalid.");
              else onChange(next);
            }}>
            <option value="">+ Predecessor</option>
            {availableCollectionDependencies(data,record)
              .map(item => <option key={item.id} value={item.id}>{recordTitle(data, item)}</option>)}
          </select>
        </label>
        {(record.dependsOn ?? []).map(id => <button key={id} type="button" className={btnClass}
          disabled={readOnly} title="Remove dependency"
          aria-label={"Remove dependency " + (data.records.find(item => item.id === id)
            ? recordTitle(data, data.records.find(item => item.id === id)!) : id)}
          onClick={() => onChange(setCollectionDependencies(data, record.id,
            (record.dependsOn ?? []).filter(item => item !== id)))}>
          {data.records.find(item => item.id === id)
            ? recordTitle(data, data.records.find(item => item.id === id)!) : "Missing task"} ×
        </button>)}
        <button className={btnClass} disabled={readOnly || !start}
          aria-label={"Move " + recordTitle(data, record) + " backward one day"}
          onClick={() => changeDates(record, -1)}>← 1d</button>
        <button className={btnClass} disabled={readOnly || !start}
          aria-label={"Move " + recordTitle(data, record) + " forward one day"}
          onClick={() => changeDates(record, 1)}>1d →</button>
        <button className={btnClass} disabled={readOnly || !end || end.id === start?.id}
          aria-label={"Extend " + recordTitle(data, record) + " by one day"}
          onClick={() => resize(record, 1)}>+ Duration</button>
        <button className={btnClass} disabled={readOnly || !end || end.id === start?.id}
          aria-label={"Shorten " + recordTitle(data, record) + " by one day"}
          onClick={() => resize(record, -1)}>− Duration</button>
        </div>
      </details>)}
    </div>
  </div>;
}
