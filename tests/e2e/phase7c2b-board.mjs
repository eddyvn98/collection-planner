import assert from "node:assert/strict";
import {mkdir} from "node:fs/promises";
import {chromium} from "../../.e2e/node_modules/playwright/index.mjs";
const browser=await chromium.launch({headless:true});
const url=process.env.SCREENSHOT_BASE_URL??"http://127.0.0.1:4173";
const out=process.env.SCREENSHOT_OUTPUT;
const fixture={version:1,title:"Board 7C-2b QA",fields:[
 {id:"name",name:"Name",type:"text"},
 {id:"due",name:"Due",type:"date"},
 {id:"bucket",name:"Bucket",type:"select",options:["To do","Doing","Done"]}],
 records:[
 {id:"alpha",values:{name:"Alpha",bucket:"To do",due:"2026-10-26"},priority:"medium"},
 {id:"beta",values:{name:"Beta",bucket:"Doing",due:"2026-10-27"},priority:"important"}],
 people:[{id:"mai",name:"Mai"},{id:"nam",name:"Nam"}],
 labels:[{id:"red",name:"Important",color:"#d13438"},{id:"blue",name:"Product",color:"#5B5FC7"}],
 views:[{id:"board",name:"Board",kind:"kanban",groupFieldId:"bucket"},
 {id:"grid",name:"Grid",kind:"table"}],activeViewId:"board"};
async function open(width){
 const page=await browser.newPage({viewport:{width,height:840}});
 await page.addInitScript(value=>localStorage.setItem("collection-planner:v1",JSON.stringify(value)),fixture);
 await page.goto(url,{waitUntil:"networkidle"});return page;
}
const data=page=>page.evaluate(()=>JSON.parse(localStorage.getItem("collection-planner:v1")));
async function until(page,field,value){
 await page.waitForFunction(({field,value})=>{
  const record=JSON.parse(localStorage.getItem("collection-planner:v1"))
   .records.find(x=>x.id==="alpha");
  return JSON.stringify(record?.[field])===JSON.stringify(value);
 },{field,value},{timeout:5000});
}
const card=(page,id)=>page.getByTestId("collection-kanban").locator(
 '[data-testid="collection-kanban-card"][data-record-id="'+id+'"]');
const edit=(page,kind)=>card(page,"alpha").getByRole("button",{
 name:"Edit "+kind+" for Alpha"});
async function drag(page,from,to){
 const a=await from.boundingBox(),b=await to.boundingBox();
 assert(a&&b,"Drag source/destination must exist");
 await page.mouse.move(a.x+a.width/2,a.y+a.height/2);
 await page.mouse.down();
 await page.mouse.move(a.x+a.width/2-12,a.y+a.height/2+4,{steps:8});
 await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:24});
 await page.mouse.up();
}
async function check(width,attempt){
 const page=await open(width);
 await edit(page,"due date").click();
 const due=page.getByRole("dialog",{name:"Edit due date for Alpha"});
 await due.getByRole("textbox",{name:"Due date for Alpha"}).fill("2026-11-15")
  .catch(async()=>due.locator('input[type="date"]').fill("2026-11-15"));
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem("collection-planner:v1"))
  .records.find(r=>r.id==="alpha")?.values.due==="2026-11-15");
 await due.getByRole("button",{name:"Done"}).click();
 await edit(page,"priority").click();
 await page.getByRole("dialog",{name:"Edit priority for Alpha"})
  .getByRole("button",{name:"Urgent"}).click();
 await until(page,"priority","urgent");
 await edit(page,"labels").click();
 const labels=page.getByRole("dialog",{name:"Edit labels for Alpha"});
 await labels.getByRole("checkbox",{name:"Important"}).check();
 await until(page,"labelIds",["red"]);
 await labels.getByRole("button",{name:"Done"}).click();
 await edit(page,"assignees").click();
 const people=page.getByRole("dialog",{name:"Edit assignees for Alpha"});
 await people.getByRole("checkbox",{name:"Mai"}).check();
 await until(page,"assigneeIds",["mai"]);
 await people.getByRole("button",{name:"Done"}).click();
 for(const kind of ["due date","priority","labels","assignees"]){
  const rect=await edit(page,kind).boundingBox();assert(rect?.height>=44&&rect.width>=44,
   "Touch target >=44: "+kind);
 }
 if(width===1280){
  const handle=page.getByRole("button",{name:"Drag bucket Doing"});
  const target=page.getByTestId("collection-kanban").locator(
   '[data-testid="collection-kanban-column"][data-status="bucket:To do"] header');
  await drag(page,handle,target);
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem("collection-planner:v1"))
   .fields.find(field=>field.id==="bucket")?.options[0]==="Doing",null,{timeout:5000});
  const toast=page.getByTestId("planner-undo-toast");
  assert((await toast.textContent()).includes("Đã di chuyển"));
  await toast.getByRole("button",{name:"Hoàn tác"}).click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem("collection-planner:v1"))
   .fields.find(field=>field.id==="bucket")?.options[0]==="To do",null,{timeout:5000});
 }
 await card(page,"alpha").getByRole("button",{name:"Alpha",exact:true}).click();
 await page.getByTestId("task-save-status").waitFor({state:"visible"});
 const title=page.getByRole("textbox",{name:"Task name"});
 await title.fill("Alpha renamed");
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem("collection-planner:v1"))
  .records.find(r=>r.id==="alpha")?.values.name==="Alpha renamed");
 await page.close();
 console.log("PASS 7C-2b Board badge editing / bucket reorder / undo "+width+" #"+attempt);
}
try{
 if(out){
  await mkdir(out,{recursive:true});
  for(const width of [1280,375]){
   const page=await open(width);
   if(await edit(page,"priority").count()){
    await edit(page,"priority").click();
    await page.getByRole("dialog",{name:"Edit priority for Alpha"}).getByRole("button",{name:"Urgent"}).click();
   }
   await page.screenshot({path:out+"/"+width+"-board.png",fullPage:true});
   await page.close();
  }
 }else for(const width of [1280,375])for(let i=1;i<=3;i++)await check(width,i);
}catch(error){console.error("FAIL 7C-2b Board",error);process.exitCode=1}
finally{await browser.close()}
