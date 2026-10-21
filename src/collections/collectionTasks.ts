import { addRecord, newId, primaryField, setRecordValue,
  type CollectionBlockPayload, type CollectionField, type CollectionRecord,
  type TaskPriority, type TaskProgress } from "./model";

export const PROGRESS: { value: TaskProgress; label: string }[] = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];
export const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: "urgent", label: "Urgent" }, { value: "important", label: "Important" },
  { value: "medium", label: "Medium" }, { value: "low", label: "Low" },
];
const progressKeys = PROGRESS.map(item => item.value);
const priorityKeys = PRIORITIES.map(item => item.value);
export function progressFromStatus(value: string): TaskProgress {
  const status = value.toLowerCase().trim();
  if (["done", "completed", "complete", "finished"].includes(status)) return "completed";
  if (["in progress", "doing", "working", "active"].includes(status)) return "in_progress";
  return "not_started";
}
export function normalizeTaskRecord(record: CollectionRecord, fields: CollectionField[]): CollectionRecord {
  const status = fields.find(field => field.type === "select" && /status|progress/i.test(field.name));
  const progress = progressKeys.includes(record.progress as TaskProgress)
    ? record.progress : progressFromStatus(record.values?.[status?.id ?? ""] ?? "");
  const priority = priorityKeys.includes(record.priority as TaskPriority) ? record.priority : "medium";
  return { ...record, progress, priority,
    assigneeIds: Array.isArray(record.assigneeIds) ? [...new Set(record.assigneeIds.filter(id => typeof id === "string"))] : [],
    labelIds: Array.isArray(record.labelIds) ? [...new Set(record.labelIds.filter(id => typeof id === "string"))].slice(0, 25) : [],
    attachments: Array.isArray(record.attachments) ? record.attachments : [],
    comments: Array.isArray(record.comments) ? record.comments : [],
    activity: Array.isArray(record.activity) ? record.activity : [] };
}
export function taskDateFields(data: CollectionBlockPayload) {
  const dates = data.fields.filter(field => field.type === "date");
  const start = dates.find(field => /^start/i.test(field.name)) ?? dates[0];
  const due = dates.find(field => /^(due|deadline|end)/i.test(field.name)) ?? dates[1] ?? dates[0];
  return { start, due };
}
export function taskDate(data: CollectionBlockPayload, record: CollectionRecord, kind: "start" | "due"): string {
  const field = taskDateFields(data)[kind];
  return record.values[field?.id ?? ""] || (kind === "start" ? record.startDate : record.dueDate) || "";
}
export function setTaskDate(data: CollectionBlockPayload, recordId: string,
  kind: "start" | "due", value: string): CollectionBlockPayload {
  if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) return data;
  const field = taskDateFields(data)[kind];
  if (field) return setRecordValue(data, recordId, field.id, value);
  return updateTask(data, recordId, { [kind === "start" ? "startDate" : "dueDate"]: value }, "Changed " + kind + " date");
}
export function updateTask(data: CollectionBlockPayload, recordId: string,
  patch: Partial<CollectionRecord>, description?: string): CollectionBlockPayload {
  const current = data.records.find(row => row.id === recordId);
  if (!current) return data;
  const safe = { ...patch };
  delete safe.id; delete safe.values;
  if (safe.labelIds) safe.labelIds = [...new Set(safe.labelIds)].slice(0, 25);
  const unchanged = Object.entries(safe).every(([key, value]) =>
    JSON.stringify(current[key as keyof CollectionRecord]) === JSON.stringify(value));
  if (unchanged) return data;
  const event = description ? { id: newId(), at: new Date().toISOString(), summary: description } : null;
  return { ...data, records: data.records.map(row => row.id === recordId
    ? { ...row, ...safe, ...(event ? { activity: [...(row.activity ?? []), event].slice(-50) } : {}) } : row) };
}
export function createBoardTask(data: CollectionBlockPayload, title: string,
  groupFieldId?: string, bucket = ""): CollectionBlockPayload {
  const name = title.trim();
  const titleField = primaryField(data);
  if (!name || !titleField) return data;
  const values: Record<string, string> = { [titleField.id]: name };
  if (groupFieldId) values[groupFieldId] = bucket;
  const added = addRecord(data, values);
  const fresh = added.records[added.records.length - 1];
  const minimum = Math.min(0, ...data.records.map(row => row.boardOrder ?? 0));
  return { ...added, records: added.records.map(row => row.id === fresh.id
    ? { ...row, progress: "not_started", priority: "medium", boardOrder: minimum - 1 } : row) };
}
export function addTaskComment(data: CollectionBlockPayload, recordId: string, text: string): CollectionBlockPayload {
  if (!text.trim() || text.length > 5000) return data;
  const current = data.records.find(row => row.id === recordId);
  if (!current) return data;
  const comment = { id: newId(), author: "You", text: text.trim(), at: new Date().toISOString() };
  return updateTask(data, recordId, { comments: [...(current.comments ?? []), comment] }, "Added a comment");
}
export function localToday(date = new Date()): string {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")].join("-");
}