import {describe,expect,it} from "vitest";
import {createCollection,type CollectionBlockPayload} from "../src/collections/model";
import {resizeScheduleRange} from "../src/collections/collectionSchedule";
import {formFields} from "../src/collections/collectionForm";
import {orderedGalleryRows,reorderGallery,reorderFormField} from "../src/collections/collectionViewReorder";
function fixture():CollectionBlockPayload{
 const original=createCollection();
 return {...original,fields:[
  {id:"name",name:"Name",type:"text"},
  {id:"start",name:"Start",type:"date"},
  {id:"due",name:"Due",type:"date"},
  {id:"bucket",name:"Bucket",type:"select",options:["To do","Doing"]}],
  records:[
   {id:"a",values:{name:"Alpha",start:"2026-10-16",due:"2026-10-18",bucket:"To do"}},
   {id:"b",values:{name:"Beta",start:"2026-10-17",due:"2026-10-19",bucket:"Doing"}},
   {id:"c",values:{name:"Gamma",start:"2026-10-20",due:"2026-10-22",bucket:"Doing"}}],
  views:[
   {id:"schedule",kind:"calendar",name:"Schedule",dateFieldId:"start",endDateFieldId:"due"},
   {id:"gallery",kind:"gallery",name:"Gallery"},
   {id:"form",kind:"form",name:"Form",formFieldIds:["name","start","due","bucket"]}],
  activeViewId:"gallery"};
}
describe("7C-2c Schedule range resize",()=>{
 it("updates only the dragged edge and persists dates",()=>{
  const data=fixture(),view=data.views[0];
  const end=resizeScheduleRange(data,view,"a","end","2026-10-20");
  expect(end.records[0].values).toMatchObject({start:"2026-10-16",due:"2026-10-20"});
  const start=resizeScheduleRange(end,view,"a","start","2026-10-15");
  expect(start.records[0].values).toMatchObject({start:"2026-10-15",due:"2026-10-20"});
  expect(data.records[0].values.due).toBe("2026-10-18");
 });
 it("rejects inverted, malformed, unavailable or unchanged dates",()=>{
  const data=fixture(),view=data.views[0];
  expect(resizeScheduleRange(data,view,"a","start","2026-10-30")).toBe(data);
  expect(resizeScheduleRange(data,view,"a","end","2026-10-10")).toBe(data);
  expect(resizeScheduleRange(data,view,"a","end","2026-02-30")).toBe(data);
  expect(resizeScheduleRange(data,view,"unknown","end","2026-10-21")).toBe(data);
  expect(resizeScheduleRange(data,view,"a","end","2026-10-18")).toBe(data);
  expect(resizeScheduleRange(data,{...view,endDateFieldId:"start"},"a","start","2026-10-14")).toBe(data);
 });
});
describe("7C-2c persisted view-specific ordering",()=>{
 it("keeps Gallery order after reorder, ignoring other views and new cards",()=>{
  const data=fixture(),updated=reorderGallery(data,"gallery","c","a");
  const view=updated.views[1];
  expect(view.galleryOrderIds).toEqual(["c","a","b"]);
  expect(orderedGalleryRows(data.records,view).map(row=>row.id)).toEqual(["c","a","b"]);
  expect(orderedGalleryRows([...data.records,{id:"d",values:{name:"New"}}],view)
   .map(row=>row.id)).toEqual(["c","a","b","d"]);
  expect(data.records.map(row=>row.id)).toEqual(["a","b","c"]);
  expect(reorderGallery(data,"gallery","a","a")).toBe(data);
 });
 it("Form persisted drag order is also the submission control order",()=>{
  const data=fixture(),changed=reorderFormField(data,"form","due","name");
  expect(changed.views[2].formFieldIds).toEqual(["due","name","start","bucket"]);
  expect(formFields(changed,changed.views[2]).map(field=>field.id))
   .toEqual(["due","name","start","bucket"]);
  expect(formFields(data,data.views[2]).map(field=>field.id))
   .toEqual(["name","start","due","bucket"]);
  expect(reorderFormField(data,"form","none","name")).toBe(data);
 });
});
