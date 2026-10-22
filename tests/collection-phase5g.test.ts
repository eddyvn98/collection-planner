import {describe,it,expect} from "vitest";
import {nextMenuIndex,menuTypeahead,nextFocusIndex,contrastRatio,motionDurations,motionDuration} from "../src/renderers/collectionInteraction";
describe("Phase 5G accessibility and motion primitives",()=>{
 it("roves up/down, wraps, uses Home/End and skips empty lists",()=>{
  expect(nextMenuIndex(0,3,"ArrowUp")).toBe(2);
  expect(nextMenuIndex(2,3,"ArrowDown")).toBe(0);
  expect(nextMenuIndex(2,3,"Home")).toBe(0);
  expect(nextMenuIndex(0,3,"End")).toBe(2);
  expect(nextMenuIndex(1,0,"ArrowDown")).toBe(-1);
  expect(nextMenuIndex(1,3,"Escape")).toBe(1);
  expect(menuTypeahead(["Move","Rename","Delete"],"de")).toBe(2);
  expect(menuTypeahead(["Move","Rename"],"xyz")).toBe(-1);
 });
 it("traps Tab and Shift+Tab cyclically and handles empty dialog",()=>{
  expect(nextFocusIndex(2,3,false)).toBe(0);
  expect(nextFocusIndex(0,3,true)).toBe(2);
  expect(nextFocusIndex(1,3,false)).toBe(2);
  expect(nextFocusIndex(0,0,false)).toBe(-1);
 });
 it("respects reduced motion, and durations are within requested bounds",()=>{
  expect(motionDurations.popover).toBeGreaterThanOrEqual(120);
  expect(motionDurations.popover).toBeLessThanOrEqual(160);
  expect(motionDurations.drawer).toBe(200);
  expect(motionDuration(motionDurations.popover,true)).toBe(0);
  expect(motionDuration(motionDurations.drawer,false)).toBe(200);
 });
 it("meets WCAG AA for light/dark text, border and interactive accent",()=>{
  expect(contrastRatio("#242424","#FFFFFF")).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio("#616161","#FFFFFF")).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio("#FFFFFF","#292929")).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio("#D1D1D1","#292929")).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio("#5B5FC7","#FFFFFF")).toBeGreaterThanOrEqual(3);
  expect(contrastRatio("#7F85F5","#292929")).toBeGreaterThanOrEqual(3);
  expect(contrastRatio("#929292","#FFFFFF")).toBeGreaterThanOrEqual(3);
  expect(contrastRatio("#858585","#292929")).toBeGreaterThanOrEqual(3);
 });
});
