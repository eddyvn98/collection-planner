import {describe,expect,it} from "vitest";
import {createCollection,normalizeCollection} from "../src/collections/model";
import {cardIndicators} from "../src/collections/collectionCardIndicators";
import {displayPlannerDate} from "../src/collections/collectionDateDisplay";
import {activePlannerChips,clearPlannerChip} from "../src/collections/collectionFilterChips";
import {EMPTY_TASK_FILTERS} from "../src/collections/collectionPlannerFilters";
describe("Phase 5D metadata, locale and filtering",()=>{
 const fixture=()=>{
  const data=normalizeCollection(createCollection());
  const due=data.fields.find(x=>x.name==="Due")!;
  data.people=[{id:"p",name:"Mai"}];data.labels=[{id:"l",name:"Urgent",color:"#5B5FC7"}];
  const row={id:"a",values:{[due.id]:"2026-10-18"},progress:"in_progress" as const,
   priority:"urgent" as const,labelIds:["l"],assigneeIds:["p"],body:"Notes",
   checklist:[{id:"c1",text:"Review",done:false}],attachments:[{id:"f",name:"file.pdf",url:"https://example.com"}],
   comments:[{id:"m",author:"Mai",at:"2026-10-19",text:"Please check"}]};
  return {data,row};
 };
 it("provides every card metadata badge only when present",()=>{
  const {data,row}=fixture();
  expect(cardIndicators(data,row,"2026-10-22")).toEqual({
   labels:1,priority:true,checklist:"0/1",attachments:1,notes:true,comments:1,
   due:"2026-10-18",overdue:true,avatars:1,
  });
  const empty=cardIndicators(data,{id:"b",values:{},progress:"not_started"},"2026-10-22");
  expect(empty).toMatchObject({labels:0,priority:false,checklist:null,attachments:0,
   notes:false,comments:0,due:"",overdue:false,avatars:0});
  expect(cardIndicators(data,{...row,progress:"completed"},"2026-10-22").overdue).toBe(false);
 });
 it("formats valid dates dd/mm/yyyy without timezone shifts",()=>{
  expect(displayPlannerDate("2026-10-22")).toBe("22/10/2026");
  expect(displayPlannerDate("2024-02-29")).toBe("29/02/2024");
  expect(displayPlannerDate("2026-02-30")).toBe("2026-02-30");
  expect(displayPlannerDate("")).toBe("");
 });
 it("removes each filter chip individually and Clear all resets everything",()=>{
  const {data}=fixture();
  const filters={...EMPTY_TASK_FILTERS,keyword:"draft",priority:"urgent",assignee:"p"};
  expect(activePlannerChips(data,filters).map(x=>x.key)).toEqual(["keyword","assignee","priority"]);
  const next=clearPlannerChip(filters,"priority");
  expect(next.priority).toBe("");expect(next.assignee).toBe("p");
  expect(activePlannerChips(data,EMPTY_TASK_FILTERS)).toEqual([]);
 });
});
