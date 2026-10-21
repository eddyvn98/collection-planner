import type { ColumnDef } from "@tanstack/react-table";
import { setTaskProgress } from "./collectionBoardGroups";
import { PROGRESS, PRIORITIES, updateTask } from "../collections/collectionTasks";
import type { CollectionBlockPayload, CollectionRecord, TaskPriority, TaskProgress } from "../collections/model";
export const GRID_TASK_KEYS = ["__progress", "__priority", "__assignee", "__labels"] as const;
export type GridTaskKey = typeof GRID_TASK_KEYS[number];
export function gridTaskColumns(data: () => CollectionBlockPayload,
  save: (next: CollectionBlockPayload) => void, readOnly: boolean): ColumnDef<CollectionRecord>[] {
  const make = (id: GridTaskKey, label: string, size: number): ColumnDef<CollectionRecord> => ({
    id, header: label, size, enableSorting: false,
    cell: ({ row }) => {
      const current = data(), record = row.original;
      if (id === "__progress") return <select aria-label={"Progress for " + record.id}
        className="w-full rounded-md border border-[var(--planner-border)] bg-[var(--planner-surface)] p-1.5 text-xs text-[var(--planner-text)] focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)] dark:border-[var(--planner-border)] dark:bg-[var(--planner-surface)] dark:text-white"
        disabled={readOnly} value={record.progress ?? "not_started"}
        onChange={e => save(setTaskProgress(current, record.id, e.target.value as TaskProgress))}>
        {PROGRESS.map(p => <option value={p.value} key={p.value}>{p.label}</option>)}
      </select>;
      if (id === "__priority") return <select aria-label={"Priority for " + record.id}
        className="w-full rounded-md border border-[var(--planner-border)] bg-[var(--planner-surface)] p-1.5 text-xs text-[var(--planner-text)] focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)] dark:border-[var(--planner-border)] dark:bg-[var(--planner-surface)] dark:text-white"
        disabled={readOnly} value={record.priority ?? "medium"}
        onChange={e => save(updateTask(current, record.id, { priority: e.target.value as TaskPriority }, "Changed priority"))}>
        {PRIORITIES.map(p => <option value={p.value} key={p.value}>{p.label}</option>)}
      </select>;
      const isPerson = id === "__assignee", ids = isPerson ? record.assigneeIds ?? [] : record.labelIds ?? [];
      const options = isPerson ? current.people ?? [] : current.labels ?? [];
      return <details className="relative">
        <summary className="cursor-pointer truncate rounded-md border border-[var(--planner-border)] p-1.5 text-xs focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)] dark:border-[var(--planner-border)]"
          aria-label={(isPerson ? "Assignees" : "Labels") + " for " + record.id}>
          {options.filter(p => ids.includes(p.id)).map(p => p.name).join(", ") || (isPerson ? "Unassigned" : "No labels")}
        </summary>
        <div className="absolute left-0 top-8 z-40 max-h-48 min-w-40 overflow-auto rounded-md border bg-[var(--planner-surface)] p-2 shadow-lg dark:border-[var(--planner-border)] dark:bg-[var(--planner-surface)]">
          {options.length === 0 && <p className="text-xs text-[var(--planner-secondary)]">Add options in task details.</p>}
          {options.map(p => <label className="flex items-center gap-2 py-1 text-xs" key={p.id}>
            <input type="checkbox" disabled={readOnly} checked={ids.includes(p.id)}
              onChange={e => {
                const next = e.target.checked ? [...ids, p.id] : ids.filter(value => value !== p.id);
                save(updateTask(data(), record.id, isPerson ? { assigneeIds: next } : { labelIds: next }, "Updated task"));
              }} />{p.name}
          </label>)}
        </div>
      </details>;
    },
  });
  return [make("__progress", "Progress", 140), make("__priority", "Priority", 116),
    make("__assignee", "Assignees", 148), make("__labels", "Labels", 132)];
}
