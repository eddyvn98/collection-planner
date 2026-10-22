import {describe,it,expect} from "vitest";
import {createCollection,recordTitle,type CollectionRecord} from "../src/collections/model";
import {matchesTaskSearch} from "../src/collections/collectionTaskSearch";
import {activeTaskReminders} from "../src/collections/collectionReminders";
import {groupAssignedTasks} from "../src/collections/collectionMyTasks";
import {applyPlanTemplate,PLAN_TEMPLATES} from "../src/collections/collectionPlanTemplates";
import {copyTask} from "../src/collections/collectionRecurrence";
describe("Phase 6A: daily Planner workflow",()=>{
 const fixture=()=>{
  const data=createCollection(),name=data.fields.find(f=>f.name==="Name")!;
  const due=data.fields.find(f=>f.name==="Due")!;
  data.people=[{id:"p",name:"Hà Thanh"}];data.labels=[{id:"l",name:"Launch",color:"#5B5FC7"}];
  data.records=[
   {id:"r1",values:{[name.id]:"Soạn báo cáo",[due.id]:"2026-10-20"},
    body:"Prepare release",labelIds:["l"],assigneeIds:["p"],progress:"not_started",
    checklist:[{id:"a",text:"Draft",done:true},{id:"b",text:"Review",done:false}]},
   {id:"r2",values:{[name.id]:"Review",[due.id]:"2026-10-22"},
    assigneeIds:["p"],progress:"not_started"},
   {id:"r3",values:{[name.id]:"Already done",[due.id]:"2026-10-18"},
    assigneeIds:["p"],progress:"completed"}];
  return data;
 };
 it("searches name, notes, labels and assigned people (without matching unrelated names)",()=>{
  const data=fixture(),row=data.records[0];
  for(const q of ["báo cáo","release","Launch","Hà Thanh"])expect(matchesTaskSearch(data,row,q)).toBe(true);
  expect(matchesTaskSearch(data,row,"unrelated")).toBe(false);
  expect(matchesTaskSearch(data,data.records[1],"launch")).toBe(false);
 });
 it("reminds due today and overdue, persists dismiss keys; completed tasks excluded",()=>{
  const data=fixture(),reminders=activeTaskReminders(data,"2026-10-22");
  expect(reminders.map(x=>x.id)).toEqual(["r1:2026-10-20","r2:2026-10-22"]);
  expect(reminders.map(x=>x.kind)).toEqual(["overdue","today"]);
  expect(activeTaskReminders(data,"2026-10-22",["r1:2026-10-20"]).map(x=>x.record.id)).toEqual(["r2"]);
 });
 it("groups my tasks by due window and excludes completed/unassigned",()=>{
  const data=fixture();
  const grouped=groupAssignedTasks(data,"p","2026-10-22");
  expect(grouped.Overdue.map(x=>x.id)).toEqual(["r1"]);
  expect(grouped.Today.map(x=>x.id)).toEqual(["r2"]);
  expect(grouped["No date"]).toHaveLength(0);
 });
 it.each(PLAN_TEMPLATES.map(x=>x.id))("creates %s plan from empty collection with stable identity",id=>{
  const data=createCollection();data.title="Our plan";data.people=[{id:"a",name:"Alice"}];
  const result=applyPlanTemplate(data,id);
  expect(result.title).toBe("Our plan");expect(result.people).toEqual(data.people);
  expect(result.records).toHaveLength(0);
  expect(result.fields.find(f=>f.name==="Bucket")?.options?.length).toBeGreaterThan(2);
  expect(applyPlanTemplate({...data,records:[{id:"r",values:{}}]},id).records).toHaveLength(1);
 });
 it("duplicate keeps labels, assignees, checklist state and appears directly after source",()=>{
  const data=fixture(),source=data.records[0],next=copyTask(data,source.id);
  expect(next.records.map(r=>r.id).slice(0,3)).toEqual(["r1",next.records[1].id,"r2"]);
  const duplicate=next.records[1];
  expect(recordTitle(next,duplicate)).toBe("Soạn báo cáo (copy)");
  expect(duplicate.id).not.toBe(source.id);
  expect(duplicate.checklist?.map(x=>x.done)).toEqual([true,false]);
  expect(duplicate.checklist?.[0].id).not.toBe(source.checklist?.[0].id);
  expect(duplicate.labelIds).toEqual(["l"]);expect(duplicate.assigneeIds).toEqual(["p"]);
  expect(duplicate.progress).toBe("not_started");
  expect(data.records).toHaveLength(3);
 });
});
