import { CollectionGridEditable } from "./CollectionGridEditable";
import { Flag, Circle, CircleDot, CheckCircle2 } from "lucide-react";
import { recordTitle } from "../collections/model";
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
      const current = data(), record = row.original, title = recordTitle(current, record);
      if (id === "__progress") {
        const value=record.progress ?? "not_started";
        return <CollectionGridEditable label={"Progress for "+title} value={value}
          type="progress" options={PROGRESS} readOnly={readOnly}
          onSave={next=>save(setTaskProgress(data(),record.id,next as TaskProgress))}>
          <span className="inline-flex items-center gap-1.5">
            {value==="completed"?<CheckCircle2 size={14} className="text-emerald-600"/>:
              value==="in_progress"?<CircleDot size={14} className="text-[var(--planner-accent)]"/>:<Circle size={14}/>}
            {PROGRESS.find(p=>p.value===value)?.label}
          </span>
        </CollectionGridEditable>;
      }
      if (id === "__priority") {
        const value=record.priority ?? "medium";
        return <CollectionGridEditable label={"Priority for "+title} value={value}
          type="priority" options={PRIORITIES} readOnly={readOnly}
          onSave={next=>save(updateTask(data(),record.id,{priority:next as TaskPriority},"Changed priority"))}>
          {value==="medium"?<span aria-hidden="true" />:<span className="inline-flex items-center gap-1.5">
            <Flag size={14} className={value==="urgent"?"text-rose-600":value==="important"?"text-amber-600":"text-[var(--planner-secondary)]"}/>
            {PRIORITIES.find(p=>p.value===value)?.label}
          </span>}
        </CollectionGridEditable>;
      }
      return <CollectionGridMultiSelect data={data} record={record}
       kind={id==="__assignee"?"assignee":"label"} readOnly={readOnly} save={save}/>;
    },
  });
  return [make("__progress", "Progress", 132), make("__assignee", "Assignees", 148),
    make("__priority", "Priority", 112), make("__labels", "Labels", 132)];
}
