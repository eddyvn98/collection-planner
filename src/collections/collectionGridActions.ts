import { deleteRecord, type CollectionBlockPayload, type TaskPriority, type TaskProgress } from "../collections/model";
import { updateTask } from "../collections/collectionTasks";
import { setTaskProgress } from "../renderers/collectionBoardGroups";
export type GridBulkAction =
  | { kind: "progress"; value: TaskProgress }
  | { kind: "priority"; value: TaskPriority }
  | { kind: "delete" };
/** Every mutation is immutable and uses model operations to preserve relation integrity. */
export function bulkUpdateGrid(data: CollectionBlockPayload, ids: string[],
  action: GridBulkAction, readOnly = false): CollectionBlockPayload {
  if (readOnly || ids.length === 0) return data;
  const selected = [...new Set(ids)].filter(id => data.records.some(record => record.id === id));
  if (!selected.length) return data;
  let next = data;
  for (const id of selected) {
    if (action.kind === "delete") next = deleteRecord(next, id);
    else if (action.kind === "progress") next = setTaskProgress(next, id, action.value);
    else next = updateTask(next, id, { priority: action.value }, "Bulk priority change");
  }
  return next;
}
