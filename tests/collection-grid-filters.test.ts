import { describe, expect, it } from "vitest";
import { createCollection, normalizeCollection } from "../src/collections/model";
import { EMPTY_TASK_FILTERS, filterPlannerTasks, matchesPlannerTask,
  saveTaskFilterPreset, deleteTaskFilterPreset, gridFields, toggleGridField
} from "../src/collections/collectionPlannerFilters";
import { bulkUpdateGrid } from "../src/collections/collectionGridActions";
const prepare = () => {
 const data = normalizeCollection(createCollection());
 const name = data.fields[0].id, status = data.fields.find(f=>f.name==="Status")!.id;
 const bucket = data.fields.find(f=>f.name==="Bucket")!.id;
 const due = data.fields.find(f=>f.name==="Due")!.id;
 data.people = [{id:"alice",name:"Alice"}];
 data.labels = [{id:"red",name:"Urgent",color:"#f00f00"}];
 data.records = [
  {id:"a",values:{[name]:"Design API",[status]:"To do",[bucket]:"Planning",[due]:"2026-10-19"},
   progress:"in_progress",priority:"urgent",labelIds:["red"],assigneeIds:["alice"]},
  {id:"b",values:{[name]:"Ship UI",[status]:"In progress",[bucket]:"Development",[due]:"2026-10-25"},
   progress:"in_progress",priority:"low",labelIds:[],assigneeIds:[]},
  {id:"c",values:{[name]:"Docs",[status]:"Done",[bucket]:"Planning"},
   progress:"completed",priority:"medium",labelIds:[],assigneeIds:[]},
 ];
 return data;
};
describe("Planner Grid filter logic",()=>{
 it("filters by keyword in task fields or notes",()=>{
  const data=prepare(),f={...EMPTY_TASK_FILTERS,keyword:"design"};
  expect(filterPlannerTasks(data,data.records,f).map(x=>x.id)).toEqual(["a"]);
  expect(filterPlannerTasks(data,data.records,{...f,keyword:"  "})).toBe(data.records);
 });
 it("filters overdue, today, upcoming and no due date",()=>{
  const data=prepare(),run=(due:typeof EMPTY_TASK_FILTERS.due)=>
   filterPlannerTasks(data,data.records,{...EMPTY_TASK_FILTERS,due},"2026-10-21").map(x=>x.id);
  expect(run("overdue")).toEqual(["a"]);
  expect(run("next7")).toEqual(["b"]);
  expect(run("no_due")).toEqual(["c"]);
  expect(run("today")).toEqual([]);
 });
 it("combines bucket, label, owner and priority as AND",()=>{
  const data=prepare(),f={...EMPTY_TASK_FILTERS,bucket:"Planning",label:"red",assignee:"alice",priority:"urgent"};
  expect(filterPlannerTasks(data,data.records,f).map(x=>x.id)).toEqual(["a"]);
  expect(matchesPlannerTask(data,data.records[1],f)).toBe(false);
  expect(filterPlannerTasks(data,data.records,{...f,priority:"low"})).toEqual([]);
  expect(filterPlannerTasks(data,data.records,{...EMPTY_TASK_FILTERS,bucket:"__unassigned__"})).toEqual([]);
 });
 it("saves named presets with overwrite and allows deleting",()=>{
  const data=prepare(),f={...EMPTY_TASK_FILTERS,priority:"urgent"};
  const once=saveTaskFilterPreset(data," My priorities ",f);
  expect(once.savedTaskFilters?.[0].name).toBe("My priorities");
  const twice=saveTaskFilterPreset(once,"my priorities",{...f,priority:"low"});
  expect(twice.savedTaskFilters).toHaveLength(1);
  expect(twice.savedTaskFilters?.[0].filters.priority).toBe("low");
  expect(twice.savedTaskFilters?.[0].id).toBe(once.savedTaskFilters?.[0].id);
  expect(deleteTaskFilterPreset(twice,twice.savedTaskFilters![0].id).savedTaskFilters).toEqual([]);
  expect(data.savedTaskFilters).toBeUndefined();
  expect(saveTaskFilterPreset(data,"",f)).toBe(data);
 });
 it("hides columns but keeps primary title editable",()=>{
  const data=prepare(),grid=data.views.find(v=>v.kind==="table")!;
  const secondary=data.fields[1];
  const hidden=toggleGridField(data,grid.id,secondary.id);
  expect(gridFields(hidden,hidden.views.find(v=>v.id===grid.id)!)).not.toContain(secondary);
  expect(gridFields(hidden,hidden.views.find(v=>v.id===grid.id)!)[0].id).toBe(data.fields[0].id);
  expect(toggleGridField(data,grid.id,data.fields[0].id)).toBe(data);
  expect(toggleGridField(hidden,grid.id,secondary.id).views.find(v=>v.id===grid.id)?.gridHiddenFieldIds).toEqual([]);
 });
 it("bulk applies status, priority, delete without mutating input",()=>{
  const data=prepare();
  const progress=bulkUpdateGrid(data,["a","b","a"],{kind:"progress",value:"completed"});
  expect(progress.records.find(x=>x.id==="a")?.progress).toBe("completed");
  expect(progress.records.find(x=>x.id==="a")?.values[data.fields[1].id]).toBe("Done");
  expect(progress.records.find(x=>x.id==="c")).toBe(data.records[2]);
  expect(data.records[0].progress).toBe("in_progress");
  const priority=bulkUpdateGrid(data,["a","b"],{kind:"priority",value:"important"});
  expect(priority.records[1].priority).toBe("important");
  const deleted=bulkUpdateGrid(data,["a","b"],{kind:"delete"});
  expect(deleted.records.map(r=>r.id)).toEqual(["c"]);
  expect(bulkUpdateGrid(data,["a"],{kind:"delete"},true)).toBe(data);
  expect(bulkUpdateGrid(data,[],{kind:"delete"})).toBe(data);
 });
});
