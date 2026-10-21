"use client";
import { useState } from "react";
import { DndContext, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { addBucket, bucketOptions, moveBoardCard } from "./collectionBoardActions";
import { CollectionBoardBucket } from "./CollectionBoardBucket";
import { CollectionRecordDetails } from "./CollectionRecordDetails";
import type { CollectionBlockPayload, CollectionField, CollectionRecord } from "../collections/model";
interface Props {
  data: CollectionBlockPayload; rows: CollectionRecord[]; group?: CollectionField;
  groupOptions: string[]; readOnly: boolean;
  onChange: (next: CollectionBlockPayload) => void;
  patch: (record: CollectionRecord, field: CollectionField, value: string) => void;
}
export function CollectionKanbanView({ data, rows, group, readOnly, onChange }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [newBucket, setNewBucket] = useState("");
  const [creating, setCreating] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }));
  const options = group ? bucketOptions(data, group.id) : [];
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!group || readOnly || !over || !String(active.id).startsWith("task:")) return;
    const id = String(active.id).slice(5);
    const destination = String(over.id);
    const target = destination.startsWith("bucket:") ? destination.slice(7) :
      destination.startsWith("task:") ? data.records.find(r => r.id === destination.slice(5))?.values[group.id] : undefined;
    if (target === undefined) return;
    const next = moveBoardCard(data, id, group.id, target,
      destination.startsWith("task:") ? destination.slice(5) : undefined, readOnly);
    if (next !== data) onChange(next);
  };
  return <div className="flex min-h-0 flex-1 flex-col">
    <p className="mb-2 text-xs text-slate-500 sm:hidden">Swipe horizontally to see more buckets.</p>
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="flex min-h-0 flex-1 items-start gap-3 overflow-x-auto pb-3" data-testid="collection-kanban">
        {["", ...options].map(bucket => <CollectionBoardBucket key={bucket} data={data} rows={rows}
          fieldId={group?.id} bucket={bucket} readOnly={readOnly} onChange={onChange} onOpen={setOpenId} />)}
        {!!group && !readOnly && (creating ? <form className="w-64 shrink-0 space-y-2 rounded-xl bg-slate-100 p-3"
          onSubmit={e => { e.preventDefault(); const next = addBucket(data, group.id, newBucket); if (next !== data) onChange(next); setNewBucket(""); setCreating(false); }}>
          <input autoFocus aria-label="New bucket" value={newBucket} onChange={e => setNewBucket(e.target.value)}
            className="w-full rounded border p-2 text-sm" placeholder="Bucket name" maxLength={80} />
          <button type="submit" className="rounded bg-blue-600 px-3 py-1 text-sm text-white" disabled={!newBucket.trim()}>Add</button>
          <button type="button" className="ml-2 text-sm" onClick={() => setCreating(false)}>Cancel</button>
        </form> : <button className="w-56 shrink-0 rounded-xl border border-dashed p-3 text-left text-sm text-blue-600"
          onClick={() => setCreating(true)}>+ Add new bucket</button>)}
      </div>
    </DndContext>
    {openId && <CollectionRecordDetails data={data} recordId={openId} readOnly={readOnly}
      onChange={onChange} onClose={() => setOpenId(null)} />}
  </div>;
}
