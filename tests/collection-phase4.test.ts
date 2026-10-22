import { describe, expect, it } from "vitest";
import { createCollection, normalizeCollection } from "../src/collections/model";
import { initialHistory, historyCommit, historyUndo, historyRedo } from "../src/collections/collectionHistory";
import { copyTask, completeRecurringTask, moveTaskToBucket, setRecurrence } from "../src/collections/collectionRecurrence";
import { setTaskProgress } from "../src/renderers/collectionBoardGroups";
import { gridFields } from "../src/collections/collectionPlannerFilters";
import { visiblePlannerFields } from "../src/collections/collectionPlannerFields";
import { chartPointColor } from "../src/collections/collectionChartColors";
import { gridTaskColumns } from "../src/renderers/collectionGridTaskColumns";
describe("Phase 4 — history and task actions", () => {
 const fixture = () => {
  const data = normalizeCollection(createCollection());
  const start=data.fields.find(f=>f.name==="Start")!.id, due=data.fields.find(f=>f.name==="Due")!.id;
  const bucket=data.fields.find(f=>f.name==="Bucket")!.id;
  data.records=[{id:"a",values:{[data.fields[0].id]:"Plan sprint",[start]:"2026-01-30",
    [due]:"2026-01-31",[bucket]:"To do"},progress:"in_progress",priority:"medium",
    checklist:[{id:"check",text:"Review",done:true}]}];
  return {data,bucket,start,due};
 };
 it("undo/redo restores complete immutable snapshots, clears redo after divergent commit",()=>{
  const {data}=fixture(),updated={...data,title:"Changed"};
  const first=historyCommit(initialHistory(data),updated);
  expect(first.current.title).toBe("Changed");
  expect(historyUndo(first).current).toBe(data);
  expect(historyRedo(historyUndo(first)).current).toBe(updated);
  expect(historyUndo(initialHistory(data))).toEqual(initialHistory(data));
  const diverged=historyCommit(historyUndo(first),{...data,title:"New path"});
  expect(diverged.future).toEqual([]);
  expect(historyRedo(diverged)).toBe(diverged);
  expect(historyCommit(first,first.current)).toBe(first);
 });
 it("duplicate preserves checklist and state with new IDs, isolates mutable collections",()=>{
  const {data}=fixture();
  const result=copyTask(data,"a");
  const original=data.records[0],copy=result.records[1];
  expect(copy.id).not.toBe(original.id);
  expect(copy.values[data.fields[0].id]).toBe("Plan sprint (copy)");
  expect(copy.progress).toBe("in_progress");
  expect(copy.checklist?.[0].done).toBe(true);
  expect(copy.checklist?.[0].id).not.toBe("check");
  expect(copyTask(data,"missing")).toBe(data);
  expect(data.records).toHaveLength(1);
 });
 it("moves task to legal bucket, rejects unknown bucket",()=>{
  const {data,bucket}=fixture();
  const changed=moveTaskToBucket(data,"a","Done");
  expect(changed.records[0].values[bucket]).toBe("Done");
  expect(changed.records[0].progress).toBe("in_progress");
  expect(moveTaskToBucket(data,"a","missing")).toBe(data);
 });
 it("weekly recurrence generates exactly one next task when completing",()=>{
  const {data,due,start}=fixture(),configured=setRecurrence(data,"a","weekly");
  const once=setTaskProgress(configured,"a","completed");
  expect(once.records).toHaveLength(2);
  expect(once.records[0].progress).toBe("completed");
  expect(once.records[1].progress).toBe("not_started");
  expect(once.records[1].values[start]).toBe("2026-02-06");
  expect(once.records[1].values[due]).toBe("2026-02-07");
  expect(once.records[1].checklist?.[0].done).toBe(false);
  expect(setTaskProgress(once,"a","completed").records).toHaveLength(2);
  expect(configured.records).toHaveLength(1);
 });
 it("monthly recurrence clamps leap and non-leap transitions",()=>{
  const {data,due,start}=fixture();
  const configured=setRecurrence(data,"a","monthly");
  const next=completeRecurringTask(configured,configured.records[0]);
  expect(next.records[1].values[due]).toBe("2026-02-28");
  expect(next.records[1].values[start]).toBe("2026-02-28");
  const daily=setRecurrence(data,"a","daily");
  expect(completeRecurringTask(daily,daily.records[0]).records[1].values[due]).toBe("2026-02-01");
  expect(completeRecurringTask(data,data.records[0])).toBe(data);
 });
 it("uses identical colors for the full legend and nonzero donut slices",()=>{
  const points=[{key:"not_started",value:0},{key:"in_progress",value:7},{key:"completed",value:2}];
  const active=points.filter(p=>p.value>0);
  expect(chartPointColor(points,active[0])).toBe(chartPointColor(points,points[1]));
  expect(chartPointColor(points,active[0])).not.toBe(chartPointColor(points,points[0]));
  expect(chartPointColor(points,active[1])).toBe(chartPointColor(points,points[2]));
 });
 it("keeps Status internal and supplies four default Grid task columns",()=>{
  const {data}=fixture();
  expect(visiblePlannerFields(data).map(f=>f.name)).not.toContain("Status");
  const view=data.views.find(v=>v.kind==="table")!;
  expect(gridFields(data,view).some(f=>f.name==="Status")).toBe(false);
  expect(gridTaskColumns(()=>data,()=>{},false).map(c=>c.id)).toEqual(["__progress","__assignee","__priority","__labels"]);
 });
});
