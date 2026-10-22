import {describe,expect,it} from "vitest";
import {createCollection,normalizeCollection,setParent,deleteRecord,visibleRecords,
 type CollectionRecord} from "../src/collections/model";
import {buildTaskTree,MAX_TASK_DEPTH,MAX_VISIBLE_TREE_NODES,canSetTaskParent,
 descendantCounts,taskBranch} from "../src/collections/collectionTaskTree";
import {setTaskProgress} from "../src/renderers/collectionBoardGroups";
import {copyTask,moveTaskToBucket} from "../src/collections/collectionRecurrence";
import {validCollectionDependencies,setCollectionDependencies} from "../src/collections/collectionDependencies";
import {importCollectionJson,exportCollectionCsv,importCollectionCsv} from "../src/collections/io";
import {activeTaskReminders} from "../src/collections/collectionReminders";
import {groupAssignedTasks} from "../src/collections/collectionMyTasks";
import {chartSeries} from "../src/collections/collectionCharts";
import {searchTaskTree} from "../src/collections/collectionTaskSearch";
import {plannerBucket} from "../src/collections/collectionPlannerFields";
import {rescheduleTask} from "../src/collections/collectionSchedule";

function fixture() {
 const data=createCollection(),title=data.fields[0].id;
 const due=data.fields.find(f=>f.name==="Due")!.id;
 const start=data.fields.find(f=>f.name==="Start")!.id;
 data.people=[{id:"me",name:"Me"}];
 const task=(id:string,parentId:string|null=null,progress:CollectionRecord["progress"]="not_started"):CollectionRecord=>
  ({id,parentId,progress,values:{[title]:id,[start]:"2026-10-20",[due]:"2026-10-21"},assigneeIds:["me"]});
 data.records=[task("root"),task("a","root"),task("b","a"),task("sibling","root")];
 return {data,title,due,start};
}
describe("Phase 6C — multi-level sub-task model",()=>{
 it("builds tree O(n), counts all descendants and enforces six total levels",()=>{
  const {data}=fixture();
  const tree=buildTaskTree(data.records);
  expect(taskBranch(tree,"root").map(x=>x.id)).toEqual(["root","a","b","sibling"]);
  expect(tree.depth.get("b")).toBe(3);
  expect(descendantCounts(data.records).get("root")).toEqual({done:0,total:3});
  let next=data;
  next.records.push({id:"c",parentId:"b",values:{},progress:"not_started"});
  next.records.push({id:"d",parentId:"c",values:{},progress:"not_started"});
  next.records.push({id:"e",parentId:"d",values:{},progress:"not_started"});
  expect(buildTaskTree(next.records).depth.get("e")).toBe(MAX_TASK_DEPTH);
  expect(canSetTaskParent(next.records,"root","b")).toBe(false);
  expect(setParent(next,"root","b")).toBe(next);
  const extra={id:"f",values:{},progress:"not_started" as const};
  const full={...next,records:[...next.records,extra]};
  expect(setParent(full,"f","e")).toBe(full);
  expect(setParent(full,"f","sibling")).not.toBe(full);
 });
 it("derives parent progress recursively and reopens it on unfinished descendant",()=>{
  const {data}=fixture();
  let next=setTaskProgress(data,"b","completed");
  expect(next.records.find(x=>x.id==="a")?.progress).toBe("completed");
  expect(next.records.find(x=>x.id==="root")?.progress).toBe("in_progress");
  next=setTaskProgress(next,"sibling","completed");
  expect(next.records.find(x=>x.id==="root")?.progress).toBe("completed");
  next=setTaskProgress(next,"b","in_progress");
  expect(next.records.find(x=>x.id==="a")?.progress).toBe("in_progress");
  expect(next.records.find(x=>x.id==="root")?.progress).toBe("in_progress");
  next=setTaskProgress(next,"root","completed");
  expect(next.records.filter(x=>x.progress==="completed")).toHaveLength(4);
  expect(descendantCounts(next.records).get("root")).toEqual({done:3,total:3});
 });
 it("migrates orphan, cycle and overdeep localStorage non-destructively",()=>{
  const {data}=fixture();
  data.records.push({id:"orphan",parentId:"missing",values:{}});
  data.records.push({id:"u",parentId:"v",values:{}},{id:"v",parentId:"u",values:{}});
  const normalized=normalizeCollection(data);
  expect(normalized.records).toHaveLength(7);
  expect(normalized.records.find(x=>x.id==="orphan")?.parentId).toBeNull();
  expect(normalized.records.find(x=>x.id==="u")?.parentId).toBeNull();
  expect(normalized.records.find(x=>x.id==="v")?.parentId).toBeNull();
  const old=fixture().data;
  expect(normalizeCollection(old).records.map(x=>x.id)).toEqual(old.records.map(x=>x.id));
 });
 it("rejects malformed JSON parent links, height and ancestor dependency",()=>{
  const {data}=fixture();
  expect(()=>importCollectionJson(JSON.stringify({...data,records:[
   {...data.records[1],parentId:"missing"},...data.records.slice(2)]}))).toThrow(/parent reference/i);
  expect(()=>importCollectionJson(JSON.stringify({...data,records:[
   {...data.records[0],dependsOn:["b"]},...data.records.slice(1)]}))).toThrow(/ancestor|descendant/i);
  const depth=Array.from({length:7},(_,i)=>({id:"level"+i,values:{},parentId:i?"level"+(i-1):null}));
  expect(()=>importCollectionJson(JSON.stringify({...data,records:depth}))).toThrow(/6 levels/i);
  expect(validCollectionDependencies(data,"root",["b"])).toBe(false);
  expect(validCollectionDependencies(data,"b",["root"])).toBe(false);
  expect(setCollectionDependencies(data,"root",["b"])).toBe(data);
 });
 it("copies entire branch, remapping child parents, IDs and internal sibling dependencies",()=>{
  const {data,title}=fixture();
  data.records[3].dependsOn=["a"];
  const next=copyTask(data,"root"),copied=next.records.filter(x=>!data.records.some(old=>old.id===x.id));
  expect(copied).toHaveLength(4);
  expect(copied.find(x=>x.values[title]==="root (copy)")?.parentId).toBeNull();
  const cloneRoot=copied.find(x=>x.values[title]==="root (copy)")!;
  const cloneA=copied.find(x=>x.values[title]==="a")!;
  const cloneSibling=copied.find(x=>x.values[title]==="sibling")!;
  expect(cloneA.parentId).toBe(cloneRoot.id);
  expect(cloneSibling.dependsOn).toEqual([cloneA.id]);
  expect(cloneSibling.id).not.toBe("sibling");
 });
 it("recurrence clones whole subtree unfinished with shifted dates once",()=>{
  const {data,due}=fixture();data.records[0].recurrence="weekly";
  let next=setTaskProgress(data,"root","completed");
  expect(next.records).toHaveLength(8);
  const fresh=next.records.filter(x=>!data.records.some(old=>old.id===x.id));
  expect(fresh).toHaveLength(4);
  expect(fresh.every(x=>x.progress==="not_started")).toBe(true);
  expect(fresh.every(x=>x.values[due]==="2026-10-28")).toBe(true);
  expect(fresh.find(x=>x.values[data.fields[0].id]==="a")?.parentId).toBe(fresh[0].id);
  expect(setTaskProgress(next,"root","completed").records).toHaveLength(8);
 });
 it("moves a whole branch between buckets and calendar dates",()=>{
  const {data,start,due}=fixture(),bucket=plannerBucket(data)!;
  const moved=moveTaskToBucket(data,"root","In progress");
  expect(moved.records.every(x=>x.values[bucket.id]==="In progress")).toBe(true);
  const view=data.views.find(x=>x.kind==="calendar")!;
  const dated=rescheduleTask(data,view,"root","2026-10-25");
  expect(dated.records.every(x=>x.values[due]==="2026-10-25")).toBe(true);
  expect(dated.records.every(x=>x.values[start]==="2026-10-24")).toBe(true);
 });
 it("deletes a branch with cleanup, or promotes children without dropping them",()=>{
  const {data}=fixture();
  data.records[3].dependsOn=["b"];
  const promoted=deleteRecord(data,"a","promote");
  expect(promoted.records.map(x=>x.id)).toEqual(["root","b","sibling"]);
  expect(promoted.records.find(x=>x.id==="b")?.parentId).toBe("root");
  const deleted=deleteRecord(data,"a","subtree");
  expect(deleted.records.map(x=>x.id)).toEqual(["root","sibling"]);
  expect(deleted.records.find(x=>x.id==="sibling")?.dependsOn).toEqual([]);
 });
 it("round-trips JSON and hierarchical CSV without changing IDs or parents",()=>{
  const {data}=fixture();
  const fromJson=importCollectionJson(JSON.stringify(data));
  expect(fromJson.records.map(x=>x.parentId)).toEqual(data.records.map(x=>x.parentId));
  const csv=exportCollectionCsv(data);
  expect(csv).toContain("__planner_parent_id");
  const imported=importCollectionCsv(csv);
  expect(imported.records.map(x=>x.id)).toEqual(data.records.map(x=>x.id));
  expect(imported.records.map(x=>x.parentId)).toEqual(data.records.map(x=>x.parentId));
  expect(()=>importCollectionCsv(csv.replace('"a","root"','"a","nonexistent"'))).toThrow();
 });
 it("includes descendants in reminders, My tasks, search and charts",()=>{
  const {data}=fixture();
  expect(activeTaskReminders(data,"2026-10-22")).toHaveLength(4);
  expect(groupAssignedTasks(data,"me","2026-10-22").Overdue).toHaveLength(4);
  expect(searchTaskTree(data,"b")).toEqual(new Set(["b","a","root"]));
  expect(chartSeries(data,data.records,"progress").reduce((n,x)=>n+x.value,0)).toBe(4);
  const view=data.views.find(x=>x.kind==="table")!;
  expect(visibleRecords(data,view,"b").map(x=>x.id)).toEqual(["root","a","b"]);
 });
 it("indexes 5000 nodes and keeps UI page size at most 500 without truncating stored data",()=>{
  const rows=Array.from({length:5000},(_,i)=>({id:"t"+i,values:{},parentId:i%5===0?null:"t"+(i-1)}));
  const tree=buildTaskTree(rows);
  expect(tree.order).toHaveLength(5000);
  expect(MAX_VISIBLE_TREE_NODES).toBe(500);
  expect(tree.depth.get("t4999")).toBe(5);
 });
});
