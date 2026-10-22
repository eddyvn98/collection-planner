import {describe,it,expect} from "vitest";
import {createCollection,type CollectionBlockPayload} from "../src/collections/model";
import {buildTaskTree,MAX_TASK_DEPTH,descendantCounts} from "../src/collections/collectionTaskTree";
import {addSubtask,taskBreadcrumb,moveTaskTree,shiftTreeSibling,
 indentTreeTask,outdentTreeTask,visibleTaskTree} from "../src/collections/collectionTreeActions";
import {historyCommit,historyUndo,historyRedo,initialHistory} from "../src/collections/collectionHistory";
function plan():CollectionBlockPayload{
 const data=createCollection(),title=data.fields[0].id;
 const bucket=data.fields.find(x=>x.name==="Bucket")!.id;
 data.records=[
  {id:"a",values:{[title]:"Alpha",[bucket]:"To do"}},
  {id:"b",values:{[title]:"Beta",[bucket]:"To do"}},
  {id:"c",parentId:"b",values:{[title]:"Child",[bucket]:"To do"}},
  {id:"d",values:{[title]:"Delta",[bucket]:"Done"}},
 ];
 return data;
}
const ids=(data:CollectionBlockPayload)=>data.records.map(r=>r.id);
describe("6D tree operations",()=>{
 it("adds repeated sub-tasks; inherits bucket and respects maximum depth",()=>{
  let data=plan();
  data=addSubtask(data,"b","One");
  let added=data.records.find(r=>r.values[data.fields[0].id]==="One")!;
  expect(added.parentId).toBe("b");
  expect(added.values[data.fields.find(f=>f.name==="Bucket")!.id]).toBe("To do");
  for(let i=2;i<=MAX_TASK_DEPTH-1;i++){
   data=addSubtask(data,added.id,"Level "+i);
   added=data.records.find(r=>r.values[data.fields[0].id]==="Level "+i)!;
  }
  expect(buildTaskTree(data.records).depth.get(added.id)).toBe(MAX_TASK_DEPTH);
  expect(addSubtask(data,added.id,"Too deep")).toBe(data);
  expect(addSubtask(data,"b","  ")).toBe(data);
 });
 it("reorders a whole branch before or after siblings preserving its descendants",()=>{
  const data=plan();
  const moved=moveTaskTree(data,"b","a","before");
  expect(ids(moved)).toEqual(["b","c","a","d"]);
  expect(moved.records.find(r=>r.id==="c")?.parentId).toBe("b");
  expect(ids(moveTaskTree(data,"b","d","after"))).toEqual(["a","d","b","c"]);
  expect(shiftTreeSibling(data,"a",1).records.slice(0,3).map(x=>x.id)).toEqual(["b","c","a"]);
 });
 it("indents and outdents via parent changes, rejecting descendant cycles",()=>{
  let data=plan();data=indentTreeTask(data,"b");
  expect(data.records.find(x=>x.id==="b")?.parentId).toBe("a");
  expect(data.records.find(x=>x.id==="c")?.parentId).toBe("b");
  data=outdentTreeTask(data,"b");
  expect(data.records.find(x=>x.id==="b")?.parentId).toBeNull();
  expect(moveTaskTree(data,"a","c","child")).toBe(data);
  expect(taskBreadcrumb(data,"c").map(x=>x.id)).toEqual(["b","c"]);
 });
 it("reparents to a different bucket and detaches child to empty bucket",()=>{
  let data=plan(),bucket=data.fields.find(x=>x.name==="Bucket")!.id;
  data=moveTaskTree(data,"b","d","child");
  expect(data.records.find(x=>x.id==="b")?.parentId).toBe("d");
  expect(data.records.filter(x=>x.id==="b"||x.id==="c").every(x=>x.values[bucket]==="Done")).toBe(true);
  data=moveTaskTree(data,"b",null,"after","To do");
  expect(data.records.find(x=>x.id==="b")?.parentId).toBeNull();
  expect(data.records.find(x=>x.id==="c")?.parentId).toBe("b");
  expect(data.records.find(x=>x.id==="c")?.values[bucket]).toBe("To do");
 });
 it("keeps illegal moves immutable, including dependency and depth violations",()=>{
  const data=plan();
  const bad={...data,records:data.records.map(row=>row.id==="d"?{...row,dependsOn:["c"]}:row)};
  expect(moveTaskTree(bad,"d","b","child")).toBe(bad);
  expect(moveTaskTree(data,"b","c","child")).toBe(data);
  expect(moveTaskTree(data,"b","b","after")).toBe(data);
 });
 it("supports history undo and redo for a full tree move",()=>{
  const data=plan(),next=moveTaskTree(data,"b","d","child");
  const committed=historyCommit(initialHistory(data),next);
  expect(historyUndo(committed).current).toEqual(data);
  expect(historyRedo(historyUndo(committed)).current).toEqual(next);
 });
 it("limits render to 500, returns ancestors before descendants, keeps saved records",()=>{
  const data=plan();
  data.records.push(...Array.from({length:600},(_,i)=>({id:"extra"+i,values:{}})));
  const tree=visibleTaskTree(data,data.records,new Set(),500);
  expect(tree.rows).toHaveLength(500);
  expect(tree.truncated).toBe(true);
  expect(data.records).toHaveLength(604);
  const collapsed=visibleTaskTree(data,data.records,new Set(["b"]));
  expect(collapsed.rows.some(x=>x.id==="c")).toBe(false);
  expect(collapsed.rows.findIndex(x=>x.id==="b")).toBeGreaterThan(0);
  expect(descendantCounts(data.records).get("b")?.total).toBe(1);
 });
});
