import assert from "node:assert/strict";
import {mkdir} from "node:fs/promises";
import {chromium} from "../../.e2e/node_modules/playwright/index.mjs";
const browser=await chromium.launch({headless:true});
const url=process.env.SCREENSHOT_BASE_URL??"http://127.0.0.1:4173";
const out=process.env.SCREENSHOT_OUTPUT;
const fixture={version:1,title:"Hierarchy QA",fields:[
 {id:"name",name:"Name",type:"text"},{id:"start",name:"Start",type:"date"},
 {id:"due",name:"Due",type:"date"},{id:"bucket",name:"Bucket",type:"select",options:["To do","Doing"]}],
 records:[
  {id:"root",values:{name:"Project",bucket:"To do"},progress:"in_progress",priority:"medium"},
  {id:"design",parentId:"root",values:{name:"Design",bucket:"To do"},progress:"not_started"},
  {id:"check",parentId:"design",values:{name:"Check",bucket:"To do"},progress:"not_started"},
  {id:"ship",values:{name:"Ship",bucket:"To do"},progress:"not_started"}],
 people:[{id:"p1",name:"Mai"}],labels:[],
 views:[{id:"board",name:"Board",kind:"kanban",groupFieldId:"bucket"},
  {id:"grid",name:"Grid",kind:"table"}],activeViewId:"board"};
const open=async(width,theme)=>{
 const page=await browser.newPage({viewport:{width,height:840}});
 await page.addInitScript(({data,dark})=>{
  localStorage.setItem("collection-planner:v1",JSON.stringify(data));
  localStorage.setItem("planner:dark",dark?"1":"0");
 },{data:fixture,dark:theme==="dark"});
 await page.goto(url,{waitUntil:"networkidle"});
 return page;
};
const saved=page=>page.evaluate(()=>JSON.parse(localStorage.getItem("collection-planner:v1")));
try{
 if(out){
  await mkdir(out,{recursive:true});
  for(const width of [1280,375])for(const theme of ["light","dark"]){
   const page=await open(width,theme);
   await page.screenshot({path:`${out}/${width}-${theme}-board.png`,fullPage:true});
   const root=page.locator('[data-testid="collection-kanban-card"][data-record-id="root"]');
   await root.locator("[data-board-card-focus]").click();
   await page.getByRole("dialog",{name:"Task Project"}).waitFor();
   await page.screenshot({path:`${out}/${width}-${theme}-drawer.png`,fullPage:true});
   await page.close();
  }
  console.log("PASS Phase 6D screenshot fixtures");
 }else{
  const page=await open(1280,"light");
  assert.equal(await page.locator('[data-testid="collection-kanban-card"][data-record-id="design"]').count(),0);
  const show=page.getByRole("checkbox",{name:"Show sub-tasks"});
  await show.check();
  assert.equal(await page.locator('[data-testid="collection-kanban-card"][data-record-id="design"]').count(),1);
  assert((await page.locator('[data-testid="collection-kanban-card"][data-record-id="root"]').textContent()).includes("0/2"));
  const root=page.locator('[data-testid="collection-kanban-card"][data-record-id="root"]');
  await root.locator("[data-board-card-focus]").click();
  const drawer=page.getByRole("dialog",{name:"Task Project"});
  await drawer.waitFor();
  assert(await drawer.locator("#task-subtasks").isVisible());
  const input=drawer.getByRole("textbox",{name:"New sub-task title"});
  await input.fill("Write release notes");await input.press("Enter");
  assert((await saved(page)).records.some(x=>x.values.name==="Write release notes"&&x.parentId==="root"));
  await input.fill("Run final QA");await input.press("Enter");
  assert((await saved(page)).records.filter(x=>x.parentId==="root").length===3);
  await drawer.locator('[data-subtask-id="design"]').getByRole("button",{name:"Design",exact:true}).click();
  await page.getByRole("dialog",{name:"Task Design"}).waitFor();
  const breadcrumb=page.getByRole("navigation",{name:"Task hierarchy"});
  assert((await breadcrumb.textContent()).includes("Project"));
  assert((await breadcrumb.textContent()).includes("Design"));
  await breadcrumb.getByRole("button",{name:"Project"}).click();
  await page.getByRole("button",{name:"Close task details"}).click();
  await page.getByRole("button",{name:"Grid",exact:true}).click();
  const table=page.getByTestId("collection-tanstack-table");
  const parent=table.locator('[data-record-id="root"]');
  await parent.getByRole("button",{name:"Collapse Project"}).click();
  assert.equal(await table.locator('[data-record-id="design"]').count(),0);
  await parent.getByRole("button",{name:"Expand Project"}).click();
  assert.equal(await table.locator('[data-record-id="design"]').count(),1);
  const handle=table.locator('[data-record-id="ship"]').getByRole("button",{name:"Move Ship"});
  await handle.focus();await handle.press("Tab");
  assert((await saved(page)).records.find(x=>x.id==="ship").parentId);
  console.log("PASS Board default hidden, drawer quick-add/breadcrumb, Grid collapse and keyboard indent");
  await page.close();
  const mobile=await open(375,"dark");
  const rootMobile=mobile.locator('[data-testid="collection-kanban-card"][data-record-id="root"]');
  assert(await rootMobile.getByRole("button",{name:"Delete Project"}).count()===1);
  await rootMobile.getByRole("button",{name:"Delete Project"}).click();
  await mobile.getByRole("alertdialog",{name:"Delete Project task?"}).getByRole("button",{name:"Promote children"}).click();
  const result=await saved(mobile);
  assert(result.records.find(x=>x.id==="design")?.parentId==null);
  console.log("PASS Board direct branch-delete promotion at 375px");
  await mobile.close();
 }
}catch(e){console.error("FAIL Phase 6D UI",e);process.exitCode=1;}
finally{await browser.close();}
