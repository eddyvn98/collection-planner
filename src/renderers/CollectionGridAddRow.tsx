import { Plus } from "lucide-react";
import { useState } from "react";
import { createBoardTask } from "../collections/collectionTasks";
import type { CollectionBlockPayload } from "../collections/model";
export function CollectionGridAddRow({ data, colSpan, readOnly, onChange }: {
  data: CollectionBlockPayload; colSpan: number; readOnly: boolean;
  onChange: (next: CollectionBlockPayload) => void;
}) {
  const [title, setTitle] = useState("");
  const add = () => {
    if (!title.trim() || readOnly) return;
    onChange(createBoardTask(data, title));
    setTitle("");
  };
  return <tr data-testid="collection-add-row">
    <td colSpan={colSpan} className="border-b border-[var(--planner-border)] p-2 dark:border-[var(--planner-border)]">
      <form className="flex items-center gap-2" onSubmit={e=>{e.preventDefault();add();}}>
        <Plus aria-hidden="true" size={16} strokeWidth={1.75} className="text-[var(--planner-accent)]"/>
        <input aria-label="New task title" value={title} disabled={readOnly}
          className="min-w-0 flex-1 rounded-md border border-[var(--planner-border)] bg-[var(--planner-surface)] p-2 text-sm focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-[var(--planner-border)] dark:bg-[var(--planner-surface)]"
          placeholder="Add new task — type a name, press Enter" maxLength={300}
          onChange={e=>setTitle(e.target.value)} />
        <button type="submit" disabled={readOnly||!title.trim()}
          className="rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">
          <Plus size={16} className="inline-block"/> Add task
        </button>
      </form>
    </td>
  </tr>;
}

export function CollectionGridAddQuick({ data, readOnly, onChange }: {
  data: CollectionBlockPayload; readOnly: boolean; onChange: (next: CollectionBlockPayload) => void;
}) {
  const [name, setName] = useState("");
  return <form className="flex items-center gap-2 p-2" onSubmit={event => {
    event.preventDefault();if (!name.trim() || readOnly) return;
    onChange(createBoardTask(data, name));setName("");
  }}>
    <input aria-label="New task title" className="min-w-0 flex-1 rounded border bg-[var(--planner-surface)] p-2 text-sm dark:bg-[var(--planner-surface)]"
      value={name} maxLength={300} disabled={readOnly} onChange={event => setName(event.target.value)}
      placeholder="Add new task" />
    <button type="submit" disabled={readOnly || !name.trim()}
      className="rounded bg-blue-600 px-3 py-2 text-sm text-white disabled:opacity-50">Add task</button>
  </form>;
}
