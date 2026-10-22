import {describe,expect,it} from "vitest";
import {createCollection,type CollectionBlockPayload} from "../src/collections/model";
import {reorderBucket} from "../src/renderers/collectionBoardActions";
import {isPlannerMove} from "../src/renderers/CollectionUndoToast";
function fixture():CollectionBlockPayload{
 return {...createCollection(),
  fields:[{id:"name",name:"Name",type:"text"},
   {id:"bucket",name:"Bucket",type:"select",options:["To do","Doing","Done"]}],
  records:[{id:"a",values:{name:"Alpha",bucket:"To do"}},
   {id:"b",values:{name:"Beta",bucket:"Doing"}}]};
}
describe("Phase 7C-2b bucket order and global move feedback",()=>{
 it("moves a bucket without altering task assignments",()=>{
  const data=fixture(),next=reorderBucket(data,"bucket","Doing","To do");
  expect(next.fields[1].options).toEqual(["Doing","To do","Done"]);
  expect(data.fields[1].options).toEqual(["To do","Doing","Done"]);
  expect(next.records).toEqual(data.records);
  expect(isPlannerMove(data,next)).toBe(true);
 });
 it("ignores invalid or identical bucket targets",()=>{
  const data=fixture();
  expect(reorderBucket(data,"bucket","Doing","Doing")).toBe(data);
  expect(reorderBucket(data,"bucket","Unknown","To do")).toBe(data);
  expect(reorderBucket(data,"name","Doing","To do")).toBe(data);
 });
 it("identifies task moves without treating field value edits as moves",()=>{
  const data=fixture();
  expect(isPlannerMove(data,{...data,records:data.records.map((record,index)=>
   index===0?{...record,boardOrder:1}:record)})).toBe(true);
  expect(isPlannerMove(data,{...data,records:data.records.map((record,index)=>
   index===0?{...record,parentId:"b"}:record)})).toBe(true);
  expect(isPlannerMove(data,{...data,records:data.records.map((record,index)=>
   index===0?{...record,priority:"urgent"}:record)})).toBe(false);
 });
});
