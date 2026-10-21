"use client";
import React, { useState } from "react";
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, TouchSensor,
  useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, PanelRightOpen } from "lucide-react";
import { dropCollectionCard } from "./collectionKanbanDrop";
import { addRecord, recordTitle,
  type CollectionBlockPayload, type CollectionField, type CollectionRecord } from "../collections/model";
import { btnClass } from "./CollectionFieldEditor";
import { CollectionRecordDetails } from "./CollectionRecordDetails";
import { CollectionSelectChip } from "./CollectionSelectChip";
import { CollectionChecklist } from "./CollectionChecklist";

interface Props { data: CollectionBlockPayload; rows: CollectionRecord[]; group?: CollectionField;
  groupOptions: string[]; readOnly: boolean;
  onChange: (next: CollectionBlockPayload) => void;
  patch: (record: CollectionRecord, field: CollectionField, value: string) => void; }
const columnId = (status: string) => "collection-column:" + status;

function Card({ data, record, group, groupOptions, readOnly, patch, onChange, onOpen }: {
  data: CollectionBlockPayload; record: CollectionRecord;
  group?: CollectionField; groupOptions: string[]; readOnly: boolean;
  patch: Props["patch"]; onOpen: (id: string) => void;
  onChange: Props["onChange"];
}) {
  const drag = useDraggable({ id: record.id, disabled: readOnly || !group });
  const status = record.values[group?.id ?? ""] ?? "";
  const summaryField = data.fields.find(field => field.type === "text" &&
    /^(summary|description)$/i.test(field.name.trim()));
  const preview = (summaryField ? record.values[summaryField.id] : "") || record.body || "";
  return <div ref={drag.setNodeRef} className="mb-2 rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
    data-testid="collection-kanban-card" data-record-id={record.id}
    style={{ transform: CSS.Translate.toString(drag.transform), opacity: drag.isDragging ? 0.55 : 1 }}>
    <div className="flex min-w-0 items-start gap-0.5">
      <button type="button" aria-label={"Drag " + recordTitle(data, record)} title="Drag card"
        className="inline-flex h-5 w-4 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-slate-700"
        disabled={readOnly || !group} {...drag.attributes} {...drag.listeners}><GripVertical aria-hidden="true" className="h-3.5 w-3.5" /></button>
      <strong className="min-w-0 flex-1 whitespace-normal break-words text-sm font-semibold leading-5 text-slate-800 dark:text-slate-100"
        title={recordTitle(data, record)}>{recordTitle(data, record)}</strong>
      <button type="button" className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-slate-700 dark:hover:text-white"
        aria-label={"Open details for " + recordTitle(data, record)} title="Open details" onClick={() => onOpen(record.id)}>
        <PanelRightOpen aria-hidden="true" className="h-3.5 w-3.5" />
      </button>
    </div>
    {preview.trim() && <p className="mt-2 whitespace-normal break-words text-xs leading-4 text-slate-500 dark:text-slate-400"
      style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{preview}</p>}
    {group && <div className="mt-2"><CollectionSelectChip label={`${group.name} for ${recordTitle(data, record)}`}
      value={status} options={groupOptions} disabled={readOnly}
      onChange={value => patch(record, group, value)} /></div>}
    <CollectionChecklist compact items={record.checklist} readOnly={readOnly}
      onChange={checklist => onChange({ ...data, records: data.records.map(row =>
        row.id === record.id ? { ...row, checklist } : row) })} />
  </div>;
}

function Column({ status, rows, data, group, groupOptions, readOnly, onChange, patch, onOpen }:
  Props & { status: string; onOpen: (id: string) => void }) {
  const drop = useDroppable({ id: columnId(status), disabled: readOnly || !group });
  const cards = rows.filter(record => (record.values[group?.id ?? ""] ?? "") === status);
  return <div ref={drop.setNodeRef} data-testid="collection-kanban-column" data-status={status}
    className={"min-w-52 flex-1 rounded-lg bg-slate-100 p-2 dark:bg-slate-900 " +
      (drop.isOver ? "ring-2 ring-blue-500" : "")}>
    <div className="mb-2 flex items-center justify-between gap-2 px-1">
      <span className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">{status || "Unassigned"}</span>
      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[11px] font-medium tabular-nums text-slate-500 dark:bg-slate-800 dark:text-slate-300">{cards.length}</span>
    </div>
    {cards.map(record => <Card key={record.id} data={data} record={record}
      group={group} groupOptions={groupOptions}
      readOnly={readOnly} patch={patch} onChange={onChange} onOpen={onOpen} />)}
    <button className={btnClass} disabled={readOnly}
      onClick={() => onChange(addRecord(data, group ? { [group.id]: status } : {}))}>+ Card</button>
  </div>;
}

export function CollectionKanbanView(props: Props) {
  const { data, rows, group, groupOptions, readOnly, onChange } = props;
  const [openRecordId, setOpenRecordId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  );
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (readOnly || !group || !over) return;
    const target = groupOptions.concat("").find(status => columnId(status) === over.id);
    const record = data.records.find(item => item.id === active.id);
    if (target === undefined || !record) return;
    const next = dropCollectionCard(data, record.id, group.id, target, readOnly);
    if (next !== data) onChange(next);
  };
  return <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
    <div className="flex h-full min-w-0 flex-col">
      <p className="mb-2 text-xs text-slate-500 sm:hidden">Swipe horizontally to see the other columns.</p>
      <div className="flex min-h-0 w-full min-w-0 flex-1 gap-3" data-testid="collection-kanban">
        {["", ...groupOptions].map(status => <Column key={status} {...props} status={status}
          onOpen={setOpenRecordId} />)}
        {openRecordId && <CollectionRecordDetails data={data} recordId={openRecordId}
          readOnly={readOnly} onChange={onChange} onClose={() => setOpenRecordId(null)} />}
      </div>
    </div>
  </DndContext>;
}
