import assert from "node:assert/strict";
import {mkdir} from "node:fs/promises";
import {chromium} from "../../.e2e/node_modules/playwright/index.mjs";
const browser=await chromium.launch({headless:true});
const baseUrl=process.env.SCREENSHOT_BASE_URL??"http://127.0.0.1:4173";
const output=process.env.SCREENSHOT_OUTPUT;
const fixture={version:1,title:"Timeline QA",fields:[
 {id:"name",name:"Name",type:"text"},{id:"start",name:"Start",type:"date"},
 {id:"due",name:"Due",type:"date"},{id:"bucket",name:"Bucket",type:"select",options:["To do","Done"]}],
 records:[
 {id:"parent",values:{name:"Project",start:"2026-10-20",due:"2026-10-22",bucket:"To do"},progress:"in_progress"},
 {id:"child",parentId:"parent",values:{name:"Design",start:"2026-10-20",due:"2026-10-21",bucket:"To do"},progress:"not_started"},
 {id:"other",values:{name:"Release",start:"2026-10-24",due:"2026-10-27",bucket:"Done"},progress:"not_started"}],
 people:[],labels:[],views:[
 {id:"timeline",name:"Timeline",kind:"timeline",dateFieldId:"start",endDateFieldId:"due"},
 {id:"grid",name:"Grid",kind:"table"},
 {id:"board",name:"Board",kind:"kanban",groupFieldId:"bucket"}],
 activeViewId:"timeline"};
const open=async(width,theme,view="timeline")=>{
 const page=await browser.newPage({viewport:{width,height:820}});
 await page.addInitScript(({data,dark,activeView})=>{
  localStorage.setItem("collection-planner:v1",JSON.stringify({...data,activeViewId:activeView}));
  localStorage.setItem("planner:dark",dark?"1":"0");
 },{data:fixture,dark:theme==="dark",activeView:view});
 await page.goto(baseUrl,{waitUntil:"networkidle"});
 return page;
};
const record=async(page,id)=>page.evaluate(id=>JSON.parse(localStorage.getItem("collection-planner:v1")).records.find(x=>x.id===id),id);
async function drag(page,source,dx,dy=0){
 const box=await source.boundingBox();assert(box,"drag source visible");
 const x=box.x+Math.min(box.width-3,Math.max(3,box.width/2)),y=box.y+box.height/2;
 await page.mouse.move(x,y);await page.mouse.down();
 await page.mouse.move(x+dx,y+dy,{steps:16});await page.mouse.up();
}
try{
 if(output){
  await mkdir(output,{recursive:true});
  for(const width of [1280,375])for(const theme of ["light","dark"]){
   const page=await open(width,theme);
   await page.screenshot({path:`${output}/${width}-${theme}-timeline.png`});
   await page.close();
   const grid=await open(width,theme,"grid");
   await grid.screenshot({path:`${output}/${width}-${theme}-mobile-grid.png`});
   await grid.close();
  }
  console.log("PASS Phase 7A 8 screenshot fixtures");
 }else{
  const page=await open(1280,"light");
  const timeline=page.getByTestId("collection-timeline");
  await timeline.waitFor();
  const range=await timeline.locator("strong.tabular-nums").first().textContent();
  const parent=page.locator('[data-testid="collection-timeline-row"][data-record-id="parent"]');
  let bar=parent.getByTestId("collection-gantt-bar");
  await drag(page,bar,56);
  assert.equal((await record(page,"parent")).values.start,"2026-10-22");
  assert.equal((await record(page,"child")).values.start,"2026-10-22");
  assert.equal(await timeline.locator("strong.tabular-nums").first().textContent(),range);
  console.log("PASS Timeline bar move shifts entire branch, axis stays anchored");
  bar=parent.getByTestId("collection-gantt-bar");
  await drag(page,bar.getByTestId("gantt-right-handle"),56);
  assert.equal((await record(page,"parent")).values.due,"2026-10-26");
  await drag(page,bar.getByTestId("gantt-left-handle"),-28);
  assert.equal((await record(page,"parent")).values.start,"2026-10-21");
  console.log("PASS right and left edge resize");
  await bar.focus();await bar.press("ArrowRight");
  assert.equal((await record(page,"parent")).values.start,"2026-10-22");
  await bar.press("Shift+ArrowRight");
  assert.equal((await record(page,"parent")).values.due,"2026-10-28");
  console.log("PASS keyboard move and length change");
  const link=parent.getByRole("button",{name:"Link dependency from Project"});
  const other=page.locator('[data-testid="collection-timeline-row"][data-record-id="other"]');
  const a=await link.boundingBox(),b=await other.boundingBox();assert(a&&b);
  await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();
  await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:15});await page.mouse.up();
  assert((await record(page,"other")).dependsOn?.includes("parent"));
  const wire=page.getByTestId("timeline-dependency-wires").locator('[aria-label^="Remove timeline dependency"]');
  assert.equal(await wire.count(),1);
  await wire.focus();await wire.press("Enter");
  assert(!(await record(page,"other")).dependsOn?.includes("parent"));
  console.log("PASS visual dependency creation and keyboard removal");
  const empty=page.getByRole("group",{name:"Drag empty timeline to create task"});
  await drag(page,empty,84);
  const count=await page.evaluate(()=>JSON.parse(localStorage.getItem("collection-planner:v1")).records.length);
  assert.equal(count,4);
  await page.getByRole("combobox",{name:"Timeline ruler"}).selectOption("month");
  assert.equal(await page.getByTestId("collection-timeline-tick").count(),180);
  assert.equal(await page.getByRole("button",{name:"Zoom out timeline"}).isDisabled(),true);
  console.log("PASS drag-to-create and Month zoom");
  await page.getByRole("button",{name:"Add view"}).click();
  await page.getByRole("menuitem",{name:"Gallery"}).click();
  assert.equal(await page.getByRole("button",{name:"Gallery",exact:true}).getAttribute("aria-current"),"page");
  console.log("PASS Add Gallery auto-selects and shows tab");
  await page.close();
  const mobile=await open(375,"dark","grid");
  const cards=mobile.getByTestId("collection-mobile-grid");
  assert.equal(await cards.locator('[data-record-id="child"]').getAttribute("data-tree-depth"),"2");
  assert((await cards.locator('[data-record-id="child"]').textContent()).includes("Project"));
  await cards.locator('[data-record-id="parent"]').getByRole("button",{name:"Collapse Project"}).click();
  assert.equal(await cards.locator('[data-record-id="child"]').count(),0);
  assert((await mobile.evaluate(()=>document.documentElement.scrollWidth))<=375);
  await mobile.getByRole("button",{name:"Choose view"}).click();
  assert(await mobile.getByRole("menuitemradio",{name:"Timeline"}).count()===1);
  console.log("PASS mobile Grid hierarchy and advanced view picker at 375px");
  await mobile.close();
 }
}catch(error){console.error("FAIL Phase 7A Playwright",error);process.exitCode=1;}
finally{await browser.close();}
