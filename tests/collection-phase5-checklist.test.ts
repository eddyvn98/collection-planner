import {describe,expect,it} from "vitest";
import {checklistTotals,checklistToggle,checklistReorder} from "../src/collections/collectionChecklistActions";
describe("Planner C checklist",()=>{
 const items=[{id:"a",text:"Draft",done:true},{id:"b",text:"Review",done:false},{id:"c",text:"Ship",done:false}];
 it("computes progress and protects empty checklist",()=>{
  expect(checklistTotals(items)).toEqual({completed:1,total:3,percentage:100/3});
  expect(checklistTotals([])).toEqual({completed:0,total:0,percentage:0});
 });
 it("toggles one item without mutating others and keeps no-ops reference stable",()=>{
  const changed=checklistToggle(items,"b",true);
  expect(changed[1].done).toBe(true);expect(changed[0]).toBe(items[0]);
  expect(items[1].done).toBe(false);
  expect(checklistToggle(items,"b",false)).toBe(items);
 });
 it("reorders to drop index immutably and ignores invalid drops",()=>{
  const changed=checklistReorder(items,"c","a");
  expect(changed.map(x=>x.id)).toEqual(["c","a","b"]);
  expect(items.map(x=>x.id)).toEqual(["a","b","c"]);
  expect(checklistReorder(items,"a","missing")).toBe(items);
  expect(checklistReorder(items,"b","b")).toBe(items);
 });
});
