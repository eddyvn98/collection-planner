import { describe, expect, it } from "vitest";
import { createCollection, normalizeCollection } from "../src/collections/model";
import { isTaskOverdue, taskAssignees, addTaskComment, updateTask } from "../src/collections/collectionTasks";
import { addBucket, renameBucket, deleteBucket, moveBucket } from "../src/renderers/collectionBoardActions";
import { boardGroups, createGroupedTask } from "../src/renderers/collectionBoardGroups";
describe("Phase 1 acceptance logic", () => {
  const setup = () => {
    const data = normalizeCollection(createCollection());
    const bucket = data.fields.find(f => f.name === "Bucket")!;
    const title = data.fields[0];
    data.people = [{ id: "ada", name: "Ada Lovelace" }, { id: "lin", name: "Lin Chen" }];
    data.records = [{ id: "task", values: { [title.id]: "Build", [bucket.id]: "To do" },
      assigneeIds: ["ada", "lin"], progress: "in_progress", priority: "medium" }];
    return { data, bucket };
  };
  it("quick-add places a titled task in the chosen bucket above existing cards", () => {
    const { data, bucket } = setup();
    const next = createGroupedTask(data, " Add task ", "bucket:To do", "bucket", bucket);
    const cards = boardGroups(next, next.records, "bucket", bucket).find(g => g.title === "To do")!.rows;
    expect(cards[0].values[data.fields[0].id]).toBe("Add task");
    expect(cards[0].id).not.toBe("task");
    expect(data.records).toHaveLength(1);
  });
  it("supports safe inline rename, move and delete while retaining task ID", () => {
    const { data, bucket } = setup();
    const created = addBucket(data, bucket.id, "Review");
    expect(created.fields.find(f => f.id === bucket.id)?.options).toContain("Review");
    const renamed = renameBucket(created, bucket.id, "To do", "Backlog");
    expect(renamed.records[0].id).toBe("task");
    expect(renamed.records[0].values[bucket.id]).toBe("Backlog");
    const moved = moveBucket(renamed, bucket.id, "Backlog", 1);
    expect(moved.fields.find(f => f.id === bucket.id)?.options?.indexOf("Backlog")).toBe(1);
    const removed = deleteBucket(moved, bucket.id, "Backlog");
    expect(removed.records[0].values[bucket.id]).toBe("");
    expect(removed.records[0].id).toBe("task");
  });
  it("projects assignees into avatars without duplicating people", () => {
    const { data } = setup();
    expect(taskAssignees(data, data.records[0]).map(person => person.name)).toEqual(["Ada Lovelace", "Lin Chen"]);
    expect(taskAssignees(data, { ...data.records[0], assigneeIds: ["ada", "ada"] })).toHaveLength(1);
  });
  it("marks unfinished tasks overdue by local day, not time of day", () => {
    const { data } = setup();
    const due = data.fields.find(f => f.name === "Due")!;
    const record = { ...data.records[0], values: { ...data.records[0].values, [due.id]: "2026-10-20" } };
    expect(isTaskOverdue(data, record, "2026-10-21")).toBe(true);
    expect(isTaskOverdue(data, record, "2026-10-20")).toBe(false);
    expect(isTaskOverdue(data, { ...record, progress: "completed" }, "2026-10-21")).toBe(false);
    expect(isTaskOverdue(data, data.records[0], "2026-10-21")).toBe(false);
  });
  it("persists notes, linked attachments, comments and activity independently", () => {
    const { data } = setup();
    const record = data.records[0];
    const edited = updateTask(data, record.id, { body: "Scope and requirements",
      attachments: [{ id: "link", name: "Specs", url: "https://example.com" }] }, "Added notes");
    const commented = addTaskComment(edited, record.id, "Needs review");
    expect(commented.records[0].body).toBe("Scope and requirements");
    expect(commented.records[0].attachments?.[0].name).toBe("Specs");
    expect(commented.records[0].comments?.[0].text).toBe("Needs review");
    expect(commented.records[0].activity).toHaveLength(2);
    expect(record.attachments).toBeUndefined();
  });
});
