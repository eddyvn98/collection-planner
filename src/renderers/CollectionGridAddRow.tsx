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
    <td colSpan={colSpan} className="border-b border-slate-200 p-2 dark:border-slate-700">
      <form className="flex items-center gap-2" onSubmit={e=>{e.preventDefault();add();}}>
        <span aria-hidden="true" className="text-lg text-blue-600">+</span>
        <input aria-label="New task title" value={title} disabled={readOnly}
          className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white p-2 text-sm focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900"
          placeholder="Add new task — type a name, press Enter" maxLength={300}
          onChange={e=>setTitle(e.target.value)} />
        <button type="submit" disabled={readOnly||!title.trim()}
          className="rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">
          Add task
        </button>
      </form>
    </td>
  </tr>;
}
