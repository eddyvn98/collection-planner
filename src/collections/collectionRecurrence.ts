import { addDays, addMonths, addWeeks, format, isValid, parseISO } from "date-fns";
import { newId, recordTitle, setRecordValue, type CollectionBlockPayload,
  type CollectionRecord } from "./model";
import { taskDateFields, updateTask } from "./collectionTasks";
import { isLegacyStatusField, plannerBucket } from "./collectionPlannerFields";
export type TaskRecurrence = NonNullable<CollectionRecord["recurrence"]>;
const nextDay = (day: string, cadence: TaskRecurrence): string => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return "";
  const source = parseISO(day);
  if (!isValid(source) || format(source, "yyyy-MM-dd") !== day) return "";
  const date = cadence === "daily" ? addDays(source, 1)
    : cadence === "weekly" ? addWeeks(source, 1)
    : cadence === "monthly" ? addMonths(source, 1) : source;
  return format(date, "yyyy-MM-dd");
};
export function copyTask(data: CollectionBlockPayload, id: string): CollectionBlockPayload {
  const source = data.records.find(row => row.id === id);
  if (!source) return data;
  const titleId = data.fields.find(field => field.type === "text")?.id;
  const values = { ...source.values };
  if (titleId) values[titleId] = "Copy of " + recordTitle(data, source);
  const copy: CollectionRecord = { ...source, id: newId(), values,
    progress: "not_started", boardOrder: (source.boardOrder ?? 0) + 0.1,
    checklist: source.checklist?.map(item => ({ ...item, id: newId(), done: false })),
    attachments: source.attachments?.map(item => ({ ...item, id: newId() })),
    dependsOn: [], comments: [], activity: [] };
  return { ...data, records: [...data.records, copy] };
}
export function moveTaskToBucket(data: CollectionBlockPayload, id: string, bucket: string): CollectionBlockPayload {
  const field = plannerBucket(data);
  if (!field || (bucket !== "" && !(field.options ?? []).includes(bucket))) return data;
  return setRecordValue(data, id, field.id, bucket);
}
/** Completion creates exactly one fresh occurrence, and never repeats on no-op saves. */
export function completeRecurringTask(data: CollectionBlockPayload, original: CollectionRecord): CollectionBlockPayload {
  if (!original.recurrence || original.recurrence === "none") return data;
  const { start, due } = taskDateFields(data);
  const lastDue = due ? original.values[due.id] : original.dueDate;
  const lastStart = start ? original.values[start.id] : original.startDate;
  if (!lastDue && !lastStart) return data;
  const values = { ...original.values };
  const bucketField = plannerBucket(data);
  if (bucketField) {
    const sourceBucket = original.values[bucketField.id] ?? "";
    // The canonical Bucket field is independent of the retired Status select.
    // Completed buckets should not receive new, unstarted occurrences.
    values[bucketField.id] = /^done$/i.test(sourceBucket.trim())
      ? bucketField.options?.find(option => option.trim() && !/^done$/i.test(option.trim())) ?? ""
      : sourceBucket;
  }
  const legacyStatus = data.fields.find(isLegacyStatusField);
  // Keep compatibility values consistent with the new progress, never use them as a bucket.
  if (legacyStatus?.options?.includes("To do")) values[legacyStatus.id] = "To do";
  if (start && lastStart) values[start.id] = nextDay(lastStart, original.recurrence);
  if (due && lastDue) values[due.id] = nextDay(lastDue, original.recurrence);
  const nextDue = lastDue && !due ? nextDay(lastDue, original.recurrence) : undefined;
  const nextStart = lastStart && !start ? nextDay(lastStart, original.recurrence) : undefined;
  if ((due && lastDue && !values[due.id]) || (start && lastStart && !values[start.id])) return data;
  const fresh: CollectionRecord = { ...original, id: newId(), values, progress: "not_started",
    dueDate: nextDue ?? original.dueDate, startDate: nextStart ?? original.startDate,
    checklist: original.checklist?.map(item => ({ ...item, id: newId(), done: false })),
    comments: [], activity: [], boardOrder: (original.boardOrder ?? 0) - 0.1 };
  return { ...data, records: [...data.records, fresh] };
}
export function setRecurrence(data: CollectionBlockPayload, id: string, recurrence: TaskRecurrence) {
  if (!["none", "daily", "weekly", "monthly"].includes(recurrence)) return data;
  return updateTask(data, id, { recurrence }, "Updated recurrence");
}
