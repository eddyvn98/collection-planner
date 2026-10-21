"use client";
import React, { useEffect, useRef, useState } from "react";
import { CollectionFieldIcon } from "./CollectionFieldIcon";
import { Ellipsis, GripVertical } from "lucide-react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { flexRender, type Header } from "@tanstack/react-table";
import { FIELD_TYPES, updateField, type CollectionBlockPayload, type CollectionField, type CollectionRecord } from "../collections/model";
import { fieldTypeLabels } from "./CollectionFieldEditor";

interface Props {
  field: CollectionField;
  header: Header<CollectionRecord, unknown>;
  data: CollectionBlockPayload;
  readOnly: boolean;
  onChange: (next: CollectionBlockPayload) => void;
  onOpenFieldSettings: (fieldId: string) => void;
  onRequestDelete: (fieldId: string) => void;
  onAdjustColumnSize: (fieldId: string, delta: number) => void;
}

export function CollectionTableColumnHeader({ field, header, data, readOnly, onChange, onOpenFieldSettings, onRequestDelete, onAdjustColumnSize }: Props) {
  const drag = useDraggable({ id: field.id, disabled: readOnly });
  const drop = useDroppable({ id: field.id, disabled: readOnly });
  const optionsMenu = useRef<HTMLDetailsElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (!menuOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (optionsMenu.current?.contains(event.target as Node)) return;
      if (optionsMenu.current) optionsMenu.current.open = false;
      setMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (optionsMenu.current) optionsMenu.current.open = false;
      setMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);
  return <th ref={node => { drag.setNodeRef(node); drop.setNodeRef(node); }}
    style={{ width: header.getSize(), transform: CSS.Translate.toString(drag.transform), opacity: drag.isDragging ? 0.45 : 1 }}
    className={`group sticky top-0 z-30 whitespace-nowrap border-b border-[var(--planner-border)] bg-[var(--planner-surface)] p-2 text-[var(--planner-text)] ${drop.isOver ? "ring-2 ring-inset ring-blue-400" : ""}`}>
    <div className="flex items-center gap-1">
      <button type="button" aria-label={`Reorder column ${field.name}`} title="Drag to reorder column"
        className="flex h-6 w-4 shrink-0 cursor-grab items-center justify-center rounded text-[var(--planner-secondary)] opacity-0 hover:bg-[var(--planner-surface)] group-hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing dark:hover:bg-[var(--planner-hover)]"
        disabled={readOnly} {...drag.attributes} {...drag.listeners}>
        <GripVertical aria-hidden="true" className="h-3.5 w-3.5" />
      </button>
      <CollectionFieldIcon type={field.type}/>
      <button type="button" disabled={readOnly} onClick={header.column.getToggleSortingHandler()}
        className={`min-w-0 flex-1 truncate ${field.type === "number" ? "text-right" : "text-left"}`}
        aria-label={`Sort ${field.name}`} title="Shift-click to sort by multiple columns">
        {flexRender(header.column.columnDef.header, header.getContext())}
        {header.column.getIsSorted() === "asc" ? " ↑" : header.column.getIsSorted() === "desc" ? " ↓" : ""}
        {header.column.getSortIndex() > 0 ? ` (${header.column.getSortIndex() + 1})` : ""}
      </button>
      <details ref={optionsMenu} onToggle={event => setMenuOpen(event.currentTarget.open)} className="group relative inline-block align-middle">
        <summary aria-label={`Column options for ${field.name}`} title={`Column options for ${field.name}`}
          className="flex h-6 w-6 cursor-pointer list-none items-center justify-center rounded text-[var(--planner-secondary)] opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:bg-[var(--planner-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-[var(--planner-hover)]">
          <Ellipsis aria-hidden="true" className="h-4 w-4" />
        </summary>
        <div className={`absolute z-20 mt-1 grid min-w-56 gap-2 rounded-lg border border-[var(--planner-border)] bg-[var(--planner-surface)] p-3 text-left font-normal shadow-lg dark:border-[var(--planner-border)] dark:bg-[var(--planner-surface)] ${header.index === data.fields.length - 1 ? "right-0" : "left-0"}`}>
          <label className="grid gap-1 text-xs text-[var(--planner-secondary)]">Property name
            <input aria-label={`Rename ${field.name}`} className="rounded border border-[var(--planner-border)] bg-transparent px-2 py-1.5 text-sm text-[var(--planner-text)] dark:border-[var(--planner-border)] dark:text-[var(--planner-secondary)]" value={field.name} disabled={readOnly}
              onChange={event => onChange(updateField(data, field.id, { name: event.target.value }))} />
          </label>
          <label className="grid gap-1 text-xs text-[var(--planner-secondary)]">Property type
            <select aria-label={`Type ${field.name}`} className="rounded border border-[var(--planner-border)] bg-transparent px-2 py-1.5 text-sm text-[var(--planner-text)] dark:border-[var(--planner-border)] dark:text-[var(--planner-secondary)]" value={field.type} disabled={readOnly}
              onChange={event => onChange(updateField(data, field.id, { type: event.target.value as CollectionField["type"] }))}>
              {FIELD_TYPES.map(type => <option key={type} value={type}>{fieldTypeLabels[type]}</option>)}
            </select>
          </label>
          {field.type === "select" && <label className="grid gap-1 text-xs text-[var(--planner-secondary)]">Options (comma separated)
            <input aria-label={`Options ${field.name}`} className="rounded border border-[var(--planner-border)] bg-transparent px-2 py-1.5 text-sm text-[var(--planner-text)] dark:border-[var(--planner-border)] dark:text-[var(--planner-secondary)]" value={(field.options ?? []).join(", ")} disabled={readOnly}
              onChange={event => onChange(updateField(data, field.id, { options: event.target.value.split(",").map(value => value.trim()).filter(Boolean) }))} />
          </label>}
          {field.type === "text" && <label className="flex items-center gap-2 rounded px-1 py-1 text-xs text-[var(--planner-text)] dark:text-[var(--planner-secondary)]">
            <input aria-label={`Wrap text in ${field.name}`} type="checkbox" checked={field.wrapText ?? false} disabled={readOnly}
              onChange={event => onChange(updateField(data, field.id, { wrapText: event.target.checked }))} />
            Wrap text
          </label>}
          <button type="button" className="rounded px-2 py-1.5 text-left text-xs text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-[var(--planner-surface)]" onClick={() => onOpenFieldSettings(field.id)}>Advanced property settings…</button>
          <button type="button" className="rounded px-2 py-1.5 text-left text-xs text-rose-600 hover:bg-rose-50 disabled:opacity-40 dark:hover:bg-rose-950" aria-label={`Delete column ${field.name}`} disabled={readOnly || field.id === data.fields[0]?.id}
            onClick={() => onRequestDelete(field.id)}>Delete property</button>
        </div>
      </details>
    </div>
    {!readOnly && <div role="separator" aria-orientation="vertical" aria-label={`Resize ${field.name} column`}
      aria-valuemin={80} aria-valuemax={640} aria-valuenow={header.getSize()} tabIndex={0}
      title="Drag to resize column" onMouseDown={header.getResizeHandler()} onTouchStart={header.getResizeHandler()}
      onKeyDown={event => {
        const step = event.shiftKey ? 40 : 16;
        if (event.key === "ArrowLeft") onAdjustColumnSize(field.id, -step);
        else if (event.key === "ArrowRight") onAdjustColumnSize(field.id, step);
        else return;
        event.preventDefault();
      }}
      className={`absolute right-0 top-0 z-10 h-full w-1 cursor-col-resize touch-none hover:bg-blue-400 focus-visible:bg-blue-500 focus-visible:outline-none ${header.column.getIsResizing() ? "bg-blue-500" : ""}`} />}
  </th>;
}
