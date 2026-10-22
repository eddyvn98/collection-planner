import assert from "node:assert/strict";
import {mkdir} from "node:fs/promises";
import {chromium} from "../../.e2e/node_modules/playwright/index.mjs";
const browser=await chromium.launch({headless:true});
const url=process.env.SCREENSHOT_BASE_URL??"http://127.0.0.1:4173";
const out=process.env.SCREENSHOT_OUTPUT;
const fixture={version:1,title:"Collection Planner long title",fields:[
 {id:"name",name:"Name",type:"text"},{id:"start",name:"Start",type:"date"},
 {id:"due",name:"Due",type:"date"},
 {id:"bucket",name:"Bucket",type:"select",options:["To do","Doing"]}],
 records:[
 {id:"a",values:{name:"Alpha",start:"2026-10-16",due:"2026-10-18",bucket:"To do"},priority:"urgent"},
 {id:"b",values:{name:"Beta",start:"2026-10-17",due:"2026-10-19",bucket:"Doing"},priority:"medium"},
 {id:"c",values:{name:"Gamma",start:"2026-10-20",due:"2026-10-22",bucket:"To do"},priority:"low"}],
 people:[{id:"mai",name:"Mai"}],labels:[],
 views:[
 {id:"board",kind:"kanban",name:"Board",groupFieldId:"bucket"},
 {id:"schedule",kind:"calendar",name:"Schedule",dateFieldId:"start",endDateFieldId:"due"},
 {id:"gallery",kind:"gallery",name:"Gallery"},
 {id:"form",kind:"form",name:"Form",formFieldIds:["name","start","due","bucket"]}],
 activeViewId:"board"};
