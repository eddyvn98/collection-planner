import { CollectionGridMultiSelect } from "./CollectionGridMultiSelect";
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
      return <CollectionGridMultiSelect data={data} record={record}
       kind={id==="__assignee"?"assignee":"label"} readOnly={readOnly} save={save}/>;
    },
  });
  return [make("__progress", "Progress", 140), make("__priority", "Priority", 116),
    make("__assignee", "Assignees", 148), make("__labels", "Labels", 132)];
}
