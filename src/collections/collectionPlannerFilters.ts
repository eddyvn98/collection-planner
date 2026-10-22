import { newId, primaryField, recordTitle, type CollectionBlockPayload,
  type CollectionRecord, type CollectionView } from "./model";
import { isLegacyStatusField } from "./collectionPlannerFields";
import { localToday, taskDate } from "./collectionTasks";
import {matchesTaskSearch} from "./collectionTaskSearch";

export type TaskDueFilter = "all" | "overdue" | "today" | "next7" | "no_due";
export interface TaskFilterState {
  keyword: string;
  due: TaskDueFilter;
  bucket: string;
  label: string;
  assignee: string;
  priority: string;
  progress?: string;
}
export interface TaskFilterPreset { id: string; name: string; filters: TaskFilterState }
export function countActiveTaskFilters(filters: TaskFilterState): number {
  return Number(!!filters.keyword.trim()) + Number(filters.due !== "all") +
    [filters.bucket, filters.label, filters.assignee, filters.priority, filters.progress]
      .filter(Boolean).length;
}
export const EMPTY_TASK_FILTERS: TaskFilterState = {
  keyword: "", due: "all", bucket: "", label: "", assignee: "", priority: "", progress: "",
};
const addDays = (date: string, days: number) => {
  const value = new Date(date + "T12:00:00Z");
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};
export function matchesPlannerTask(data: CollectionBlockPayload, record: CollectionRecord,
  filters: TaskFilterState, today = localToday()): boolean {
  const query = filters.keyword.trim().toLocaleLowerCase();
  if (query && !matchesTaskSearch(data,record,query)) return false;
  const bucket = data.fields.find(field => field.type === "select" && /^bucket$/i.test(field.name));
  if (filters.bucket && (record.values[bucket?.id ?? ""] ?? "") !==
    (filters.bucket === "__unassigned__" ? "" : filters.bucket)) return false;
  if (filters.label && !(record.labelIds ?? []).includes(filters.label)) return false;
  if (filters.assignee) {
    const known = new Set((data.people ?? []).map(person => person.id));
    const ids = (record.assigneeIds ?? []).filter(id => known.has(id));
    if (filters.assignee === "__unassigned__" ? !!ids.length : !ids.includes(filters.assignee)) return false;
  }
  if (filters.priority && (record.priority ?? "medium") !== filters.priority) return false;
  if (filters.progress) {
    const status = data.fields.find(f => f.type === "select" && /^(status|progress)$/i.test(f.name.trim()));
    const text = (record.values[status?.id ?? ""] ?? "").toLowerCase().trim();
    const fallback = ["done", "completed", "complete", "finished"].includes(text) ? "completed"
      : ["in progress", "doing", "working", "active"].includes(text) ? "in_progress" : "not_started";
    if ((record.progress ?? fallback) !== filters.progress) return false;
  }
  if (filters.due !== "all") {
    const due = taskDate(data, record, "due");
    if (filters.due === "no_due") return !due;
    if (!due || record.progress === "completed") return false;
    if (filters.due === "overdue" && !(due < today)) return false;
    if (filters.due === "today" && due !== today) return false;
    if (filters.due === "next7" && !(due >= today && due <= addDays(today, 7))) return false;
  }
  return true;
}
export function filterPlannerTasks(data: CollectionBlockPayload, rows: CollectionRecord[],
  filters: TaskFilterState, today = localToday()): CollectionRecord[] {
  const inactive = !filters.keyword.trim() && filters.due === "all" &&
    !filters.bucket && !filters.label && !filters.assignee && !filters.priority && !filters.progress;
  return inactive ? rows : rows.filter(row => matchesPlannerTask(data, row, filters, today));
}
export function saveTaskFilterPreset(data: CollectionBlockPayload,
  name: string, filters: TaskFilterState): CollectionBlockPayload {
  const trimmed = name.trim().slice(0, 80);
  if (!trimmed) return data;
  const presets = data.savedTaskFilters ?? [];
  const existing = presets.find(item => item.name.toLocaleLowerCase() === trimmed.toLocaleLowerCase());
  if (!existing && presets.length >= 20) return data;
  const next = { id: existing?.id ?? newId(), name: trimmed, filters: { ...filters } };
  return { ...data, savedTaskFilters: existing
    ? presets.map(preset => preset.id === existing.id ? next : preset)
    : [...presets, next] };
}
export function deleteTaskFilterPreset(data: CollectionBlockPayload, id: string): CollectionBlockPayload {
  if (!data.savedTaskFilters?.some(p => p.id === id)) return data;
  return { ...data, savedTaskFilters: data.savedTaskFilters.filter(p => p.id !== id) };
}
export const GRID_TASK_COLUMNS = [
  { id: "__progress", name: "Progress" }, { id: "__assignee", name: "Assignees" },
  { id: "__priority", name: "Priority" }, { id: "__labels", name: "Labels" },
] as const;
export type GridTaskColumnId = typeof GRID_TASK_COLUMNS[number]["id"];

/** New views start with Name + Due + four task properties (six columns max).
 * Existing configured views retain their explicit visibility choices. */
export function initialGridHiddenFields(data: CollectionBlockPayload): string[] {
  const title = primaryField(data)?.id;
  const due = data.fields.find(field => field.type === "date" &&
    /^(due|deadline|end)( date)?$/i.test(field.name.trim()))?.id;
  return data.fields.filter(field => !isLegacyStatusField(field) &&
    field.id !== title && field.id !== due).map(field => field.id);
}
export function visibleGridTaskKeys(view: CollectionView): GridTaskColumnId[] {
  const hidden = new Set(view.gridHiddenFieldIds ?? []);
  return GRID_TASK_COLUMNS.map(item => item.id).filter(id => !hidden.has(id));
}
export function gridFields(data: CollectionBlockPayload, view: CollectionView) {
  const hidden = new Set(view.gridHiddenFieldIds ?? initialGridHiddenFields(data));
  const titleId = primaryField(data)?.id;
  return data.fields.filter(field => !isLegacyStatusField(field) &&
    (field.id === titleId || !hidden.has(field.id)));
}
export function toggleGridField(data: CollectionBlockPayload, viewId: string,
  fieldId: string): CollectionBlockPayload {
  const view = data.views.find(v => v.id === viewId);
  const isTask = GRID_TASK_COLUMNS.some(item => item.id === fieldId);
  if (!view || (!isTask && !data.fields.some(f => f.id === fieldId)) ||
    primaryField(data)?.id === fieldId) return data;
  const hidden = new Set(view.gridHiddenFieldIds ?? initialGridHiddenFields(data));
  if (hidden.has(fieldId)) hidden.delete(fieldId);
  else hidden.add(fieldId);
  return { ...data, views: data.views.map(v => v.id === viewId
    ? { ...v, gridHiddenFieldIds: [...hidden] } : v) };
}
