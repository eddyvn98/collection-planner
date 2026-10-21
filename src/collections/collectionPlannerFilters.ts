import { newId, primaryField, recordTitle, type CollectionBlockPayload,
  type CollectionRecord, type CollectionView } from "./model";
import { localToday, taskDate } from "./collectionTasks";

export type TaskDueFilter = "all" | "overdue" | "today" | "next7" | "no_due";
export interface TaskFilterState {
  keyword: string;
  due: TaskDueFilter;
  bucket: string;
  label: string;
  assignee: string;
  priority: string;
}
export interface TaskFilterPreset { id: string; name: string; filters: TaskFilterState }
export const EMPTY_TASK_FILTERS: TaskFilterState = {
  keyword: "", due: "all", bucket: "", label: "", assignee: "", priority: "",
};
const addDays = (date: string, days: number) => {
  const value = new Date(date + "T12:00:00Z");
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};
export function matchesPlannerTask(data: CollectionBlockPayload, record: CollectionRecord,
  filters: TaskFilterState, today = localToday()): boolean {
  const query = filters.keyword.trim().toLocaleLowerCase();
  if (query && ![recordTitle(data, record), record.body ?? "", ...Object.values(record.values)]
    .some(text => text.toLocaleLowerCase().includes(query))) return false;
  const bucket = data.fields.find(field => field.type === "select" && /^bucket$/i.test(field.name));
  if (filters.bucket && (record.values[bucket?.id ?? ""] ?? "") !==
    (filters.bucket === "__unassigned__" ? "" : filters.bucket)) return false;
  if (filters.label && !(record.labelIds ?? []).includes(filters.label)) return false;
  if (filters.assignee && !(record.assigneeIds ?? []).includes(filters.assignee)) return false;
  if (filters.priority && (record.priority ?? "medium") !== filters.priority) return false;
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
    !filters.bucket && !filters.label && !filters.assignee && !filters.priority;
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
export function gridFields(data: CollectionBlockPayload, view: CollectionView) {
  const hidden = new Set(view.gridHiddenFieldIds ?? []);
  const titleId = primaryField(data)?.id;
  return data.fields.filter(field => field.id === titleId || !hidden.has(field.id));
}
export function toggleGridField(data: CollectionBlockPayload, viewId: string,
  fieldId: string): CollectionBlockPayload {
  const view = data.views.find(v => v.id === viewId);
  if (!view || !data.fields.some(f => f.id === fieldId) || primaryField(data)?.id === fieldId) return data;
  const hidden = new Set(view.gridHiddenFieldIds ?? []);
  if (hidden.has(fieldId)) hidden.delete(fieldId);
  else hidden.add(fieldId);
  return { ...data, views: data.views.map(v => v.id === viewId
    ? { ...v, gridHiddenFieldIds: [...hidden] } : v) };
}
