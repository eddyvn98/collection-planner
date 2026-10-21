import { describe, expect, it } from "vitest";
import { createCollection } from "../src/collections/model";
import { setTaskProgress } from "../src/renderers/collectionBoardGroups";
import { completeRecurringTask } from "../src/collections/collectionRecurrence";
import { plannerBucket } from "../src/collections/collectionPlannerFields";

describe("recurring task bucket selection", () => {
  const setup = (sourceBucket: string, options = ["To do", "In progress", "Done"]) => {
    const data = createCollection();
    const bucket = plannerBucket(data)!;
    bucket.options = options;
    const status = data.fields.find(field => field.name === "Status")!;
    const due = data.fields.find(field => field.name === "Due")!;
    const name = data.fields.find(field => field.name === "Name")!;
    data.records = [{
      id: "original", values: {
        [name.id]: "Weekly sync", [bucket.id]: sourceBucket,
        [status.id]: "In progress", [due.id]: "2026-10-21",
      },
      progress: "in_progress", recurrence: "weekly",
    }];
    return { data, bucket, status, due };
  };

  it("keeps the original To do bucket despite conflicting legacy In progress Status", () => {
    const { data, bucket, status, due } = setup("To do");
    const next = setTaskProgress(data, "original", "completed");
    expect(next.records).toHaveLength(2);
    expect(next.records[0].values[bucket.id]).toBe("To do");
    expect(next.records[0].progress).toBe("completed");
    const fresh = next.records[1];
    expect(fresh.id).not.toBe("original");
    expect(fresh.progress).toBe("not_started");
    expect(fresh.values[due.id]).toBe("2026-10-28");
    expect(fresh.values[bucket.id]).toBe("To do");
    // Legacy Status remains internally compatible, but cannot determine Bucket.
    expect(fresh.values[status.id]).toBe("To do");
    expect(data.records[0].values[status.id]).toBe("In progress");
    expect(setTaskProgress(next, "original", "completed").records).toHaveLength(2);
  });

  it("moves a repeated task from Done into the first available non-Done bucket", () => {
    const { data, bucket, status, due } = setup("Done", ["Done", "Backlog", "To do"]);
    const next = setTaskProgress(data, "original", "completed");
    const fresh = next.records[1];
    expect(next.records[0].values[bucket.id]).toBe("Done");
    expect(fresh.values[bucket.id]).toBe("Backlog");
    expect(fresh.values[bucket.id]).not.toBe(fresh.values[status.id]);
    expect(fresh.values[status.id]).toBe("To do");
    expect(fresh.progress).toBe("not_started");
    expect(fresh.values[due.id]).toBe("2026-10-28");
  });

  it("does not invent a bucket if all options are Done", () => {
    const { data, bucket } = setup("Done", ["Done"]);
    expect(completeRecurringTask(data, data.records[0]).records[1].values[bucket.id]).toBe("");
  });
});
