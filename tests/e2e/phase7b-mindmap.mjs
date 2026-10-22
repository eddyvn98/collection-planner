import assert from "node:assert/strict";
import {mkdir} from "node:fs/promises";
import {chromium} from "../../.e2e/node_modules/playwright/index.mjs";
const browser=await chromium.launch({headless:true});
const url=process.env.SCREENSHOT_BASE_URL??"http://127.0.0.1:4173";
const out=process.env.SCREENSHOT_OUTPUT;
const data={version:1,title:"Mind Map QA",
 fields:[{id:"name",name:"Name",type:"text"},{id:"start",name:"Start",type:"date"},
  {id:"due",name:"Due",type:"date"},{id:"bucket",name:"Bucket",type:"select",options:["Todo","Doing"]}],
 records:[
 {id:"root",values:{name:"Root",start:"2026-10-20",due:"2026-10-25",bucket:"Todo"},progress:"in_progress",priority:"important"},
 {id:"child",parentId:"root",values:{name:"Child",start:"2026-10-20",due:"2026-10-22",bucket:"Todo"},progress:"not_started"},
 {id:"sibling",values:{name:"Independent",start:"2026-10-22",due:"2026-10-24",bucket:"Doing"},progress:"not_started"}
 ],people:[{id:"me",name:"Me"}],labels:[],
 views:[{id:"map",name:"Mind Map",kind:"mindmap"},
 {id:"timeline",name:"Timeline",kind:"timeline",dateFieldId:"start",endDateFieldId:"due"},
 {id:"grid",name:"Grid",kind:"table"}],activeViewId:"map"};
