import { addDays, addMonths, addWeeks, differenceInCalendarDays, eachDayOfInterval,
  endOfMonth, endOfWeek, format, isValid, parseISO, startOfMonth, startOfWeek } from "date-fns";
import { addRecord, dateField, endDateField, primaryField, setRecordValue,
  type CollectionBlockPayload, type CollectionRecord, type CollectionView } from "./model";

export type ScheduleMode = "month" | "week";
const monday = { weekStartsOn: 1 as const };
export function parseScheduleDay(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const date = parseISO(iso);
  return isValid(date) && format(date, "yyyy-MM-dd") === iso ? date : null;
}
export const scheduleIso = (date: Date): string => format(date, "yyyy-MM-dd");
export function scheduleDays(anchor: string, mode: ScheduleMode): string[] {
  const date = parseScheduleDay(anchor);
  if (!date) return [];
  const first = startOfWeek(mode === "month" ? startOfMonth(date) : date, monday);
  const last = endOfWeek(mode === "month" ? endOfMonth(date) : date, monday);
  return eachDayOfInterval({ start: first, end: last }).map(scheduleIso);
}
export function moveSchedulePeriod(anchor: string, mode: ScheduleMode, step: -1 | 1) {
  const date = parseScheduleDay(anchor);
  if (!date) return anchor;
  return scheduleIso(mode === "month" ? addMonths(date, step) : addWeeks(date, step));
}
export function scheduledTaskDay(data: CollectionBlockPayload, view: CollectionView,
  record: CollectionRecord): string {
  const due = endDateField(data, view), start = dateField(data, view);
  const dueDate = record.values[due?.id ?? ""] || "";
  const startDate = record.values[start?.id ?? ""] || "";
  return parseScheduleDay(dueDate) ? dueDate : parseScheduleDay(startDate) ? startDate : "";
}
export function rescheduleTask(data: CollectionBlockPayload, view: CollectionView,
  recordId: string, day: string): CollectionBlockPayload {
  const target = parseScheduleDay(day);
  const record = data.records.find(row => row.id === recordId);
  const start = dateField(data, view), due = endDateField(data, view);
  if (!target || !record || (!start && !due)) return data;
  const previous = scheduledTaskDay(data, view, record);
  if (previous === day) return data;
  if (!previous) return setRecordValue(data, recordId, (due ?? start)!.id, day);
  const source = parseScheduleDay(previous)!;
  const offset = differenceInCalendarDays(target, source);
  let result = data;
  // Preserve task duration when both start and due are present, including across DST.
  for (const field of [start, due].filter((field, i, arr) =>
    !!field && arr.findIndex(candidate => candidate?.id === field.id) === i)) {
    if (!field) continue;
    const oldDay = record.values[field.id];
    const parsed = parseScheduleDay(oldDay ?? "");
    if (parsed) result = setRecordValue(result, recordId, field.id, scheduleIso(addDays(parsed, offset)));
  }
  return result;
}
export function createScheduledTask(data: CollectionBlockPayload, view: CollectionView,
  day: string, title: string): CollectionBlockPayload {
  const name = title.trim(), date = parseScheduleDay(day), primary = primaryField(data);
  const due = endDateField(data, view) ?? dateField(data, view);
  if (!name || !date || !primary || !due) return data;
  return addRecord(data, { [primary.id]: name, [due.id]: day });
}
export function scheduledTaskOverdue(data: CollectionBlockPayload, view: CollectionView,
  record: CollectionRecord, today: string): boolean {
  const due = endDateField(data, view);
  const date = due && parseScheduleDay(record.values[due.id] ?? "") ? record.values[due.id] : "";
  return !!date && date < today && record.progress !== "completed";
}
