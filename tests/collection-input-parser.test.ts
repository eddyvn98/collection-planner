import {describe,it,expect} from "vitest";
import {createCollection,type CollectionBlockPayload} from "../src/collections/model";
import {parseNaturalDate,parseQuickAdd,createQuickTask} from "../src/collections/collectionInputParser";
const today="2026-10-22";
const fixture=():CollectionBlockPayload=>({...createCollection(),
 people:[{id:"m",name:"Mai Anh"},{id:"n",name:"Nam"}],
 labels:[{id:"urgent",name:"Khẩn cấp",color:"#f00"},{id:"design",name:"Thiết kế",color:"#000"}]});
describe("7D natural dates",()=>{
 it("parses Vietnamese, English, weekdays and offsets against local reference",()=>{
  expect(parseNaturalDate("mai",today)).toBe("2026-10-23");
  expect(parseNaturalDate("ngày mai",today)).toBe("2026-10-23");
  expect(parseNaturalDate("tomorrow",today)).toBe("2026-10-23");
  expect(parseNaturalDate("hôm nay",today)).toBe(today);
  expect(parseNaturalDate("thứ 6",today)).toBe("2026-10-23");
  expect(parseNaturalDate("t6",today)).toBe("2026-10-23");
  expect(parseNaturalDate("+3d",today)).toBe("2026-10-25");
  expect(parseNaturalDate("2026-02-30",today)).toBe(null);
  expect(parseNaturalDate("hi there",today)).toBe(null);
  expect(parseNaturalDate("+1000d",today)).toBe(null);
 });
 it("next occurrence of same weekday is next week",()=>{
  expect(parseNaturalDate("t5",today)).toBe("2026-10-29");
 });
});
describe("7D tokenized quick-add",()=>{
 it("recognizes multi-word people/labels plus priority and preserves title",()=>{
  const result=parseQuickAdd("Review mockups ngày mai @Mai Anh #Thiết kế !urgent",fixture(),today);
  expect(result).toMatchObject({title:"Review mockups",due:"2026-10-23",
   priority:"urgent",assigneeIds:["m"],labelIds:["design"]});
  expect(result.tokens).toHaveLength(4);
 });
 it("unknown tokens stay in title rather than being silently lost",()=>{
  const result=parseQuickAdd("Call @Unknown #NotFound !unknown tomorrow",fixture(),today);
  expect(result.title).toBe("Call @Unknown #NotFound !unknown");
  expect(result.due).toBe("2026-10-23");
 });
 it("creates task with exact properties and does not mutate initial collection",()=>{
  const data=fixture(),next=createQuickTask(data,"Finish +3d @Nam #Khẩn cấp !important",
   undefined,"",today);
  const row=next.records.at(-1)!;
  expect(Object.values(row.values)).toContain("Finish");
  expect(row.priority).toBe("important");
  expect(row.assigneeIds).toEqual(["n"]);
  expect(row.labelIds).toEqual(["urgent"]);
  expect(Object.values(row.values)).toContain("2026-10-25");
  expect(data.records).toHaveLength(0);
 });
 it("supports disabling token parsing",()=>{
  const data=fixture(),next=createQuickTask(data,"Draft !urgent mai",undefined,"",today,false);
  const row=next.records.at(-1)!;
  expect(Object.values(row.values)).toContain("Draft !urgent mai");
  expect(row.priority).toBe("medium");
 });
});