const launch=async(width=1280,theme="light")=>{
 const page=await browser.newPage({viewport:{width,height:820}});
 await page.addInitScript(({fixture,dark})=>{
  localStorage.setItem("collection-planner:v1",JSON.stringify(fixture));
  localStorage.setItem("planner:dark",dark?"1":"0");
 },{fixture:data,dark:theme==="dark"});
 page.on("pageerror",error=>console.error("BROWSER ERROR",error.message));
 await page.goto(url,{waitUntil:"networkidle"});
 return page;
};
const records=page=>page.evaluate(()=>JSON.parse(localStorage.getItem("collection-planner:v1")).records);
const node=(page,id)=>page.locator('.react-flow__node[data-id="'+id+'"]');
async function verifyCanvas(page){
 const frame=page.getByTestId("collection-mindmap-graph");
 await frame.waitFor();
 const dimensions=await frame.evaluate(el=>{
  const flow=el.querySelector(".react-flow"),viewport=el.querySelector(".react-flow__viewport");
  return {width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,
   flowHeight:flow?.getBoundingClientRect().height,flowWidth:flow?.getBoundingClientRect().width,
   rendered:viewport?.children.length};
 });
 assert(dimensions.width>280&&dimensions.height>=420&&dimensions.flowHeight>=420,
  "Mind Map graph must have actual positive height: "+JSON.stringify(dimensions));
 assert(dimensions.rendered>=3,"Mind Map React Flow viewport must contain rendered nodes");
 await node(page,"root").waitFor();
 return dimensions;
}
try {
 if(out){
  await mkdir(out,{recursive:true});
  for(const width of [1280,375])for(const theme of ["light","dark"]){
   const page=await launch(width,theme);
   await page.screenshot({path:`${out}/${width}-${theme}-mindmap.png`,fullPage:true});
   if(width<640){await page.getByRole("button",{name:"Choose view"}).click();
    await page.getByRole("menuitemradio",{name:"Timeline"}).click();}
   else await page.getByRole("button",{name:"Timeline",exact:true}).click();
   await page.screenshot({path:`${out}/${width}-${theme}-timeline-undo.png`,fullPage:true});
   await page.close();
  }
  console.log("PASS Phase 7B 8 responsive screenshot fixtures");
 } else {
  const page=await launch();
  const size=await verifyCanvas(page);
  console.log("PASS Mind Map renders nodes with positive height",size);
  await page.setViewportSize({width:375,height:812});
  await verifyCanvas(page);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  assert(overflow<=1,"Mind Map caused mobile horizontal overflow: "+overflow);
  console.log("PASS Mind Map fitView on resize 1280 → 375");
  await page.setViewportSize({width:1280,height:820});
  await node(page,"root").click();
  const graph=page.getByTestId("collection-mindmap-graph");
  await graph.focus();await graph.press("F2");
  const title=graph.getByRole("textbox",{name:"Rename Root"});
  await title.fill("Renamed Root");await title.press("Enter");
  assert.equal((await records(page)).find(r=>r.id==="root").values.name,"Renamed Root");
  console.log("PASS direct F2 rename persists");
  await node(page,"root").getByRole("button",{name:"Add child to Renamed Root"}).click();
  const after=await records(page),created=after.find(r=>!data.records.some(orig=>orig.id===r.id));
  assert(created&&created.parentId==="root","Node + adds direct child");
  await node(page,created.id).waitFor();
  console.log("PASS node + creates child and renders in graph");
  await graph.getByRole("button",{name:"Collapse Renamed Root"}).click();
  assert.equal(await node(page,"child").count(),0);
  await graph.getByRole("button",{name:"Expand Renamed Root"}).click();
  assert.equal(await node(page,"child").count(),1);
  await page.getByRole("button",{name:"Tidy up Mind Map"}).click();
  console.log("PASS collapse/expand and Tidy up");
  const undo=page.getByRole("button",{name:"Undo last change"}).first();
  assert(await undo.isVisible()&&await undo.isEnabled());
  await undo.click();
  assert.equal((await records(page)).some(r=>r.id===created.id),false);
  const redo=page.getByRole("button",{name:"Redo last change"}).first();
  await redo.click();
  assert.equal((await records(page)).some(r=>r.id===created.id),true);
  console.log("PASS Mind Map visible Undo/Redo for branch creation");
  const dragSource=node(page,"sibling").locator("strong");
  const parentTarget=node(page,"root");
  const from=await dragSource.boundingBox(),to=await parentTarget.boundingBox();
  assert(from&&to,"Mind Map drag endpoints visible");
  await page.mouse.move(from.x+from.width/2,from.y+from.height/2);
  await page.mouse.down();
  await page.mouse.move(to.x+to.width/2,to.y+to.height/2,{steps:20});
  await page.mouse.up();
  assert.equal((await records(page)).find(r=>r.id==="sibling").parentId,"root");
  console.log("PASS Mind Map pointer drag reparent persists ID");
  const existing=await records(page);
  const sourceHandle=node(page,"root").locator(".react-flow__handle.source");
  const hb=await sourceHandle.boundingBox(),frame=await graph.boundingBox();
  assert(hb&&frame,"Handle and canvas must be visible");
  await page.mouse.move(hb.x+hb.width/2,hb.y+hb.height/2);
  await page.mouse.down();
  await page.mouse.move(frame.x+frame.width-28,frame.y+35,{steps:22});
  await page.mouse.up();
  const afterHandle=await records(page);
  assert(afterHandle.length===existing.length+1,"Handle to empty canvas creates a child");
  assert(afterHandle.find(row=>!existing.some(old=>old.id===row.id))?.parentId==="root");
  console.log("PASS drag from handle onto canvas creates sub-task");
  await node(page,"sibling").click();
  await page.getByRole("button",{name:"Delete selected node"}).click();
  await page.getByRole("alertdialog",{name:"Delete Mind Map branch?"}).getByRole("button",{name:"Delete branch"}).click();
  assert(!(await records(page)).some(r=>r.id==="sibling"));
  console.log("PASS Mind Map delete confirmation");
  await page.getByRole("button",{name:"Timeline",exact:true}).click();
  const timeline=page.getByTestId("collection-timeline");
  await timeline.waitFor();
  assert(await timeline.getByRole("button",{name:"Undo last change"}).isVisible());
  assert(await timeline.getByRole("button",{name:"Redo last change"}).isVisible());
  console.log("PASS Timeline visible Undo/Redo controls");
  await page.close();
 }
}catch(e){console.error("FAIL Phase 7B Playwright",e);process.exitCode=1}
finally{await browser.close()}
