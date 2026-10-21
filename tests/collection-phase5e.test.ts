import {describe,expect,it} from "vitest";
import {formatPlannerCardDate,formatPlannerPriority} from "../src/collections/collectionDateDisplay";
import {cardIndicators} from "../src/collections/collectionCardIndicators";
import {createCollection} from "../src/collections/model";
describe("Phase 5E compact Planner card labels",()=>{
 it("formats same-year due dates as dd/MM, retaining the year for other years",()=>{
  expect(formatPlannerCardDate("2026-10-10","2026-10-22")).toBe("10/10");
  expect(formatPlannerCardDate("2025-10-10","2026-10-22")).toBe("10/10/2025");
  expect(formatPlannerCardDate("2027-01-02","2026-10-22")).toBe("02/01/2027");
  expect(formatPlannerCardDate("","2026-10-22")).toBe("");
  expect(formatPlannerCardDate("2026-02-30","2026-10-22")).toBe("2026-02-30");
  expect(formatPlannerCardDate("not-a-date","2026-10-22")).toBe("not-a-date");
 });
 it("capitalizes labels while suppressing medium/low priority flags",()=>{
  const data=createCollection();
  const common={id:"t",values:{},progress:"not_started" as const};
  for(const name of ["urgent","important","medium","low"] as const)
   expect(formatPlannerPriority(name)).toBe(name[0].toUpperCase()+name.slice(1));
  expect(cardIndicators(data,{...common,priority:"urgent"}).priority).toBe(true);
  expect(cardIndicators(data,{...common,priority:"important"}).priority).toBe(true);
  expect(cardIndicators(data,{...common,priority:"medium"}).priority).toBe(false);
  expect(cardIndicators(data,{...common,priority:"low"}).priority).toBe(false);
 });
});
