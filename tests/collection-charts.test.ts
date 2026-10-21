import { describe, expect, it } from "vitest";
import { createCollection } from "../src/collections/model";
import { chartSelection, chartSeries, chartSummary, summarySelection }
  from "../src/collections/collectionCharts";
import { filterPlannerTasks } from "../src/collections/collectionPlannerFilters";
describe("Planner Charts aggregate and click drilldown", () => {
 const setup=()=>{
  const data=createCollection();
  const status=data.fields.find(f=>f.name==="Status")!;
  const due=data.fields.find(f=>f.name==="Due")!;
  const bucket=data.fields.find(f=>f.name==="Bucket")!;
  data.people=[{id:"a",name:"Alice"},{id:"b",name:"Bob"}];
  data.records=[
   {id:"late",values:{[status.id]:"In progress",[due.id]:"2026-10-20",[bucket.id]:"To do"},
    progress:"in_progress",priority:"urgent",assigneeIds:["a","b"]},
   {id:"soon",values:{[status.id]:"To do",[due.id]:"2026-10-25",[bucket.id]:"To do"},
    progress:"not_started",priority:"important",assigneeIds:["a"]},
   {id:"done",values:{[status.id]:"Done",[due.id]:"2026-10-01",[bucket.id]:"Done"},
    progress:"completed",priority:"low"},
   {id:"empty",values:{[status.id]:"To do"},
    progress:"not_started",priority:"medium",assigneeIds:["deleted-id"]},
  ];
  return data;
 };
 const count=(points:ReturnType<typeof chartSeries>,key:string)=>
  points.find(point=>point.key===key)?.value;
 it("counts status, bucket and priority with known and unassigned categories",()=>{
  const data=setup();
  expect(count(chartSeries(data,data.records,"progress"),"not_started")).toBe(2);
  expect(count(chartSeries(data,data.records,"progress"),"completed")).toBe(1);
  expect(count(chartSeries(data,data.records,"bucket"),"To do")).toBe(2);
  expect(count(chartSeries(data,data.records,"bucket"),"__unassigned__")).toBe(1);
  expect(count(chartSeries(data,data.records,"priority"),"urgent")).toBe(1);
 });
 it("counts each multi-assignee task per person and unmatched IDs as unassigned",()=>{
  const data=setup(),series=chartSeries(data,data.records,"assignee");
  expect(count(series,"a")).toBe(2);
  expect(count(series,"b")).toBe(1);
  expect(count(series,"__unassigned__")).toBe(2);
  expect(series.reduce((sum,p)=>sum+p.value,0)).toBe(5);
 });
 it("late excludes completed tasks and due soon covers the next 7 days inclusive",()=>{
  const data=setup(),s=chartSummary(data,data.records,"2026-10-21");
  expect(s).toEqual({late:1,dueSoon:1,unassigned:2,total:4});
  expect(chartSummary(data,[],"2026-10-21")).toEqual({late:0,dueSoon:0,unassigned:0,total:0});
 });
 it("click selections filter Grid using the same filter model",()=>{
  const data=setup(),pick=(kind:Parameters<typeof chartSelection>[0],key:string)=>
   filterPlannerTasks(data,data.records,chartSelection(kind,key),"2026-10-21").map(r=>r.id);
  expect(pick("progress","completed")).toEqual(["done"]);
  expect(pick("bucket","To do")).toEqual(["late","soon"]);
  expect(pick("priority","urgent")).toEqual(["late"]);
  expect(pick("assignee","a")).toEqual(["late","soon"]);
  expect(pick("assignee","__unassigned__")).toEqual(["done","empty"]);
  expect(filterPlannerTasks(data,data.records,summarySelection("late"),"2026-10-21").map(r=>r.id)).toEqual(["late"]);
  expect(filterPlannerTasks(data,data.records,summarySelection("dueSoon"),"2026-10-21").map(r=>r.id)).toEqual(["soon"]);
  expect(filterPlannerTasks(data,data.records,summarySelection("unassigned"),"2026-10-21").map(r=>r.id)).toEqual(["done","empty"]);
 });
});
