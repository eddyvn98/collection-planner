import { addDays, format, parseISO } from "date-fns";
import { progressFromStatus, PRIORITIES, PROGRESS, localToday, taskDate } from "./collectionTasks";
import { selectField, type CollectionBlockPayload, type CollectionRecord } from "./model";
import { EMPTY_TASK_FILTERS, type TaskFilterState } from "./collectionPlannerFilters";
import { parseScheduleDay } from "./collectionSchedule";

export type ChartDimension = "progress" | "bucket" | "priority" | "assignee";
export interface ChartPoint { key: string; name: string; value: number }
export interface ChartSummary { late: number; dueSoon: number; unassigned: number; total: number }
const unassigned = "__unassigned__";
export function plannerBucketField(data: CollectionBlockPayload) {
  const view = data.views.find(v => v.kind === "kanban");
  return view ? selectField(data, view) : data.fields.find(f => f.type === "select" && /^bucket$/i.test(f.name));
}
export function plannerStatus(data: CollectionBlockPayload, record: CollectionRecord) {
  const field = data.fields.find(f => f.type === "select" && /^(status|progress)$/i.test(f.name.trim()));
  return record.progress ?? progressFromStatus(record.values[field?.id ?? ""] ?? "");
}
export function chartSeries(data: CollectionBlockPayload, rows: CollectionRecord[],
  dimension: ChartDimension): ChartPoint[] {
  const bucket = plannerBucketField(data);
  const fixed: ChartPoint[] = dimension === "progress"
    ? PROGRESS.map(p => ({ key: p.value, name: p.label, value: 0 }))
    : dimension === "priority" ? PRIORITIES.map(p => ({ key: p.value, name: p.label, value: 0 }))
    : dimension === "bucket" ? [
      { key: unassigned, name: "Unassigned bucket", value: 0 },
      ...(bucket?.options ?? []).map(option => ({ key: option, name: option, value: 0 })),
    ] : [
      { key: unassigned, name: "Unassigned", value: 0 },
      ...(data.people ?? []).map(person => ({ key: person.id, name: person.name, value: 0 })),
    ];
  const counts = new Map(fixed.map(row => [row.key, { ...row }]));
  const increment = (key: string, name: string) => {
    const point = counts.get(key) ?? { key, name, value: 0 };
    counts.set(key, { ...point, value: point.value + 1 });
  };
  for (const record of rows) {
    if (dimension === "progress") {
      const status = plannerStatus(data, record);
      increment(status, PROGRESS.find(p => p.value === status)?.label ?? status);
    } else if (dimension === "priority") {
      const priority = record.priority ?? "medium";
      increment(priority, PRIORITIES.find(p => p.value === priority)?.label ?? priority);
    } else if (dimension === "bucket") {
      const value = record.values[bucket?.id ?? ""] || "";
      increment(value || unassigned, value || "Unassigned bucket");
    } else {
      const known = new Set((data.people ?? []).map(p => p.id));
      const ids = [...new Set(record.assigneeIds ?? [])].filter(id => known.has(id));
      if (!ids.length) increment(unassigned, "Unassigned");
      else for (const id of ids) increment(id, data.people?.find(person => person.id === id)?.name ?? id);
    }
  }
  return [...counts.values()];
}
export function chartSummary(data: CollectionBlockPayload, rows: CollectionRecord[],
  today = localToday()): ChartSummary {
  const start = parseScheduleDay(today);
  const until = start ? format(addDays(start, 7), "yyyy-MM-dd") : today;
  let late = 0, dueSoon = 0, unassignedCount = 0;
  const known = new Set((data.people ?? []).map(person => person.id));
  for (const record of rows) {
    if (!(record.assigneeIds ?? []).some(id => known.has(id))) unassignedCount++;
    const due = taskDate(data, record, "due");
    if (!parseScheduleDay(due) || plannerStatus(data, record) === "completed") continue;
    if (due < today) late++;
    else if (due <= until) dueSoon++;
  }
  return { late, dueSoon, unassigned: unassignedCount, total: rows.length };
}
/** Chart selections use exactly the same model as the Grid filter bar. */
export function chartSelection(dimension: ChartDimension, key: string): TaskFilterState {
  return { ...EMPTY_TASK_FILTERS, [dimension]: key };
}
export function summarySelection(kind: "late" | "dueSoon" | "unassigned"): TaskFilterState {
  return kind === "late" ? { ...EMPTY_TASK_FILTERS, due: "overdue" }
    : kind === "dueSoon" ? { ...EMPTY_TASK_FILTERS, due: "next7" }
    : { ...EMPTY_TASK_FILTERS, assignee: unassigned };
}
