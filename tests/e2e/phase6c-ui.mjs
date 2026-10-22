import assert from "node:assert/strict";
import {mkdir} from "node:fs/promises";
import {chromium} from "../../.e2e/node_modules/playwright/index.mjs";
const browser=await chromium.launch({headless:true});
const endpoint=process.env.SCREENSHOT_BASE_URL??"http://127.0.0.1:4173";
const screenshots=process.env.SCREENSHOT_OUTPUT;
const base={version:1,title:"Tree test",fields:[
 {id:"name",name:"Name",type:"text"},
 {id:"start",name:"Start",type:"date"},
 {id:"due",name:"Due",type:"date"},
 {id:"bucket",name:"Bucket",type:"select",options:["To do","Done"]}],
 records:[
 {id:"root",values:{name:"Launch",bucket:"To do",start:"2026-10-20",due:"2026-10-22"},progress:"in_progress"},
 {id:"a",parentId:"root",values:{name:"Design",bucket:"To do",start:"2026-10-20",due:"2026-10-21"},progress:"completed"},
 {id:"b",parentId:"root",values:{name:"Build",bucket:"To do",start:"2026-10-20",due:"2026-10-22"},progress:"not_started"},
 {id:"c",parentId:"b",values:{name:"Verify",bucket:"To do",start:"2026-10-20",due:"2026-10-22"},progress:"not_started"}],
 people:[],labels:[],views:[{id:"board",name:"Board",kind:"kanban",groupFieldId:"bucket"},
 {id:"grid",name:"Grid",kind:"table"}],activeViewId:"board"};
const create=async(width,theme)=>{
 const page=await browser.newPage({viewport:{width,height:820}});
 await page.addInitScript(({data,dark})=>{
  localStorage.setItem("collection-planner:v1",JSON.stringify(data));
  localStorage.setItem("planner:dark",dark?"1":"0");
 },{data:base,dark:theme==="dark"});
 await page.goto(endpoint,{waitUntil:"networkidle"});
 return page;
};
async function deletion(page){
 const card=page.locator('[data-testid="collection-kanban-card"][data-record-id="root"]');
 await card.locator("[data-board-card-focus]").click();
 const drawer=page.getByRole("dialog",{name:"Task Launch"});
 await drawer.waitFor();
 await drawer.getByRole("button",{name:"Delete task",exact:true}).click();
 return page.getByRole("alertdialog",{name:"Delete task?"});
}
try {
 if(screenshots){
  await mkdir(screenshots,{recursive:true});
  for(const width of [1280,375])for(const theme of ["light","dark"]){
   const page=await create(width,theme);
   await page.screenshot({path:`${screenshots}/${width}-${theme}-board.png`});
   await deletion(page);
   await page.screenshot({path:`${screenshots}/${width}-${theme}-delete-dialog.png`});
   await page.close();
  }
  console.log("PASS Phase 6C before/after screenshot fixtures");
 }else{
  const page=await create(1280,"light");
  const dialog=await deletion(page);
  await dialog.getByRole("button",{name:"Keep sub-tasks (promote)"}).click();
  let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem("collection-planner:v1")));
  assert(!saved.records.some(x=>x.id==="root"));
  assert(saved.records.find(x=>x.id==="a")?.parentId==null);
  assert(saved.records.find(x=>x.id==="b")?.parentId==null);
  assert(saved.records.find(x=>x.id==="c")?.parentId==="b");
  console.log("PASS promote children on parent deletion, preserving grandchild");
  await page.close();
  const another=await create(375,"dark");
  const destructive=await deletion(another);
  await destructive.getByRole("button",{name:"Delete entire branch"}).click();
  saved=await another.evaluate(()=>JSON.parse(localStorage.getItem("collection-planner:v1")));
  assert.equal(saved.records.length,0);
  console.log("PASS mobile delete branch removes all descendants");
  await another.close();
 }
}catch(error){console.error("FAIL Phase 6C browser",error);process.exitCode=1;}
finally{await browser.close()}
