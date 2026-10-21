import { describe, expect, it } from "vitest";
import { createCollection } from "../src/collections/model";
import { displayBucket,splitBucketCompletion,boardGroups } from "../src/renderers/collectionBoardGroups";
describe("Planner B bucket completion and no Unassigned column",()=>{
 it("places missing buckets in first configured bucket without rewriting legacy records",()=>{
  const data=createCollection(),bucket=data.fields.find(f=>f.name==="Bucket")!;
  data.records=[{id:"a",values:{[bucket.id]:""},progress:"not_started"}];
  expect(displayBucket("",["To do","Done"])).toBe("To do");
  const groups=boardGroups(data,data.records,"bucket",bucket);
  expect(groups.map(g=>g.title)).not.toContain("Unassigned");
  expect(groups.find(g=>g.title==="To do")?.rows.map(r=>r.id)).toEqual(["a"]);
  expect(data.records[0].values[bucket.id]).toBe("");
 });
 it("keeps completed tasks separate without mutating order or losing task identities",()=>{
  const rows=[{id:"a",values:{},progress:"not_started" as const},
   {id:"b",values:{},progress:"completed" as const},
   {id:"c",values:{},progress:"in_progress" as const}];
  const groups=splitBucketCompletion(rows);
  expect(groups.active.map(r=>r.id)).toEqual(["a","c"]);
  expect(groups.completed.map(r=>r.id)).toEqual(["b"]);
  expect(rows).toHaveLength(3);
  expect(splitBucketCompletion([])).toEqual({active:[],completed:[]});
 });
});
