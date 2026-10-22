import assert from "node:assert/strict";
import {mkdir} from "node:fs/promises";
import {chromium} from "../../.e2e/node_modules/playwright/index.mjs";
const browser=await chromium.launch({headless:true});
const url=process.env.SCREENSHOT_BASE_URL??"http://127.0.0.1:4173";
const output=process.env.SCREENSHOT_OUTPUT;
const fixture={version:1,title:"7D Input QA",fields:[
 {id:"name",name:"Name",type:"text"},{id:"status",name:"Status",type:"select",options:["To do","Doing","Done"]},
 {id:"start",name:"Start",type:"date"},{id:"due",name:"Due",type:"date"},
 {id:"bucket",name:"Bucket",type:"select",options:["To do","Doing"]}],
 records:[{id:"existing",values:{name:"Existing",status:"To do",bucket:"To do"},
 priority:"medium",progress:"not_started"}],
 people:[{id:"mai",name:"Mai"},{id:"nam",name:"Nam"}],
 labels:[{id:"ui",name:"UI",color:"#5B5FC7"}],
 views:[{id:"board",name:"Board",kind:"kanban",groupFieldId:"bucket"},
 {id:"grid",name:"Grid",kind:"table"}],activeViewId:"board"};
async function launch(width){
 const context=await browser.newContext({viewport:{width,height:860},hasTouch:width<640,isMobile:width<640});
 const page=await context.newPage();
 await page.addInitScript(f=>{
  if(!localStorage.getItem("collection-planner:v1"))
   localStorage.setItem("collection-planner:v1",JSON.stringify(f));
 },fixture);
 await page.goto(url,{waitUntil:"networkidle"});
 return {page,context};
}
const stored=page=>page.evaluate(()=>JSON.parse(localStorage.getItem("collection-planner:v1")));
const card=(page,id)=>page.getByTestId("collection-kanban").locator(
 '[data-testid="collection-kanban-card"][data-record-id="'+id+'"]');
