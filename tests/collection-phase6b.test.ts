import { describe, expect, it } from "vitest";
import { createCollection, type CollectionBlockPayload, type CollectionRecord } from "../src/collections/model";
import { availableCollectionDependencies, blockingCollectionDependencies,
 setCollectionDependencies, validCollectionDependencies } from "../src/collections/collectionDependencies";

const make = () => {
 const base=createCollection();
 const task=(id:string,progress:CollectionRecord["progress"]="not_started",
  dependsOn:string[]=[]):CollectionRecord=>({id,values:{[base.fields[0].id]:id},progress,dependsOn});
 const records=[task("ship", "not_started",["api"]),
  task("api","in_progress"),task("done","completed"),task("cycle","not_started",["ship"]),
  task("available"),task("blocked","completed",["available"])];
 return {...base,records} as CollectionBlockPayload;
};
describe("Phase 6B dependency management",()=>{
 it("returns only unfinished direct blockers, not completed predecessors",()=>{
  const data=make(), ship=data.records[0];
  expect(blockingCollectionDependencies(data,ship).map(x=>x.id)).toEqual(["api"]);
  const finished=setCollectionDependencies(data,"ship",["api","done"]);
  expect(blockingCollectionDependencies(finished,finished.records[0]).map(x=>x.id)).toEqual(["api"]);
  const completed={...data,records:data.records.map(x=>x.id==="api"?{...x,progress:"completed" as const}:x)};
  expect(blockingCollectionDependencies(completed,completed.records[0])).toEqual([]);
  expect(blockingCollectionDependencies(data,data.records[5])).toEqual([]);
 });
 it("excludes self, completed, selected and cyclic candidates",()=>{
  const data=make(), ship=data.records[0];
  expect(availableCollectionDependencies(data,ship).map(x=>x.id)).toEqual(["available"]);
  expect(validCollectionDependencies(data,"ship",["cycle"])).toBe(false);
  expect(setCollectionDependencies(data,"ship",["cycle"])).toBe(data);
  expect(setCollectionDependencies(data,"ship",["ship"])).toBe(data);
  expect(setCollectionDependencies(data,"ship",["api","api"])).toBe(data);
  expect(setCollectionDependencies(data,"ship",["no-record"])).toBe(data);
  expect(setCollectionDependencies(data,"ship",["api","available"]).records[0].dependsOn)
   .toEqual(["api","available"]);
 });
 it("preserves existing selected completed predecessors for removal",()=>{
  const data=setCollectionDependencies(make(),"ship",["api","done"]);
  expect(data.records[0].dependsOn).toContain("done");
  expect(availableCollectionDependencies(data,data.records[0]).map(x=>x.id)).not.toContain("done");
  const cleaned=setCollectionDependencies(data,"ship",["api"]);
  expect(cleaned.records[0].dependsOn).toEqual(["api"]);
 });
 it("rejects more than 20 dependencies and retains existing data on no-op",()=>{
  const data=make();
  expect(setCollectionDependencies(data,"ship",["api"])).toBe(data);
  expect(validCollectionDependencies(data,"ship",Array.from({length:21},(_,i)=>"a"+i))).toBe(false);
 });
});
