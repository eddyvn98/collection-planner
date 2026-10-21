import { describe,expect,it } from "vitest";
import { createCollection } from "../src/collections/model";
import { activePlannerChips,clearPlannerChip,resolveMyTasksId } from "../src/collections/collectionFilterChips";
import { EMPTY_TASK_FILTERS } from "../src/collections/collectionPlannerFilters";
describe("Planner A filter chips and My tasks",()=>{
 it("emits only active chips with readable names and clears one without touching others",()=>{
  const data=createCollection();data.people=[{id:"p",name:"Alex"}];
  data.labels=[{id:"l",name:"Review",color:"#aabbcc"}];
  const f={...EMPTY_TASK_FILTERS,keyword:"  mock ",progress:"in_progress",assignee:"p",label:"l",due:"next7" as const};
  const chips=activePlannerChips(data,f);
  expect(chips.map(c=>c.key)).toEqual(["keyword","due","label","assignee","progress"]);
  expect(chips.some(c=>c.label==="Assigned: Alex")).toBe(true);
  const without=clearPlannerChip(f,"assignee");
  expect(without.assignee).toBe("");
  expect(without.progress).toBe("in_progress");
  expect(clearPlannerChip(f,"due").due).toBe("all");
  expect(f.assignee).toBe("p");
 });
 it("returns no chips for default filters, and only uses a real selected user for My tasks",()=>{
  const data=createCollection();data.people=[{id:"p",name:"Taylor"},{id:"you",name:"You"}];
  expect(activePlannerChips(data,EMPTY_TASK_FILTERS)).toEqual([]);
  expect(resolveMyTasksId(data,"p")).toBe("p");
  expect(resolveMyTasksId(data,"unknown")).toBe("you");
  data.people=[];expect(resolveMyTasksId(data,null)).toBe("");
 });
});
