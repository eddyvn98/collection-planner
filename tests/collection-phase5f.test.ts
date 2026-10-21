import {describe,expect,it} from "vitest";
import {floatingPlacement} from "../src/renderers/CollectionFloatingPanel";
const bounds=(top:number,bottom:number,left:number,right:number)=>({top,bottom,left,right});
describe("Phase 5F floating popup positioning",()=>{
 it("uses viewport, not a short parent height",()=>{
  const result=floatingPlacement(bounds(8,48,1080,1140),360,650,1280,800);
  expect(result.flipped).toBe(false);
  expect(result.top).toBe(54);
  expect(result.maxHeight).toBe(738);
  expect(result.left).toBe(780);
  expect(result.top+result.maxHeight).toBeLessThanOrEqual(792);
 });
 it("flips upward and clamps height at the bottom edge",()=>{
  const result=floatingPlacement(bounds(730,765,200,250),200,280,375,812);
  expect(result.flipped).toBe(true);
  expect(result.top).toBeLessThan(730);
  expect(result.top).toBeGreaterThanOrEqual(8);
  expect(result.top+280).toBeLessThanOrEqual(730);
 });
 it("clamps width for mobile edge anchors",()=>{
  const result=floatingPlacement(bounds(45,80,340,370),360,600,375,812,"end");
  expect(result.left).toBe(8);
  expect(result.maxHeight).toBeGreaterThan(700);
 });
});
