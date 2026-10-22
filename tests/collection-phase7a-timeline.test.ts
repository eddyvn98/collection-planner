import {describe,it,expect} from "vitest";
import {createCollection,addView} from "../src/collections/model";
import {addUtcDays,timelineLayout} from "../src/renderers/collectionTimelineDates";
import {moveTimelineBranch,resizeTimelineTask,makeTimelineTask,
 reorderTimelineBranch,dayNumber,timelineWindow,TIMELINE_ZOOM} from "../src/renderers/collectionTimelineActions";
import {snapTimelineDays} from "../src/renderers/CollectionGanttBar";
import {setCollectionDependencies} from "../src/collections/collectionDependencies";
function fixture(){
 const data=createCollection(),name=data.fields.find(f=>f.type==="text")!.id;
 const start=data.fields.find(f=>f.name==="Start")!.id;
 const end=data.fields.find(f=>f.name==="Due")!.id;
 data.records=[
  {id:"a",values:{[name]:"Parent",[start]:"2026-10-20",[end]:"2026-10-23"}},
  {id:"b",parentId:"a",values:{[name]:"Child",[start]:"2026-10-21",[end]:"2026-10-22"}},
  {id:"c",values:{[name]:"Other",[start]:"2026-10-24",[end]:"2026-10-27"}},
 ];
 return {data,start,end};
}
describe("Phase 7A Timeline",()=>{
 it("keeps anchored range independent of data edits",()=>{
  const {data,start,end}=fixture(),initial=timelineLayout(data.records,start,end);
  const anchor=timelineWindow(initial.from,"day");
  const moved=moveTimelineBranch(data,"a",6,start,end);
  expect(timelineLayout(moved.records,start,end).from).not.toBe(initial.from);
  expect(anchor.from).toBe("2026-10-20");
  expect(anchor.to).toBe(addUtcDays("2026-10-20",TIMELINE_ZOOM.day.days-1));
  expect(timelineWindow(anchor.from,"week").days).toBe(90);
  expect(timelineWindow(anchor.from,"month").days).toBe(180);
 });
 it("moves entire subtree dates by calendar days and preserves originals",()=>{
  const {data,start,end}=fixture();
  const next=moveTimelineBranch(data,"a",7,start,end);
  expect(next.records[0].values[start]).toBe("2026-10-27");
  expect(next.records[0].values[end]).toBe("2026-10-30");
  expect(next.records[1].values[start]).toBe("2026-10-28");
  expect(next.records[2].values[start]).toBe("2026-10-24");
  expect(data.records[1].values[start]).toBe("2026-10-21");
  expect(moveTimelineBranch(data,"a",0,start,end)).toBe(data);
 });
 it("resizes left and right edges, rejecting inverted dates",()=>{
  const {data,start,end}=fixture();
  const left=resizeTimelineTask(data,"a","left",2,start,end);
  expect(left.records[0].values[start]).toBe("2026-10-22");
  const right=resizeTimelineTask(left,"a","right",1,start,end);
  expect(right.records[0].values[end]).toBe("2026-10-24");
  expect(resizeTimelineTask(data,"a","left",10,start,end)).toBe(data);
  expect(resizeTimelineTask(data,"a","right",-10,start,end)).toBe(data);
 });
 it("creates a dated record on an empty lane",()=>{
  const {data,start,end}=fixture();
  const next=makeTimelineTask(data,start,end,"2026-10-28","2026-11-02","From drag");
  expect(next.records).toHaveLength(4);
  const child=next.records.at(-1)!;
  expect(child.values[start]).toBe("2026-10-28");
  expect(child.values[end]).toBe("2026-11-02");
  expect(makeTimelineTask(data,start,end,"2026-11-02","2026-10-28")).toBe(data);
 });
 it("snaps Shift drags to weeks and ordinary drags to single days",()=>{
  expect(snapTimelineDays(5.7,true)).toBe(7);
  expect(snapTimelineDays(8,true)).toBe(7);
  expect(snapTimelineDays(-5,true)).toBe(-7);
  expect(snapTimelineDays(2.7,false)).toBe(3);
  expect(dayNumber("2026-11-01")-dayNumber("2026-10-31")).toBe(1);
 });
 it("reorders a full branch and preserves existing dependency IDs",()=>{
  const {data}=fixture();let next=setCollectionDependencies(data,"c",["a"]);
  next=reorderTimelineBranch(next,"a","c");
  expect(next.records.map(row=>row.id)).toEqual(["a","b","c"]);
  expect(next.records.find(row=>row.id==="c")?.dependsOn).toEqual(["a"]);
  expect(reorderTimelineBranch(data,"a","b")).toBe(data);
 });
 it("new advanced views become the active view",()=>{
  let data=createCollection();
  for(const kind of ["timeline","mindmap","gallery","form"] as const){
   data=addView(data,kind);
   expect(data.views.at(-1)!.id).toBe(data.activeViewId);
   expect(data.views.at(-1)!.kind).toBe(kind);
  }
 });
});
