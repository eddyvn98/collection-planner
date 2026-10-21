import { useState } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus } from "lucide-react";
import { recordTitle, type CollectionBlockPayload, type CollectionRecord, type CollectionView } from "../collections/model";
import { scheduledTaskOverdue } from "../collections/collectionSchedule";

function ScheduleTask({ data, view, record, today, readOnly, onOpen }: {
  data: CollectionBlockPayload; view: CollectionView; record: CollectionRecord;
  today: string; readOnly: boolean; onOpen: (id: string) => void;
}) {
  const drag = useDraggable({ id: "schedule-task:" + record.id, disabled: readOnly });
  const late = scheduledTaskOverdue(data, view, record, today);
  return <article ref={drag.setNodeRef} data-testid="schedule-task" data-record-id={record.id}
    style={{ transform: CSS.Translate.toString(drag.transform), opacity: drag.isDragging ? 0.55 : 1 }}
    className={"mb-1 flex min-w-0 items-center gap-1 rounded-md border p-1.5 shadow-sm " +
      (late ? "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
        : "border-[var(--planner-border)] bg-[var(--planner-surface)] text-[var(--planner-text)]")}>
    <button type="button" {...drag.attributes} {...drag.listeners} disabled={readOnly}
      aria-label={"Drag " + recordTitle(data, record)}
      className="shrink-0 cursor-grab touch-none rounded p-1.5 focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)] active:cursor-grabbing">
      <GripVertical size={12} /></button>
    <button type="button" onClick={() => onOpen(record.id)} className="min-w-0 flex-1 truncate text-left font-medium"
      title={recordTitle(data, record)}>{recordTitle(data, record)}</button>
    {late && <span className="shrink-0 text-[10px] font-bold">Late</span>}
  </article>;
}
export function CollectionScheduleDay({ data, view, day, rows, today, outside, readOnly, onCreate, onOpen }: {
  data: CollectionBlockPayload; view: CollectionView; day: string; rows: CollectionRecord[];
  today: string; outside: boolean; readOnly: boolean;
  onCreate: (day: string, title: string) => void; onOpen: (id: string) => void;
}) {
  const drop = useDroppable({ id: "schedule-day:" + day, disabled: readOnly });
  const [adding, setAdding] = useState(false), [title, setTitle] = useState("");
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? rows : rows.slice(0, 4);
  const create = () => { if (!title.trim() || readOnly) return;
    onCreate(day, title); setTitle(""); setAdding(false); };
  return <section ref={drop.setNodeRef} data-testid="collection-calendar-day" data-date={day}
    aria-label={"Date " + day}
    onClick={event => { if (!readOnly && event.target === event.currentTarget) setAdding(true); }}
    className={"min-h-28 min-w-0 rounded-lg border p-1.5 text-xs transition-colors " +
      (drop.isOver ? "border-[var(--planner-accent)] bg-[var(--planner-hover)] ring-2 ring-[var(--planner-accent)] "
        : "border-[var(--planner-border)] bg-[var(--planner-surface)] text-[var(--planner-text)] ") +
      (outside ? "opacity-60" : "")}>
    <div className="mb-1 flex items-center justify-between">
      <button type="button" disabled={readOnly} aria-label={"Create task on " + day}
        onClick={() => setAdding(true)} title={"Create task on " + day}
        className={"flex h-7 min-w-7 items-center justify-center rounded-full font-semibold focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)] " +
          (day === today ? "bg-[var(--planner-accent)] text-white" : "text-[var(--planner-secondary)] hover:bg-[var(--planner-hover)]")}>
        {day.slice(8)}</button>
      {!readOnly && <button type="button" aria-label={"Add task on " + day}
        className="rounded p-1 text-[var(--planner-accent)] hover:bg-blue-50" onClick={() => setAdding(true)}>
        <Plus size={14}/></button>}
    </div>
    {adding && !readOnly && <form className="mb-2 space-y-1" onSubmit={event => { event.preventDefault(); create(); }}>
      <input autoFocus aria-label={"Task title for " + day} className="w-full rounded border border-[var(--planner-border)] bg-[var(--planner-surface)] p-1.5 text-xs text-[var(--planner-text)]"
        maxLength={300} placeholder="Task name" value={title} onChange={event => setTitle(event.target.value)}
        onKeyDown={event => { if (event.key === "Escape") setAdding(false); }} />
      <div className="flex gap-2"><button type="submit" disabled={!title.trim()} className="text-[var(--planner-accent)] disabled:opacity-40">Add</button>
        <button type="button" onClick={() => { setAdding(false); setTitle(""); }}>Cancel</button></div>
    </form>}
    {shown.map(record => <ScheduleTask key={record.id} data={data} view={view} record={record}
      today={today} readOnly={readOnly} onOpen={onOpen} />)}
    {rows.length > 4 && <button type="button" aria-label={(expanded ? "Show less on " : "Show more on ") + day}
      className="rounded p-1 text-[var(--planner-accent)] underline" onClick={() => setExpanded(!expanded)}>
      {expanded ? "Show less" : "+" + (rows.length - 4) + " more"}</button>}
  </section>;
}
