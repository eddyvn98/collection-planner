import {describe,expect,it} from "vitest";
import {createCollection,type CollectionBlockPayload} from "../src/collections/model";
import {fillGridDown,parseSpreadsheetMatrix,pasteGridCells} from "../src/collections/collectionGridSpreadsheet";
function fixture():CollectionBlockPayload{
 const data=createCollection();
 return {...data,fields:[
  {id:"name",name:"Name",type:"text"},
  {id:"due",name:"Due",type:"date"},
  {id:"cost",name:"Cost",type:"number"},
  {id:"bucket",name:"Bucket",type:"select",options:["To do","Doing"]}],
  records:[
   {id:"a",values:{name:"First",due:"2026-10-20",cost:"10",bucket:"To do"}},
   {id:"b",values:{name:"Second",due:"2026-10-21",cost:"20",bucket:"Doing"}},
   {id:"c",values:{name:"Third",due:"",cost:"",bucket:"To do"}}]};
}
describe("7C-2a spreadsheet operations",()=>{
 it("reads Excel TSV and quoted CSV including comma and line breaks",()=>{
  expect(parseSpreadsheetMatrix("One\t2026-10-22\nTwo\t2026-10-23\n"))
   .toEqual([["One","2026-10-22"],["Two","2026-10-23"]]);
  expect(parseSpreadsheetMatrix('"A, B",12\n"C""D",13'))
   .toEqual([["A, B","12"],['C"D',"13"]]);
 });
 it("pastes rectangular data using stable visible row IDs and column IDs",()=>{
  const data=fixture(),next=pasteGridCells(data,["a","c","b"],["name","due"],0,0,
   [["Changed","2026-12-01"],["Next","2026-12-02"]]);
  expect(next.records.find(r=>r.id==="a")?.values).toMatchObject({name:"Changed",due:"2026-12-01"});
  expect(next.records.find(r=>r.id==="c")?.values).toMatchObject({name:"Next",due:"2026-12-02"});
  expect(data.records.find(r=>r.id==="a")?.values.name).toBe("First");
  expect(next.records.find(r=>r.id==="b")?.values.name).toBe("Second");
 });
 it("skips invalid number/date/select values rather than corrupting rows",()=>{
  const data=fixture(),next=pasteGridCells(data,["a"],["cost","due","bucket"],0,0,
   [["not a number","tomorrow","Unknown"]]);
  expect(next.records[0].values).toEqual(data.records[0].values);
  const valid=pasteGridCells(data,["a"],["cost","due","bucket"],0,0,
   [["-12.5","2026-12-31","Doing"]]);
  expect(valid.records[0].values).toMatchObject({cost:"-12.5",due:"2026-12-31",bucket:"Doing"});
 });
 it("fills down only checkbox-selected visible rows, preserving top-to-bottom source",()=>{
  const data=fixture(),next=fillGridDown(data,["c","a","b"],["b","c","a"],"name");
  expect(next.records.find(r=>r.id==="c")?.values.name).toBe("Third");
  expect(next.records.find(r=>r.id==="a")?.values.name).toBe("Third");
  expect(next.records.find(r=>r.id==="b")?.values.name).toBe("Third");
  expect(fillGridDown(data,["a","b"],["b"],"name")).toBe(data);
  expect(fillGridDown(data,["a","b"],["a","b"],"missing")).toBe(data);
 });
});
