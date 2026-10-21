import { describe, expect, it } from "vitest";
import { createCollection, normalizeCollection } from "../src/collections/model";
import { boardGroups, createGroupedTask, splitBucketCompletion } from "../src/renderers/collectionBoardGroups";
import { createBoardTask } from "../src/collections/collectionTasks";
describe("Planner quick-add completion invariants",()=>{
 const fresh=()=>normalizeCollection(createCollection());
 it.each(["To do","In progress","Done"])(
   "quick-add inside %s starts active with matching legacy Status",bucket=>{
    const data=fresh();
    const field=data.fields.find(f=>f.name==="Bucket")!;
    const status=data.fields.find(f=>f.name==="Status")!;
    const name="Soạn báo cáo";
    const result=createGroupedTask(data,name,"bucket:"+bucket,"bucket",field);
    expect(result.records).toHaveLength(1);
    const record=result.records[0];
    expect(record.progress).toBe("not_started");
    expect(record.values[status.id]).toBe(bucket);
    expect(record.values[field.id]).toBe(bucket);
    const group=boardGroups(result,result.records,"bucket",field)
      .find(g=>g.title===bucket)!;
    expect(splitBucketCompletion(group.rows).active.map(x=>x.id)).toContain(record.id);
    expect(splitBucketCompletion(group.rows).completed).toEqual([]);
    const saved=normalizeCollection(JSON.parse(JSON.stringify(result)));
    expect(saved.records[0].progress).toBe("not_started");
    expect(saved.records[0].values[status.id]).toBe(bucket);
    expect(data.records).toHaveLength(0);
   });
 it("creates first-bucket task from Grid without deriving progress from legacy Status",()=>{
  const data=fresh(),status=data.fields.find(f=>f.name==="Status")!;
  const result=createBoardTask(data,"Draft");
  expect(result.records[0].progress).toBe("not_started");
  expect(result.records[0].values[status.id]).toBe("To do");
 });
 it("keeps progress not_started even if a creation automation writes legacy Done",()=>{
  const data=fresh();
  const bucket=data.fields.find(f=>f.name==="Bucket")!;
  const status=data.fields.find(f=>f.name==="Status")!;
  data.automations=[{id:"rule",name:"Legacy complete",enabled:true,
   whenFieldId:bucket.id,whenEquals:"To do",thenFieldId:status.id,thenValue:"Done"}];
  const created=createGroupedTask(data,"New","bucket:To do","bucket",bucket);
  expect(created.records[0].progress).toBe("not_started");
  expect(created.records[0].values[status.id]).toBe("To do");
 });
});
