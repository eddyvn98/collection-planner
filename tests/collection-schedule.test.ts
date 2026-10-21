import { describe, expect, it } from "vitest";
import { createCollection, normalizeCollection } from "../src/collections/model";
import { createScheduledTask, moveSchedulePeriod, parseScheduleDay, rescheduleTask,
  scheduleDays, scheduledTaskDay, scheduledTaskOverdue } from "../src/collections/collectionSchedule";

describe("Planner schedule date logic", () => {
 const setup = () => {
  const data = createCollection();
  const calendar = data.views.find(v => v.kind === "calendar")!;
  const [start, due] = data.fields.filter(field => field.type === "date");
  data.records = [{ id: "task-1", values: {
    [data.fields[0].id]: "Build UI", [start.id]: "2026-10-19", [due.id]: "2026-10-21" },
    progress: "in_progress" }];
  return { data, calendar, start, due };
 };
 it("rejects invalid days and generates Monday-first month and week grids", () => {
  expect(parseScheduleDay("2026-02-30")).toBeNull();
  expect(parseScheduleDay("2024-02-29")).not.toBeNull();
  const month = scheduleDays("2026-10-21", "month");
  expect(month[0]).toBe("2026-09-28");
  expect(month).toContain("2026-10-31");
  expect(month.length % 7).toBe(0);
  expect(scheduleDays("2027-01-01", "week")).toEqual([
    "2026-12-28", "2026-12-29", "2026-12-30", "2026-12-31",
    "2027-01-01", "2027-01-02", "2027-01-03",
  ]);
  expect(scheduleDays("bad", "month")).toEqual([]);
 });
 it("navigates month/week with leap-year clamping", () => {
  expect(moveSchedulePeriod("2024-01-31", "month", 1)).toBe("2024-02-29");
  expect(moveSchedulePeriod("2026-12-31", "week", 1)).toBe("2027-01-07");
  expect(moveSchedulePeriod("invalid", "week", 1)).toBe("invalid");
 });
 it("moves both dates by the same offset while retaining duration and record IDs", () => {
  const { data, calendar, start, due } = setup();
  const moved = rescheduleTask(data, calendar, "task-1", "2026-11-04");
  expect(moved.records[0].values[start.id]).toBe("2026-11-02");
  expect(moved.records[0].values[due.id]).toBe("2026-11-04");
  expect(moved.records[0].id).toBe("task-1");
  expect(data.records[0].values[due.id]).toBe("2026-10-21");
  expect(rescheduleTask(data, calendar, "task-1", "2026-10-21")).toBe(data);
 });
 it("creates by day and accepts undated task drag onto a valid date", () => {
  const { data, calendar, due } = setup();
  const added = createScheduledTask(data, calendar, "2026-10-24", " QA test ");
  expect(added.records.at(-1)?.values[due.id]).toBe("2026-10-24");
  expect(added.records.at(-1)?.values[data.fields[0].id]).toBe("QA test");
  expect(createScheduledTask(data, calendar, "wrong", "Title")).toBe(data);
  expect(createScheduledTask(data, calendar, "2026-10-24", " ")).toBe(data);
  const undated = { ...data, records: [...data.records,
    { id: "undated", values: { [data.fields[0].id]: "Draft" } }] };
  const moved = rescheduleTask(undated, calendar, "undated", "2026-10-26");
  expect(scheduledTaskDay(moved, calendar, moved.records[1])).toBe("2026-10-26");
  expect(rescheduleTask(data, calendar, "missing", "2026-10-24")).toBe(data);
  expect(rescheduleTask(data, calendar, "task-1", "2026-13-01")).toBe(data);
 });
 it("marks due-before-today tasks late except completed tasks", () => {
  const { data, calendar, due } = setup();
  expect(scheduledTaskOverdue(data, calendar, data.records[0], "2026-10-22")).toBe(true);
  expect(scheduledTaskOverdue(data, calendar, data.records[0], "2026-10-21")).toBe(false);
  expect(scheduledTaskOverdue(data, calendar, { ...data.records[0], progress: "completed" }, "2026-10-22")).toBe(false);
  expect(scheduledTaskOverdue(data, calendar, { ...data.records[0],
    values: { ...data.records[0].values, [due.id]: "" } }, "2026-10-22")).toBe(false);
 });
 it("migrates a Charts tab once without touching normalized records", () => {
  const { data } = setup();
  const legacy = { ...data, views: data.views.filter(v => v.kind !== "charts") };
  const migrated = normalizeCollection(legacy);
  expect(migrated.views.filter(v => v.kind === "charts")).toHaveLength(1);
  expect(normalizeCollection(migrated).views).toEqual(migrated.views);
  expect(normalizeCollection(migrated).records).toBe(migrated.records);
 });
});
