import { describe, expect, it } from "vitest";
import { createCollection } from "../src/collections/model";
import { EMPTY_TASK_FILTERS, countActiveTaskFilters } from "../src/collections/collectionPlannerFilters";
import { rescheduleTask, scheduleDays, scheduledTaskDay } from "../src/collections/collectionSchedule";
describe("Planner polish mobile filters and dates", () => {
 it("mobile filter badge counts only enabled independent conditions", () => {
   expect(countActiveTaskFilters(EMPTY_TASK_FILTERS)).toBe(0);
   expect(countActiveTaskFilters({...EMPTY_TASK_FILTERS,keyword:"  "})).toBe(0);
   expect(countActiveTaskFilters({...EMPTY_TASK_FILTERS,keyword:" design ",due:"overdue",
     assignee:"someone",progress:"in_progress"})).toBe(4);
   expect(countActiveTaskFilters({...EMPTY_TASK_FILTERS,bucket:"To do",
     priority:"urgent",label:"a"})).toBe(3);
 });
 it("agenda month includes all dates and Sunday without relying on horizontal columns", () => {
   const days = scheduleDays("2026-10-21","month").filter(day=>day.startsWith("2026-10"));
   expect(days[0]).toBe("2026-10-01");
   expect(days.at(-1)).toBe("2026-10-31");
   expect(days).toHaveLength(31);
   expect(days).toContain("2026-10-25");
 });
 it("move-to-date shares the same duration-preserving reschedule and no-op contract as drag", () => {
   const data=createCollection(),calendar=data.views.find(v=>v.kind==="calendar")!;
   const name=data.fields.find(f=>f.name==="Name")!.id;
   const start=data.fields.find(f=>f.name==="Start")!.id;
   const due=data.fields.find(f=>f.name==="Due")!.id;
   data.records=[{id:"abc",progress:"in_progress",values:{
     [name]:"Draft",[start]:"2026-10-20",[due]:"2026-10-21"}}];
   const updated=rescheduleTask(data,calendar,"abc","2026-10-25");
   expect(updated.records[0].values[due]).toBe("2026-10-25");
   expect(updated.records[0].values[start]).toBe("2026-10-24");
   expect(scheduledTaskDay(updated,calendar,updated.records[0])).toBe("2026-10-25");
   expect(rescheduleTask(data,calendar,"abc","2026-10-21")).toBe(data);
   expect(rescheduleTask(data,calendar,"abc","invalid")).toBe(data);
 });
});
