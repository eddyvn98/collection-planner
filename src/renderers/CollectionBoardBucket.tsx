import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Plus, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { createBoardTask } from "../collections/collectionTasks";
import { deleteBucket, moveBucket, renameBucket, orderedCards } from "./collectionBoardActions";
import { CollectionTaskCard } from "./CollectionTaskCard";
import type { CollectionBlockPayload, CollectionRecord } from "../collections/model";
export function CollectionBoardBucket({ data, rows, fieldId, bucket, readOnly, onChange, onOpen }: {
  data: CollectionBlockPayload; rows: CollectionRecord[]; fieldId?: string; bucket: string;
  readOnly: boolean; onChange: (next: CollectionBlockPayload) => void; onOpen: (id: string) => void;
}) {
  const drop = useDroppable({ id: "bucket:" + bucket, disabled: readOnly });
  const [title, setTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(bucket);
  const cards = orderedCards(data, rows.filter(r => (r.values[fieldId ?? ""] ?? "") === bucket));
  const save = () => {
    if (!title.trim()) return;
    onChange(createBoardTask(data, title, fieldId, bucket));
    setTitle(""); setAdding(false);
  };
  return <section ref={drop.setNodeRef} data-testid="collection-kanban-column" data-status={bucket}
    className={"w-72 shrink-0 self-start rounded-xl bg-slate-100 p-2 dark:bg-slate-900 " +
      (drop.isOver ? "ring-2 ring-blue-500" : "")}>
    <header className="mb-2 flex items-center gap-1 px-1">
      {renaming ? <input autoFocus aria-label="Bucket name" className="min-w-0 flex-1 rounded border p-1 text-sm"
        value={name} onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === "Escape") setRenaming(false); if (e.key === "Enter") e.currentTarget.blur(); }}
        onBlur={() => { if (fieldId) onChange(renameBucket(data, fieldId, bucket, name)); setRenaming(false); }} />
        : <button type="button" disabled={readOnly || !fieldId || !bucket} onClick={() => { setName(bucket); setRenaming(true); }}
          className="min-w-0 flex-1 truncate text-left text-sm font-semibold">{bucket || "Unassigned"}</button>}
      <span className="rounded-full bg-white px-2 py-0.5 text-xs dark:bg-slate-700">{cards.length}</span>
      {!readOnly && !!fieldId && !!bucket && <div className="flex">
        <button title="Move bucket left" aria-label={"Move " + bucket + " left"} onClick={() => onChange(moveBucket(data, fieldId, bucket, -1))}><ChevronLeft className="h-4 w-4" /></button>
        <button title="Move bucket right" aria-label={"Move " + bucket + " right"} onClick={() => onChange(moveBucket(data, fieldId, bucket, 1))}><ChevronRight className="h-4 w-4" /></button>
        <button title="Delete bucket" aria-label={"Delete " + bucket} onClick={() => { if (window.confirm("Move tasks to Unassigned and delete this bucket?")) onChange(deleteBucket(data, fieldId, bucket)); }}><Trash2 className="h-4 w-4" /></button>
      </div>}
    </header>
    {!readOnly && (adding ? <form className="mb-3 space-y-1" onSubmit={e => { e.preventDefault(); save(); }}>
      <input autoFocus aria-label={"New task in " + (bucket || "Unassigned")} className="w-full rounded-lg border p-2 text-sm text-slate-900"
        placeholder="Task name" value={title} onChange={e => setTitle(e.target.value)} maxLength={300}
        onKeyDown={e => { if (e.key === "Escape") setAdding(false); }} />
      <div className="flex gap-2"><button type="submit" className="rounded bg-blue-600 px-3 py-1 text-xs text-white">Add task</button>
        <button type="button" className="text-xs" onClick={() => setAdding(false)}>Cancel</button></div>
    </form> : <button type="button" onClick={() => setAdding(true)}
      className="mb-3 flex w-full items-center gap-1 rounded-lg bg-white p-2 text-left text-sm text-blue-700 dark:bg-slate-800 dark:text-blue-300"><Plus className="h-4 w-4" /> Add task</button>)}
    <div aria-label={(bucket || "Unassigned") + " tasks"} className="min-h-10">
      {cards.map(record => <CollectionTaskCard key={record.id} data={data} record={record}
        readOnly={readOnly} onOpen={() => onOpen(record.id)} />)}
      {!cards.length && <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-slate-400">Drop a task here</p>}
    </div>
  </section>;
}
