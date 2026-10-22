import assert from "node:assert/strict";
import {chromium} from "../../.e2e/node_modules/playwright/index.mjs";
const browser=await chromium.launch({headless:true});
const fixture={version:1,title:"Phase 5E plan",fields:[
{id:"name",name:"Name",type:"text"},{id:"status",name:"Status",type:"select",options:["To do","In progress","Done"]},
{id:"due",name:"Due",type:"date"},{id:"start",name:"Start",type:"date"},
{id:"bucket",name:"Bucket",type:"select",options:["To do","In progress","Done"]}],
records:[
 {id:"moving",values:{name:"Move this task",status:"To do",bucket:"To do",due:"2026-10-10"},
  progress:"not_started",priority:"urgent",assigneeIds:[],labelIds:[],attachments:[],comments:[],activity:[]},
 {id:"destination",values:{name:"Target task",status:"In progress",bucket:"In progress"},
  progress:"not_started",priority:"medium",assigneeIds:[],labelIds:[],attachments:[],comments:[],activity:[]}],
people:[],labels:[],views:[
{id:"board",name:"Board",kind:"kanban",groupFieldId:"bucket"},
{id:"grid",name:"Grid",kind:"table"},
{id:"schedule",name:"Schedule",kind:"calendar",dateFieldId:"start",endDateFieldId:"due"},
{id:"charts",name:"Charts",kind:"charts"}],activeViewId:"board"};
try{
 const page=await browser.newPage({viewport:{width:1280,height:850}});
 await page.addInitScript(data=>{localStorage.setItem("collection-planner:v1",JSON.stringify(data));
  localStorage.setItem("planner:dark","0");},fixture);
 await page.goto("http://127.0.0.1:4173/",{waitUntil:"networkidle"});
 const source=page.locator('[data-record-id="moving"][data-testid="collection-kanban-card"]');
 const destination=page.locator('[data-record-id="destination"][data-testid="collection-kanban-card"]');
 await source.waitFor();await destination.waitFor();
 assert.match(await source.getByTestId("card-priority").textContent(),/Urgent/);
 assert.equal(await source.getByTestId("card-due").textContent(),"10/10");
 assert.equal(await destination.getByTestId("card-priority").count(),0,"Medium must not show flag");
 const handle=source.locator('button[aria-label="Drag Move this task"]');
 const from=await handle.boundingBox(),to=await destination.boundingBox();
 assert(from&&to,"Need both drag bounds");
 const sx=from.x+from.width/2,sy=from.y+from.height/2;
 const tx=to.x+to.width/2,ty=to.y+to.height/2;
 await page.mouse.move(sx,sy);await page.mouse.down();
 for(let step=1;step<=12;step++){
  await page.mouse.move(sx+(tx-sx)*step/12,sy+(ty-sy)*step/12);
  await page.waitForTimeout(20);
 }
 await page.mouse.up();
 await page.waitForFunction(()=>{
  const data=JSON.parse(localStorage.getItem("collection-planner:v1")??"{}");
  return data.records?.find(r=>r.id==="moving")?.values.bucket==="In progress";
 },null,{timeout:8000});
 const moved=page.locator('[data-status="bucket:In progress"] [data-record-id="moving"]');
 await moved.waitFor();
 console.log("PASS 12-step pointer drag across buckets");
 const open=moved.locator("[data-board-card-focus]");
 await open.click();
 await page.getByRole("dialog",{name:"Task Move this task"}).waitFor();
 await page.keyboard.press("Escape");
 await page.getByRole("dialog",{name:"Task Move this task"}).waitFor({state:"detached"});
 await page.waitForFunction(()=>document.activeElement?.matches("[data-record-id='moving'] [data-board-card-focus]"));
 console.log("PASS Esc closes drawer and restores focus to exact moved card");
 const filter=page.locator('button[aria-label="Filters"]');
 await filter.click();await page.getByLabel("Filter priority").selectOption("urgent");
 await filter.click();
 await page.getByRole("button",{name:"Remove Priority: urgent"}).click();
 assert.equal(await page.getByTestId("planner-active-filter-chips").count(),0);
 console.log("PASS remove one filter chip");
 await page.getByRole("button",{name:"More plan actions"}).click();
 await page.getByRole("button",{name:"Toggle dark mode"}).click();
 await page.waitForFunction(()=>document.documentElement.classList.contains("dark"));
 const bg=await page.evaluate(()=>{
  const style=e=>getComputedStyle(e).backgroundColor;
  return {html:style(document.documentElement),body:style(document.body),
   root:style(document.querySelector("#root")),htmlHeight:document.documentElement.scrollHeight,
   viewport:window.innerHeight};
 });
 for(const value of [bg.html,bg.body,bg.root])assert.equal(value,"rgb(31, 31, 31)");
 assert(bg.htmlHeight>=bg.viewport);
 await open.click();
 const pane=page.getByRole("dialog",{name:"Task Move this task"});
 const date=pane.getByLabel("Task due date"),select=pane.getByLabel("Task bucket");
 for(const control of [date,select]){
  const style=await control.evaluate(el=>({
   background:getComputedStyle(el).backgroundColor,border:getComputedStyle(el).borderTopColor}));
  assert.equal(style.background,"rgb(41, 41, 41)");
  assert.equal(style.border,"rgb(133, 133, 133)");
 }
 console.log("PASS full viewport dark tokens and native date/select");
 await page.keyboard.press("Escape");
 const mobile=await browser.newPage({viewport:{width:375,height:812}});
 await mobile.addInitScript(data=>localStorage.setItem("collection-planner:v1",JSON.stringify(data)),fixture);
 await mobile.goto("http://127.0.0.1:4173/",{waitUntil:"networkidle"});
 const board=mobile.getByTestId("collection-kanban");
 const cols=board.locator('[data-testid="collection-kanban-column"]');
 const first=await cols.nth(0).boundingBox(),second=await cols.nth(1).boundingBox();
 assert(first&&second,"Need two buckets");
 const visible=await board.boundingBox();
 assert(visible&&second.x<visible.x+visible.width-4,"Next bucket should peek into viewport");
 assert(second.x>first.x);
 const snap=await board.evaluate(el=>getComputedStyle(el).scrollSnapType);
 assert(snap.includes("mandatory"));
 console.log("PASS 375px board next-bucket peek and mandatory scroll snap");
 await mobile.close();await page.close();
}catch(error){console.error("FAIL Phase5E",error);process.exitCode=1;}
finally{await browser.close();}
