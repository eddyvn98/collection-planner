import { describe, expect, it } from "vitest";
import { createCollection, normalizeCollection } from "../src/collections/model";
import { addBucket, renameBucket, deleteBucket, moveBucket, moveBoardCard, orderedCards } from "../src/renderers/collectionBoardActions";
import { createBoardTask, addTaskComment, updateTask } from "../src/collections/collectionTasks";
describe("Planner phase 1 data", () => {
 const seed = () => {
  const data = createCollection();
  data.records = [
   { id: "a", values: { [data.fields[0].id]: "First", [data.fields[1].id]: "To do" } },
   { id: "b", values: { [data.fields[0].id]: "Second", [data.fields[1].id]: "To do" } },
  ];
  return data;
 };
 it("migrates legacy records without losing identifiers and fields", () => {
  const data = seed(), next = normalizeCollection(data);
  expect(next.records.map(r => r.id)).toEqual(["a", "b"]);
  expect(next.records[0].progress).toBe("not_started");
  expect(next.records[0].priority).toBe("medium");
  expect(next.records[0].values).toEqual(data.records[0].values);
  expect(next.people).toEqual([]);
 });
 it("manages bucket creation, rename, reorder and deletion", () => {
  const data = seed(), field = data.fields[1].id;
  const added = addBucket(data, field, "Review");
  expect(added.fields[1].options).toContain("Review");
  expect(addBucket(added, field, "review")).toBe(added);
  const renamed = renameBucket(added, field, "To do", "Backlog");
  expect(renamed.records[0].values[field]).toBe("Backlog");
  const moved = moveBucket(renamed, field, "Review", -1);
  expect(moved.fields[1].options?.[2]).toBe("Review");
  const deleted = deleteBucket(renamed, field, "Backlog");
  expect(deleted.records[0].values[field]).toBe("");
  expect(data.records[0].values[field]).toBe("To do");
 });
 it("reorders cards and moves cards into a new bucket", () => {
  const data = seed(), field = data.fields[1].id;
  const reordered = moveBoardCard(data, "b", field, "To do", "a");
  expect(orderedCards(reordered, reordered.records).map(r => r.id)).toEqual(["b", "a"]);
  const moved = moveBoardCard(data, "a", field, "Done");
  expect(moved.records[0].values[field]).toBe("Done");
  expect(moveBoardCard(data, "a", field, "Missing")).toBe(data);
  expect(moveBoardCard(data, "a", field, "Done", undefined, true)).toBe(data);
 });
 it("quick adds and enforces label cap", () => {
  const data = seed(), field = data.fields[1].id;
  const added = createBoardTask(data, " New task ", field, "To do");
  expect(added.records.at(-1)?.values[data.fields[0].id]).toBe("New task");
  const updated = updateTask(added, "a", { labelIds: Array.from({ length: 30 }, (_, i) => String(i)) });
  expect(updated.records[0].labelIds).toHaveLength(25);
  expect(addTaskComment(updated, "a", "Hello").records[0].comments?.[0].text).toBe("Hello");
 });
});
