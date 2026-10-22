import { describe, expect, it } from "vitest";
import { createCollection } from "../src/collections/model";
import { gridFields, initialGridHiddenFields, toggleGridField, visibleGridTaskKeys } from "../src/collections/collectionPlannerFilters";
describe("Phase 6A.1 Grid visibility",()=>{
 it("defaults to name, due and four task properties without mutating saved view",()=>{
  const data=createCollection();data.fields=[
   {id:"name",name:"Name",type:"text"},{id:"start",name:"Start",type:"date"},
   {id:"due",name:"Due",type:"date"},{id:"bucket",name:"Bucket",type:"select"},
   {id:"notes",name:"Notes",type:"text"},{id:"cost",name:"Cost",type:"number"}];
  data.views=[{id:"grid",name:"Grid",kind:"table"}];const view=data.views[0];
  expect(gridFields(data,view).map(f=>f.name)).toEqual(["Name","Due"]);
  expect(visibleGridTaskKeys(view)).toEqual(["__progress","__assignee","__priority","__labels"]);
  expect(initialGridHiddenFields(data)).toEqual(["start","bucket","notes","cost"]);
  const changed=toggleGridField(data,view.id,"start");
  expect(gridFields(changed,changed.views[0]).map(f=>f.name)).toEqual(["Name","Start","Due"]);
  expect(gridFields(data,view).length).toBe(2);
 });
 it("hides optional task columns and persists choices",()=>{
  const data=createCollection(), view=data.views.find(v=>v.kind==="table")!;
  const changed=toggleGridField(data,view.id,"__priority");
  expect(visibleGridTaskKeys(changed.views.find(v=>v.id===view.id)!)).not.toContain("__priority");
  expect(visibleGridTaskKeys(toggleGridField(changed,view.id,"__priority").views.find(v=>v.id===view.id)!)).toContain("__priority");
 });
});
