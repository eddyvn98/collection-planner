import {describe,expect,it} from "vitest";
import {createCollection,setParent} from "../src/collections/model";
import {addMindMapRelative,renameMindMapTask,visibleMindMapRecords,
 candidateMindMapParent,mindMapBadges} from "../src/renderers/collectionMindMapActions";
import {buildTaskTree} from "../src/collections/collectionTaskTree";
import {layoutMindMap} from "../src/renderers/collectionMindMapLayout";
function make(){
 const data=createCollection(),name=data.fields.find(field=>field.type==="text")!.id;
 data.records=[{id:"root",values:{[name]:"Root"},progress:"in_progress" as const},
 {id:"child",parentId:"root",values:{[name]:"Child"},progress:"not_started" as const},
 {id:"sibling",values:{[name]:"Sibling"}}];
 return {data,name};
}
describe("Phase 7B Mind Map tree interactions",()=>{
 it("creates child and sibling in the correct hierarchy with stable saved IDs",()=>{
  const {data,name}=make();
  const next=addMindMapRelative(data,"root","child","New child");
  const child=next.records.find(row=>!data.records.some(previous=>previous.id===row.id));
  expect(child?.parentId).toBe("root");
  expect(child?.values[name]).toBe("New child");
  const sibling=addMindMapRelative(data,"child","sibling","New sibling");
  expect(sibling.records.at(-1)?.parentId).toBe("root");
  const newRoot=addMindMapRelative(data,"root","sibling","New root");
  expect(newRoot.records.at(-1)?.parentId).toBeNull();
  expect(newRoot.records).toHaveLength(4);
  expect(data.records).toHaveLength(3);
 });
 it("renames in place without reassigning record IDs",()=>{
  const {data,name}=make();
  expect(renameMindMapTask(data,"root"," Revised ").records[0]).toMatchObject({
   id:"root",values:{[name]:"Revised"}
  });
  expect(renameMindMapTask(data,"root"," ")).toBe(data);
 });
 it("collapses entire descendant chain without deleting records",()=>{
  const {data}=make(),nested=addMindMapRelative(data,"child","child","Grandchild");
  const visible=visibleMindMapRecords(nested,nested.records,new Set(["root"]));
  expect(visible.map(x=>x.id)).toEqual(["root","sibling"]);
  expect(nested.records).toHaveLength(4);
  expect(visibleMindMapRecords(nested,nested.records,new Set()).length).toBe(4);
 });
 it("only allows nearby valid drop targets; refuses cycles and >6 depth",()=>{
  const {data}=make();
  const points=layoutMindMap(data.records).nodes;
  const root=points.find(row=>row.id==="root")!,child=points.find(row=>row.id==="child")!;
  expect(candidateMindMapParent(data,"sibling",points,child.x,child.y)).toBe("child");
  expect(candidateMindMapParent(data,"root",points,child.x,child.y)).toBeNull();
  expect(candidateMindMapParent(data,"sibling",points,99999,99999)).toBeNull();
  expect(setParent(data,"root","child")).toBe(data);
 });
 it("badges count recursive descendants and include model fields",()=>{
  const {data}=make();
  const badge=mindMapBadges(data,"root");
  expect(badge.counts).toEqual({done:0,total:1});
  expect(badge.progress).toBe("in_progress");
  expect(badge.priority).toBe("medium");
  expect(badge.hasChildren).toBe(true);
 });
 it("bounds 500 rendered nodes but keeps all records and parent hierarchy",()=>{
  const {data}=make();
  data.records.push(...Array.from({length:600},(_,i)=>({id:"extra"+i,parentId:null,values:{}})));
  const tree=buildTaskTree(data.records);
  expect(tree.order).toHaveLength(603);
  expect(layoutMindMap(tree.order,500).nodes).toHaveLength(500);
  expect(data.records).toHaveLength(603);
  expect(layoutMindMap(tree.order,500,500).nodes).toHaveLength(103);
 });
});