async function awaitRecord(page,name){
 await page.waitForFunction(name=>JSON.parse(localStorage.getItem("collection-planner:v1"))
  .records.some(row=>row.values.name===name),name);
 return (await stored(page)).records.find(row=>row.values.name===name);
}
async function run(width,attempt){
 const {page,context}=await launch(width);
 const bucket=page.getByTestId("collection-kanban").locator(
  '[data-testid="collection-kanban-column"][data-status="bucket:To do"]');
 await bucket.getByRole("button",{name:"Add task",exact:true}).click();
 const input=bucket.getByRole("textbox",{name:"New task in To do"});
 await input.fill("Design review mai @Mai #UI !urgent");
 const chips=bucket.getByTestId("quick-add-preview");
 await chips.locator('[data-token-kind="date"]').waitFor();
 assert.equal(await chips.locator("span[data-token-kind]").count(),4);
 await input.press("Enter");
 const added=await awaitRecord(page,"Design review");
 assert.equal(added.priority,"urgent");
 assert.deepEqual(added.assigneeIds,["mai"]);
 assert.deepEqual(added.labelIds,["ui"]);
 assert(added.values.due?.match(/^\d{4}-\d{2}-\d{2}$/),"Due date must be saved");
 await card(page,added.id).locator("[data-board-card-focus]").click();
 const drawer=page.getByRole("dialog",{name:/Task /});
 await drawer.waitFor();
 const picker=drawer.getByRole("button",{name:"Task due date",exact:true});
 await picker.click();
 const calendar=page.getByRole("dialog",{name:"Task due date picker"});
 const natural=calendar.getByRole("textbox",{name:"Natural date for Task due date"});
 await natural.fill("+3d");await natural.press("Enter");
 const expected=await page.evaluate(()=>{
  const date=new Date();date.setDate(date.getDate()+3);
  return [date.getFullYear(),String(date.getMonth()+1).padStart(2,"0"),
   String(date.getDate()).padStart(2,"0")].join("-");
 });
 await page.waitForFunction(({id,expected})=>JSON.parse(localStorage.getItem("collection-planner:v1"))
  .records.find(x=>x.id===id)?.values.due===expected,{id:added.id,expected});
 await drawer.getByRole("button",{name:"Close task details"}).click();
 await card(page,added.id).click({button:"right"});
 const menu=page.getByRole("menu",{name:"Task context actions"});
 await menu.waitFor();
 await menu.getByRole("menuitem",{name:"Select for bulk actions"}).click();
 const toolbar=page.getByRole("toolbar",{name:"Selected task actions"});
 await toolbar.waitFor();
 await toolbar.getByRole("button",{name:"Complete selected"}).click();
 await page.waitForFunction(id=>JSON.parse(localStorage.getItem("collection-planner:v1"))
  .records.find(x=>x.id===id)?.progress==="completed",added.id);
 if(width<640){
  await page.getByRole("button",{name:"Choose view"}).click();
  await page.getByRole("menuitemradio",{name:"Grid"}).click();
 }else await page.getByRole("button",{name:"Grid",exact:true}).click();
 const gridInput=page.locator('input[aria-label="New task title"]:visible');
 await gridInput.fill("Grid handoff +3d #UI !important");
 await page.locator('[data-testid="quick-add-preview"]:visible [data-token-kind="priority"]').waitFor();
 await gridInput.press("Enter");
 const gridTask=await awaitRecord(page,"Grid handoff");
 assert.equal(gridTask.priority,"important");
 assert.deepEqual(gridTask.labelIds,["ui"]);
 if(width<640){
  await page.getByRole("button",{name:"Choose view"}).click();
  await page.getByRole("menuitemradio",{name:"Board"}).click();
 }else await page.getByRole("button",{name:"Board",exact:true}).click();
 await page.getByRole("button",{name:"More plan actions"}).click();
 await page.getByRole("menuitem",{name:"Settings"}).click();
 await page.getByTestId("planner-input-settings").waitFor();
 const tokenSetting=page.getByRole("checkbox",{name:"Enable quick-add tokens"});
 assert.equal(await tokenSetting.isChecked(),true);
 await tokenSetting.uncheck();
 await page.getByRole("button",{name:"Close settings"}).click();
 await bucket.getByRole("button",{name:"Add task",exact:true}).click();
 const unchanged=bucket.getByRole("textbox",{name:"New task in To do"});
 await unchanged.fill("Literal !urgent #UI");
 assert.equal(await bucket.getByTestId("quick-add-preview").count(),0);
 await unchanged.press("Enter");
 await awaitRecord(page,"Literal !urgent #UI");
 if(width===375){
  const b=await card(page,"existing").boundingBox();
  assert(b,"Mobile task must exist");
  const client=await context.newCDPSession(page);
  const x=b.x+b.width/2,y=b.y+b.height/2;
  await client.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x,y}]});
  await client.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{x:x+105,y}]});
  await client.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem("collection-planner:v1"))
   .records.find(x=>x.id==="existing")?.progress==="completed");
  const longCard=card(page,(await awaitRecord(page,"Literal !urgent #UI")).id);
  const box=await longCard.boundingBox();
  assert(box,"Long-press target exists");
  const lx=box.x+box.width/2,ly=box.y+box.height/2;
  await client.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x:lx,y:ly}]});
  const longMenu=page.getByRole("menu",{name:"Task context actions"});
  await longMenu.waitFor();
  await client.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
  await longMenu.getByRole("menuitem",{name:"Select for bulk actions"}).click();
  await page.getByRole("toolbar",{name:"Selected task actions"}).waitFor();
  await page.getByRole("button",{name:"Clear selection"}).click();
 }
 console.log("PASS 7D input flow "+width+" iteration "+attempt);
 await context.close();
}
try{
 if(output){
  await mkdir(output,{recursive:true});
  for(const width of [1280,375]){
   const {page,context}=await launch(width);
   const bucket=page.getByTestId("collection-kanban");
   await bucket.screenshot({path:output+"/"+width+"-board.png"});
   await context.close();
  }
 }else for(const width of [1280,375])for(let i=1;i<=3;i++)await run(width,i);
}catch(error){console.error("FAIL 7D input flow",error);process.exitCode=1}
finally{await browser.close()}
