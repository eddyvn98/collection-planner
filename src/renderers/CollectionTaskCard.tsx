import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays, CheckSquare, GripVertical, Paperclip, StickyNote } from "lucide-react";
import { recordTitle, type CollectionBlockPayload, type CollectionRecord } from "../collections/model";
import { localToday, taskDate } from "../collections/collectionTasks";
export function CollectionTaskCard({ data, record, readOnly, onOpen }: {
  data: CollectionBlockPayload; record: CollectionRecord; readOnly: boolean; onOpen: () => void;
}) {
  const drag = useDraggable({ id: "task:" + record.id, disabled: readOnly });
  const drop = useDroppable({ id: "task:" + record.id, disabled: readOnly });
  const due = taskDate(data, record, "due");
  const late = due && due < localToday() && record.progress !== "completed";
  const done = record.checklist?.filter(item => item.done).length ?? 0;
  const people = (data.people ?? []).filter(p => record.assigneeIds?.includes(p.id));
  const labels = (data.labels ?? []).filter(l => record.labelIds?.includes(l.id));
  return <article ref={node => { drag.setNodeRef(node); drop.setNodeRef(node); }}
    data-testid="collection-kanban-card" data-record-id={record.id}
    className={"mb-2 rounded-xl border bg-white p-3 shadow-sm transition-shadow hover:shadow-md dark:bg-slate-800 " +
      (drop.isOver ? "border-blue-500 ring-2 ring-blue-300" : "border-slate-200 dark:border-slate-700")}
    style={{ transform: CSS.Translate.toString(drag.transform), opacity: drag.isDragging ? .55 : 1 }}>
    <div className="flex items-start gap-2">
      <button type="button" aria-label={"Drag " + recordTitle(data, record)} title="Drag task"
        className="rounded p-1 text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500" disabled={readOnly}
        {...drag.attributes} {...drag.listeners}><GripVertical className="h-4 w-4" /></button>
      <button type="button" className="min-w-0 flex-1 text-left text-sm font-semibold text-slate-800 hover:text-blue-600 dark:text-slate-100"
        onClick={onOpen}>{recordTitle(data, record)}</button>
    </div>
    {labels.length > 0 && <div className="mt-2 flex flex-wrap gap-1">
      {labels.map(label => <span key={label.id} className="rounded px-2 py-0.5 text-[11px] text-white"
        style={{ backgroundColor: /^#[0-9a-fA-F]{6}$/.test(label.color) ? label.color : "#64748b" }}>{label.name}</span>)}
    </div>}
    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-300">
      <span className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-700">
        {record.progress === "completed" ? "✓ Completed" : record.progress === "in_progress" ? "◐ In progress" : "○ Not started"}
      </span>
      {record.priority && record.priority !== "medium" && <span className="capitalize">{record.priority}</span>}
      {due && <span className={"inline-flex items-center gap-1 " + (late ? "font-semibold text-red-600" : "")}>
        <CalendarDays className="h-3 w-3" />{due}</span>}
      {!!record.checklist?.length && <span className="inline-flex items-center gap-1"><CheckSquare className="h-3 w-3" />{done}/{record.checklist.length}</span>}
      {!!record.attachments?.length && <span title="Attachments"><Paperclip className="h-3.5 w-3.5" /></span>}
      {!!record.body?.trim() && <span title="Notes"><StickyNote className="h-3.5 w-3.5" /></span>}
      {people.length > 0 && <div className="ml-auto flex -space-x-1">
        {people.map(person => <span key={person.id} title={person.name} aria-label={person.name}
          className="grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-blue-100 text-[10px] font-semibold text-blue-900 dark:border-slate-800">
          {person.name.slice(0, 2).toUpperCase()}</span>)}
      </div>}
    </div>
  </article>;
}
