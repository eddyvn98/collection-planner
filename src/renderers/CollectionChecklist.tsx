"use client";
import React, { useEffect, useRef, useState } from "react";
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useDraggable, useDroppable,
  useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { checklistReorder, checklistToggle, checklistTotals } from "../collections/collectionChecklistActions";
import { newId, type CollectionRecord } from "../collections/model";

type Item = NonNullable<CollectionRecord["checklist"]>[number];
interface Props { items?: Item[]; readOnly: boolean; compact?: boolean; onChange: (items: Item[]) => void }

function ChecklistItemRow({ item, readOnly, onUpdate, onRemove }: {
  item: Item; readOnly: boolean; onUpdate: (changes: Partial<Item>) => void; onRemove: () => void;
}) {
  const textRef = useRef<HTMLTextAreaElement>(null);
  const drag = useDraggable({ id: item.id, disabled: readOnly });
  const drop = useDroppable({ id: item.id, disabled: readOnly });
  useEffect(() => {
    const input = textRef.current;
    if (!input) return;
    input.style.height = "0px";
    input.style.height = `${Math.max(input.scrollHeight, 24)}px`;
  }, [item.text]);
  return <div ref={node => { drag.setNodeRef(node); drop.setNodeRef(node); }}
    style={{ transform: CSS.Translate.toString(drag.transform), opacity: drag.isDragging ? 0.45 : 1 }}
    className={"group flex min-w-0 items-center gap-1 rounded px-1 py-0.5 " +
      (drop.isOver ? "bg-blue-50 dark:bg-[var(--planner-hover)]" : "hover:bg-[var(--planner-hover)] dark:hover:bg-[var(--planner-surface)]")}>
    <button type="button" aria-label={`Reorder ${item.text || "checklist item"}`} title="Drag to reorder"
      className="inline-flex h-5 w-4 shrink-0 cursor-grab items-center justify-center rounded text-[var(--planner-secondary)] opacity-0 hover:bg-[var(--planner-hover)] group-hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing dark:hover:bg-[var(--planner-hover)]"
      disabled={readOnly} {...drag.attributes} {...drag.listeners}>
      <GripVertical aria-hidden="true" className="h-3.5 w-3.5" />
    </button>
    <input type="checkbox" className="shrink-0 accent-[var(--planner-accent)] opacity-100 transition-opacity"
      checked={item.done} disabled={readOnly} aria-label={item.text || "Checklist item"}
      onChange={event => onUpdate({ done: event.target.checked })} />
    <textarea ref={textRef} rows={1} className={"min-h-6 min-w-0 flex-1 resize-none overflow-hidden break-words rounded border border-transparent bg-transparent px-1 py-1 text-xs leading-4 outline-none hover:border-[var(--planner-border)] focus:border-blue-400 focus:bg-[var(--planner-surface)] dark:hover:border-[var(--planner-border)] dark:focus:bg-[var(--planner-surface)] " +
      (item.done ? "text-[var(--planner-secondary)] line-through" : "text-[var(--planner-text)] dark:text-[var(--planner-secondary)]")}
      aria-label="Checklist item text" maxLength={500} value={item.text} readOnly={readOnly}
      onChange={event => onUpdate({ text: event.target.value })} />
    {!readOnly && <button type="button" aria-label={`Remove ${item.text || "checklist item"}`}
      className="rounded px-1 text-sm text-[var(--planner-secondary)] opacity-0 hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 dark:hover:bg-rose-950"
      onClick={onRemove}>×</button>}
  </div>;
}

export function CollectionChecklist({ items = [], readOnly, compact = false, onChange }: Props) {
  const [draft, setDraft] = useState("");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor));
  const visible = compact ? items.slice(0, 3) : items;
  const add = (event: React.FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || readOnly || items.length >= 50) return;
    onChange([...items, { id: newId(), text, done: false }]);
    setDraft("");
  };
  const update = (id: string, changes: Partial<Item>) =>
    onChange(Object.keys(changes).length===1&&changes.done!==undefined?
      checklistToggle(items,id,changes.done):items.map(item=>item.id===id?{...item,...changes}:item));
  const reorder = ({ active, over }: DragEndEvent) => {
    if (readOnly || !over || active.id === over.id) return;
    const next=checklistReorder(items,String(active.id),String(over.id));
    if(next!==items)onChange(next);
  };

  return <div className={compact ? "mt-2 border-t border-[var(--planner-border)] pt-2 dark:border-[var(--planner-border)]" : "space-y-2"}
    aria-label="Record checklist" data-testid="collection-checklist">
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="font-medium text-[var(--planner-secondary)] dark:text-[var(--planner-secondary)]">Checklist</span>
      <span className="tabular-nums text-[var(--planner-secondary)]">{checklistTotals(items).completed}/{items.length}</span>
    </div>
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={reorder}>
      <div className="space-y-0.5" role="list" aria-label="Checklist items">
        {visible.map(item => <div key={item.id} role="listitem">
          <ChecklistItemRow item={item} readOnly={readOnly} onUpdate={changes => update(item.id, changes)}
            onRemove={() => onChange(items.filter(row => row.id !== item.id))} />
        </div>)}
      </div>
    </DndContext>
    {compact && items.length > visible.length &&
      <p className="text-[11px] text-[var(--planner-secondary)]">+{items.length - visible.length} more in details</p>}
    {!readOnly && items.length < 50 && <form className="group flex min-w-0 items-center gap-1 rounded px-1 py-0.5 hover:bg-[var(--planner-hover)] focus-within:bg-[var(--planner-hover)] dark:hover:bg-[var(--planner-surface)] dark:focus-within:bg-[var(--planner-surface)]"
      onSubmit={add}>
      <span aria-hidden="true" className="h-3.5 w-3.5 shrink-0 rounded-sm border border-[var(--planner-border)] opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 dark:border-[var(--planner-border)]" />
      <input type="text" className="min-w-0 flex-1 bg-transparent px-1 py-0.5 text-xs outline-none placeholder:text-[var(--planner-secondary)] focus:placeholder:text-[var(--planner-secondary)] dark:placeholder:text-[var(--planner-secondary)]"
        aria-label="New checklist item" placeholder="Add an item…" maxLength={500}
        value={draft} onChange={event => setDraft(event.target.value)} />
    </form>}
  </div>;
}
