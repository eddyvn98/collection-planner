import { Plus } from "lucide-react";
import { useState } from "react";
import { createQuickTask } from "../collections/collectionInputParser";
import { CollectionQuickAddInput,parsedQuickTitle } from "./CollectionQuickAddInput";
import type { CollectionBlockPayload } from "../collections/model";
export function CollectionGridAddRow({ data, colSpan, readOnly, onChange }: {
  data: CollectionBlockPayload; colSpan: number; readOnly: boolean;
  onChange: (next: CollectionBlockPayload) => void;
}) {
  const [title, setTitle] = useState("");
  const add = () => {
    if (!title.trim() || readOnly) return;
    const raw=parsedQuickTitle(data,title);
    onChange(createQuickTask(data,raw.title===title.trim()?title:title));
    setTitle("");
  };
  return <tr data-testid="collection-add-row">
    <td colSpan={colSpan} className="border-b border-[var(--planner-border)] p-2 dark:border-[var(--planner-border)]">
      <form className="flex items-center gap-2" onSubmit={e=>{e.preventDefault();add();}}>
        <Plus aria-hidden="true" size={16} strokeWidth={1.75} className="text-[var(--planner-accent)]"/>
        <CollectionQuickAddInput data={data} label="New task title" value={title} onChange={setTitle}
         disabled={readOnly} className="min-h-11 w-full rounded-md border border-[var(--planner-border)] bg-[var(--planner-surface)] p-2 text-sm"
         placeholder="Task · mai @người #nhãn !urgent" />
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
    onChange(createQuickTask(data,name));setName("");
  }}>
    <CollectionQuickAddInput data={data} label="New task title" value={name} onChange={setName}
     disabled={readOnly} className="h-[44px] min-h-[44px] w-full rounded border bg-[var(--planner-surface)] px-2 text-sm"
     placeholder="Add task · tomorrow +3d #label" />
    <button type="submit" disabled={readOnly || !name.trim()}
      className="min-h-[44px] rounded bg-blue-600 px-3 py-2 text-sm text-white disabled:opacity-50">Add task</button>
  </form>;
}
