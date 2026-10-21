import { describe, expect, it } from "vitest";
import { createCollection, normalizeCollection } from "../src/collections/model";
import { PROGRESS, PRIORITIES, addTaskComment, createBoardTask, localToday,
 normalizeTaskRecord, progressFromStatus, setTaskDate, taskDate, updateTask } from "../src/collections/collectionTasks";

describe("collectionTasks migration and state", () => {
 const setup = () => {
  const data = createCollection();
  data.records = [{ id: "task-1", values: { [data.fields[0].id]: "First",
    [data.fields[1].id]: "Done" } }];
  return data;
 };
 it("maps old statuses and falls back safely", () => {
  expect(progressFromStatus("Done")).toBe("completed");
  expect(progressFromStatus(" In progress ")).toBe("in_progress");
  expect(progressFromStatus("other")).toBe("not_started");
  expect(PROGRESS).toHaveLength(3);
  expect(PRIORITIES).toHaveLength(4);
 });
 it("clones only incomplete records, retains nested values and becomes idempotent", () => {
  const data = setup(), original = data.records[0];
  const first = normalizeTaskRecord(original, data.fields);
  expect(first).not.toBe(original);
  expect(first.values).toBe(original.values);
  expect(first.progress).toBe("completed");
  expect(first.priority).toBe("medium");
  expect(first.labelIds).toEqual([]);
  expect(normalizeTaskRecord(first, data.fields)).toBe(first);
  const normalized = normalizeCollection(data);
  expect(normalized.records).not.toBe(data.records);
  expect(normalizeCollection(normalized).records).toBe(normalized.records);
 });
 it("deduplicates dirty IDs, clamps labels and preserves correct data", () => {
  const data = setup();
  const source = { ...data.records[0], progress: "completed" as const, priority: "low" as const,
   assigneeIds: ["p", "p"], labelIds: [...Array.from({ length: 27 }, (_, i) => String(i)), "0"],
   attachments: [], comments: [], activity: [] };
  const fixed = normalizeTaskRecord(source, data.fields);
  expect(fixed.assigneeIds).toEqual(["p"]);
  expect(fixed.labelIds).toHaveLength(25);
  expect(fixed.values).toBe(source.values);
  expect(normalizeTaskRecord(fixed, data.fields)).toBe(fixed);
 });
 it("does not mutate input on empty create, updates or invalid targets", () => {
  const data = setup();
  expect(createBoardTask(data, "  ")).toBe(data);
  expect(updateTask(data, "missing", { progress: "completed" })).toBe(data);
  expect(updateTask(data, "task-1", {})).toBe(data);
  expect(data.records).toHaveLength(1);
  const added = createBoardTask(data, " New ", data.fields[1].id, "To do");
  expect(added.records).toHaveLength(2);
  expect(added.records[1].values[data.fields[0].id]).toBe("New");
  expect(added.records[1].values[data.fields[1].id]).toBe("To do");
  expect(data.records).toHaveLength(1);
 });
 it("enforces labels cap, keeps IDs and writes activity on changes", () => {
  const data = setup();
  const updated = updateTask(data, "task-1",
    { labelIds: Array.from({length:28}, (_, i)=>String(i)) }, "Labeled");
  expect(updated.records[0].id).toBe("task-1");
  expect(updated.records[0].labelIds).toHaveLength(25);
  expect(updated.records[0].activity?.[0].summary).toBe("Labeled");
  expect(updateTask(updated, "task-1", { labelIds: updated.records[0].labelIds }, "Labeled")).toBe(updated);
 });
 it("adds bounded comments with timestamps", () => {
  const data = setup();
  expect(addTaskComment(data,"task-1"," ")).toBe(data);
  expect(addTaskComment(data,"task-1","x".repeat(5001))).toBe(data);
  const next = addTaskComment(data,"task-1"," Hello ");
  expect(next.records[0].comments?.[0].text).toBe("Hello");
  expect(next.records[0].activity).toHaveLength(1);
  expect(data.records[0].comments).toBeUndefined();
 });
 it("handles start/due dates through existing columns without changing identity", () => {
  const data = setup();
  const next = setTaskDate(data,"task-1","due","2026-10-29");
  expect(taskDate(next,next.records[0],"due")).toBe("2026-10-29");
  expect(next.records[0].id).toBe("task-1");
  expect(setTaskDate(data,"task-1","due","not-a-date")).toBe(data);
  expect(data.records[0].values[data.fields[3].id]).toBeUndefined();
 });
 it("compares ISO local calendar dates", () => {
  expect(localToday(new Date(2026,0,9))).toBe("2026-01-09");
 });
});