async function open(width,view="board"){
 const page=await browser.newPage({viewport:{width,height:840}});
 await page.addInitScript(({fixture,view})=>{
  localStorage.setItem("collection-planner:v1",JSON.stringify({...fixture,activeViewId:view}));
  localStorage.setItem("planner:dark","0");
 },{fixture,view});
 await page.goto(url,{waitUntil:"networkidle"});
 return page;
}
const saved=page=>page.evaluate(()=>JSON.parse(localStorage.getItem("collection-planner:v1")));
async function selectView(page,width,name){
 if(width<640){
  await page.getByRole("button",{name:"Choose view"}).click();
  await page.getByRole("menuitemradio",{name}).click();
 }else await page.getByRole("button",{name,exact:true}).click();
}
async function stored(page,test){
 await page.waitForFunction(test,null,{timeout:5000});
}
async function drag(page,source,target){
 await source.scrollIntoViewIfNeeded();
 const a=await source.boundingBox(),b=await target.boundingBox();
 assert(a&&b,"Both reorder targets must be rendered");
 await page.mouse.move(a.x+a.width/2,a.y+a.height/2);
 await page.mouse.down();
 await page.mouse.move(a.x+a.width/2+12,a.y+a.height/2+4,{steps:6});
 await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:18});
 await page.mouse.up();
}
async function check(width,attempt){
 const page=await open(width);
 const header=page.getByTestId("planner-header");
 const title=header.getByRole("textbox",{name:"Collection title"});
 const titleSize=await title.boundingBox();
 assert(titleSize&&titleSize.width>=120&&titleSize.height>=44,
  "Collection title must be >=120x44: "+JSON.stringify(titleSize));
 if(width===375){
  const headerBox=await header.boundingBox();
  assert(headerBox.width<=375,"Header must fit 375px");
  assert((await page.evaluate(()=>document.documentElement.scrollWidth))<=376,"No page horizontal overflow");
 }
 const priority=page.getByTestId("collection-kanban").locator(
  '[data-record-id="a"] [data-testid="card-priority"]');
 await priority.click();
 const popup=page.getByRole("dialog",{name:"Edit priority for Alpha"});
 await popup.waitFor({state:"visible"});
 const first=await popup.boundingBox();
 await page.waitForTimeout(160);
 const later=await popup.boundingBox();
 assert(first&&later&&Math.abs(first.x-later.x)<1&&Math.abs(first.y-later.y)<1,
  "Popover must be placed at final position immediately");
 await popup.getByRole("button",{name:"Important"}).click();
 await selectView(page,width,"Schedule");
 const day=date=>page.locator('[data-testid="collection-calendar-day"][data-date="'+date+'"]');
 const task=day("2026-10-18").locator('[data-testid="schedule-task"][data-record-id="a"]');
 const edge=task.getByTestId("schedule-resize-end");
 const edgeSize=await edge.boundingBox();
 assert(edgeSize&&edgeSize.width>=44&&edgeSize.height>=44);
 await drag(page,edge,day("2026-10-17"));
 await stored(page,()=>JSON.parse(localStorage.getItem("collection-planner:v1"))
  .records.find(r=>r.id==="a")?.values.due==="2026-10-17");
 const start=day("2026-10-17").locator('[data-testid="schedule-task"][data-record-id="a"]')
  .getByTestId("schedule-resize-start");
 await drag(page,start,day("2026-10-15"));
 await stored(page,()=>JSON.parse(localStorage.getItem("collection-planner:v1"))
  .records.find(r=>r.id==="a")?.values.start==="2026-10-15");
 const empty=day("2026-10-21");
 await empty.locator("div").first().dblclick();
 const add=empty.getByRole("textbox",{name:"Task title for 2026-10-21"});
 await add.fill("Created by double click");await add.press("Enter");
 await stored(page,()=>JSON.parse(localStorage.getItem("collection-planner:v1"))
  .records.some(r=>r.values.name==="Created by double click"&&r.values.due==="2026-10-21"));
 await selectView(page,width,"Gallery");
 const gallery=page.getByTestId("collection-gallery");
 const gcard=id=>gallery.locator('[data-testid="collection-gallery-card"][data-record-id="'+id+'"]');
 await drag(page,gcard("b").getByRole("button",{name:"Reorder gallery Beta"}),gcard("a"));
 await stored(page,()=>JSON.parse(localStorage.getItem("collection-planner:v1"))
  .views.find(v=>v.id==="gallery")?.galleryOrderIds?.[0]==="b");
 await page.reload({waitUntil:"networkidle"});
 const order=await page.getByTestId("collection-gallery").locator('[data-testid="collection-gallery-card"]')
  .evaluateAll(nodes=>nodes.map(n=>n.getAttribute("data-record-id")));
 assert.deepEqual(order.slice(0,3),["b","a","c"],"Gallery order persists after reload");
 await selectView(page,width,"Form");
 const form=page.getByTestId("collection-form");
 const ffield=id=>form.locator('[data-reorder-kind="form"][data-reorder-id="'+id+'"]');
 await drag(page,ffield("due").getByRole("button",{name:"Reorder form Due"}),ffield("name"));
 await stored(page,()=>JSON.parse(localStorage.getItem("collection-planner:v1"))
  .views.find(v=>v.id==="form")?.formFieldIds?.[0]==="due");
 const visible=await form.locator('[data-reorder-kind="form"]')
  .evaluateAll(nodes=>nodes.map(n=>n.getAttribute("data-reorder-id")));
 assert.equal(visible[0],"due");
 await selectView(page,width,"Board");
 const board=page.getByTestId("collection-kanban");
 await board.locator('[data-record-id="a"] [data-board-card-focus]').click();
 await page.getByTestId("task-save-status").waitFor();
 const input=page.getByRole("textbox",{name:"Task name"});
 await input.fill("Alpha edited");
 await stored(page,()=>JSON.parse(localStorage.getItem("collection-planner:v1"))
  .records.find(r=>r.id==="a")?.values.name==="Alpha edited");
 await page.close();
 console.log("PASS 7C-2c Schedule/Gallery/Form/header/popover "+width+" #"+attempt);
}
try{
 if(out){
  await mkdir(out,{recursive:true});
  for(const width of [1280,375])for(const view of ["board","schedule","gallery","form"]){
   const page=await open(width,view);
   if(view==="board"&&url.includes("4173")){
    await page.getByRole("button",{name:"Edit priority for Alpha"}).click();
   }
   await page.screenshot({path:out+"/"+width+"-"+view+".png",fullPage:true});
   await page.close();
  }
 }else for(const width of [1280,375])for(let attempt=1;attempt<=3;attempt++)
  await check(width,attempt);
}catch(error){console.error("FAIL 7C-2c",error);process.exitCode=1}
finally{await browser.close()}
