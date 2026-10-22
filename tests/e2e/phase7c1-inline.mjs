import assert from "node:assert/strict";
import {mkdir} from "node:fs/promises";
import {chromium} from "../../.e2e/node_modules/playwright/index.mjs";
const browser=await chromium.launch({headless:true});
const base=process.env.SCREENSHOT_BASE_URL??"http://127.0.0.1:4173",out=process.env.SCREENSHOT_OUTPUT;
const fixture={version:1,title:"7C inline QA",fields:[
 {id:"name",name:"Name",type:"text"},
 {id:"due",name:"Due",type:"date"},
 {id:"bucket",name:"Bucket",type:"select",options:["To do","Doing"]}],
 records:[{id:"root",values:{name:"Parent",bucket:"To do",due:"2026-10-25"}},
 {id:"child",parentId:"root",values:{name:"Child",bucket:"To do",due:"2026-10-26"}},
 {id:"other",values:{name:"Other",bucket:"Doing",due:"2026-10-28"}}],
 people:[],labels:[],views:[
 {id:"map",name:"Mind Map",kind:"mindmap"},
 {id:"board",name:"Board",kind:"kanban",groupFieldId:"bucket"},
 {id:"grid",name:"Grid",kind:"table"},
 {id:"timeline",name:"Timeline",kind:"timeline",dateFieldId:"due"}],activeViewId:"map"};
async function open(width=1280,view="map"){
 const page=await browser.newPage({viewport:{width,height:820}});
 await page.addInitScript(({fixture,view})=>{
  localStorage.setItem("collection-planner:v1",JSON.stringify({...fixture,activeViewId:view}));
 },{fixture,view});
 await page.goto(base,{waitUntil:"networkidle"});return page;
}
const records=page=>page.evaluate(()=>JSON.parse(localStorage.getItem("collection-planner:v1")).records);
try{
 if(out){
  await mkdir(out,{recursive:true});
  for(const width of [1280,375])for(const view of ["map","board","grid","timeline"]){
   const page=await open(width,view);
   await page.screenshot({path:`${out}/${width}-${view}.png`,fullPage:true});
   await page.close();
  }
 }else{
  const page=await open();
  await page.locator('.react-flow__node[data-id="root"]').click();
  await page.getByRole("button",{name:"Add child node"}).click();
  const added=(await records(page)).find(r=>!fixture.records.some(old=>old.id===r.id));
  assert(added?.parentId==="root");
  const editor=page.locator('.react-flow__node[data-id="'+added.id+'"] input[data-mindmap-rename]');
  await editor.waitFor();
  try{
   await page.waitForFunction(id=>{
    const input=document.querySelector('input[data-mindmap-rename="'+id+'"]');
    return input!==null&&document.activeElement===input;
   },added.id,{timeout:5000});
  }catch(error){
   console.error("Mind Map focus snapshot",await page.evaluate(id=>({
    expected:id,focused:document.activeElement?.outerHTML.slice(0,300),
    editors:[...document.querySelectorAll("input[data-mindmap-rename]")]
     .map(input=>({id:input.getAttribute("data-mindmap-rename"),visible:input.getClientRects().length>0}))
   }),added.id));
   throw error;
  }
  await page.keyboard.type("Focus fixed");
  await editor.press("Enter");
  assert.equal((await records(page)).find(r=>r.id===added.id).values.name,"Focus fixed");
  await page.getByRole("button",{name:"Add sibling node"}).click();
  const sibling=(await records(page)).find(r=>!fixture.records.some(old=>old.id===r.id)&&r.id!==added.id);
  const siblingInput=page.locator('.react-flow__node[data-id="'+sibling.id+'"] input[data-mindmap-rename]');
  await siblingInput.waitFor();
  assert(await siblingInput.evaluate(el=>document.activeElement===el));
  await siblingInput.fill("Sibling edited");await siblingInput.press("Enter");
  assert.equal((await records(page)).find(r=>r.id===sibling.id).values.name,"Sibling edited");
  await page.getByRole("button",{name:"Board",exact:true}).click();
  const card=page.getByTestId("collection-kanban").locator('[data-record-id="root"]');
  await card.getByRole("button",{name:"Parent",exact:true}).dblclick();
  const rename=card.getByRole("textbox",{name:"Rename Parent"});
  await rename.fill("Board renamed");await rename.press("Enter");
  assert.equal((await records(page)).find(r=>r.id==="root").values.name,"Board renamed");
  const heading=page.getByTestId("collection-kanban").getByRole("heading",{name:"To do"});
  await heading.dblclick();
  const bucket=page.getByRole("textbox",{name:"Bucket name"});
  await bucket.fill("Ready");await bucket.press("Enter");
  assert((await page.evaluate(()=>JSON.parse(localStorage.getItem("collection-planner:v1")).fields))
   .find(f=>f.id==="bucket").options.includes("Ready"));
  await card.getByRole("button",{name:"Board renamed",exact:true}).click();
  assert(await page.getByTestId("task-save-status").isVisible());
  await page.getByRole("button",{name:"Close task details"}).click();
  await page.getByRole("button",{name:"Timeline",exact:true}).click();
  assert(await page.getByTestId("collection-timeline").getByRole("button",{name:"Undo last change"}).isVisible());
  await page.close();
  const mobile=await open(375,"grid");
  const grid=mobile.getByTestId("collection-mobile-grid");
  const child=grid.locator('[data-record-id="child"]');
  assert.equal(await child.getAttribute("data-tree-depth"),"2");
  assert((await child.textContent()).includes("Parent"));
  const parentBox=await grid.locator('[data-record-id="root"]').boundingBox();
  const childBox=await child.boundingBox();
  assert(childBox.x>parentBox.x);
  const button=child.getByRole("button",{name:"Select task Child"});
  const size=await button.boundingBox();assert(size.width>=44&&size.height>=44);
  await mobile.close();
  console.log("PASS 7C-1 Mind Map immediate rename, Board title/bucket editing, mobile hierarchy, Timeline history");
 }
}catch(error){console.error("FAIL 7C-1",error);process.exitCode=1}
finally{await browser.close()}
