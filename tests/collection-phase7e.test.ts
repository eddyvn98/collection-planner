import {describe,it,expect} from "vitest";
import {groupViewRows,viewGroupName} from "../src/collections/collectionToolbarGrouping";
import {createCollection,updateView,visibleRecords,type CollectionRecord,type CollectionField} from "../src/collections/model";
import {createQuickTask} from "../src/collections/collectionInputParser";
const bucket:CollectionField={id:"bucket",name:"Bucket",type:"select",options:["To do","Doing"]};
const row=(id:string,value:string):CollectionRecord=>({id,values:{name:id,bucket:value}});
describe("7E shared view configuration primitives",()=>{
 it("keeps same-bucket task order and does not mutate canonical records",()=>{
  const original=[row("alpha","To do"),row("beta","Doing"),row("gamma","To do"),row("delta","")];
  const grouped=groupViewRows(original,bucket);
  expect(grouped.map(r=>r.id)).toEqual(["alpha","gamma","beta","delta"]);
  expect(original.map(r=>r.id)).toEqual(["alpha","beta","gamma","delta"]);
  expect(viewGroupName(grouped[3],bucket)).toBe("Unassigned");
  expect(groupViewRows(original)).toBe(original);
 });
 it("persists a view-specific sort without changing unrelated views",()=>{
  const data=createCollection();
  const initial=data.views[0],other=data.views[1];
  const field=data.fields[0];
  const changed=updateView(data,initial.id,{sorts:[{fieldId:field.id,direction:"desc"}],sort:undefined});
  expect(changed.views.find(v=>v.id===initial.id)?.sorts).toEqual([{fieldId:field.id,direction:"desc"}]);
  expect(changed.views.find(v=>v.id===other.id)).toEqual(other);
 });
 it("one quick-add creates task with date and assignee in the same mutation",()=>{
  const data={...createCollection(),people:[{id:"mai",name:"Mai"}]};
  const next=createQuickTask(data,"Review +3d @Mai !urgent",undefined,"","2026-10-22");
  expect(next.records).toHaveLength(data.records.length+1);
  const created=next.records.at(-1)!;
  expect(created.assigneeIds).toEqual(["mai"]);
  expect(created.priority).toBe("urgent");
  expect(Object.values(created.values)).toContain("2026-10-25");
  expect(data.records.length).toBeLessThan(next.records.length);
 });
});
