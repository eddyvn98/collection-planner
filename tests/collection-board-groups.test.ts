import { describe,expect,it } from "vitest";
import { createCollection } from "../src/collections/model";
import { boardGroups, cardDragId, createGroupedTask, moveGroupedTask, parseCardDragId,
 setTaskProgress, taskGroupKeys } from "../src/renderers/collectionBoardGroups";
describe("Planner Board grouping",()=>{
 const setup=()=>{
  const data=createCollection(),name=data.fields[0].id,status=data.fields[1].id,due=data.fields[3].id;
  data.people=[{id:"p1",name:"Ada"},{id:"p2",name:"Ben"}];
  data.labels=[{id:"l1",name:"Blocked",color:"#ff0000"},{id:"l2",name:"Feature",color:"#0000ff"}];
  data.records=[
   {id:"a",values:{[name]:"A",[status]:"To do",[due]:"2026-10-20"},
    progress:"not_started",priority:"medium",assigneeIds:["p1","p2"],labelIds:["l1","l2"]},
   {id:"b",values:{[name]:"B",[status]:"Done"},progress:"completed",priority:"low"},
  ];
  return {data,field:data.fields[1]};
 };
 it("creates all grouping columns including unassigned and no due date",()=>{
  const {data,field}=setup();
  expect(boardGroups(data,data.records,"bucket",field).map(g=>g.title)).toContain("To do");
  expect(boardGroups(data,data.records,"progress",field).map(g=>g.title)).toEqual(
   ["Not started","In progress","Completed"]);
  expect(boardGroups(data,data.records,"priority",field)).toHaveLength(4);
  expect(boardGroups(data,data.records,"assignee",field)).toHaveLength(3);
  expect(boardGroups(data,data.records,"label",field)).toHaveLength(3);
  expect(boardGroups(data,data.records,"due",field,"2026-10-21").find(g=>g.key==="due:late")?.rows[0].id).toBe("a");
  expect(taskGroupKeys(data,data.records[1],"due",field,"2026-10-21")).toEqual(["due:none"]);
 });
 it("shows a multi-assigned task in multiple columns without duplicate drag IDs",()=>{
  const {data,field}=setup();
  const groups=boardGroups(data,data.records,"assignee",field);
  expect(groups.find(g=>g.key==="assignee:p1")?.rows.map(r=>r.id)).toContain("a");
  expect(groups.find(g=>g.key==="assignee:p2")?.rows.map(r=>r.id)).toContain("a");
  const first=cardDragId("a","assignee:p1"),second=cardDragId("a","assignee:p2");
  expect(first).not.toBe(second);
  expect(parseCardDragId(first)).toEqual(["a","assignee:p1"]);
  expect(parseCardDragId("task:invalid")).toBeNull();
 });
 it("moves assignee and labels without losing unrelated values",()=>{
  const {data,field}=setup();
  const owner=moveGroupedTask(data,"a","assignee:p1","assignee:p2","assignee",field);
  expect(owner.records[0].assigneeIds).toEqual(["p2"]);
  expect(owner.records[0].values).toBe(data.records[0].values);
  const label=moveGroupedTask(data,"a","label:l1","label:l2","label",field);
  expect(label.records[0].labelIds).toEqual(["l2"]);
  expect(data.records[0].labelIds).toEqual(["l1","l2"]);
 });
 it("reschedules tasks deterministically and rejects invalid targets",()=>{
  const {data,field}=setup();
  const moved=moveGroupedTask(data,"a","due:late","due:soon","due",field,undefined,false,"2026-10-21");
  expect(moved.records[0].values[data.fields[3].id]).toBe("2026-10-24");
  expect(moveGroupedTask(data,"a","due:late","due:unknown","due",field)).toBe(data);
  expect(moveGroupedTask(data,"a","due:late","due:soon","due",field,undefined,true)).toBe(data);
 });
 it("quick-add applies derived group and keeps task fields",()=>{
  const {data,field}=setup();
  const added=createGroupedTask(data,"  New  ","priority:urgent","priority",field);
  expect(added.records.at(-1)?.priority).toBe("urgent");
  expect(added.records.at(-1)?.values[data.fields[0].id]).toBe("New");
  expect(createGroupedTask(data," ","priority:urgent","priority",field)).toBe(data);
 });
 it("syncs progress with existing Status where available",()=>{
  const {data}=setup();
  const updated=setTaskProgress(data,"a","completed");
  expect(updated.records[0].progress).toBe("completed");
  expect(updated.records[0].values[data.fields[1].id]).toBe("Done");
  expect(data.records[0].progress).toBe("not_started");
 });
});
