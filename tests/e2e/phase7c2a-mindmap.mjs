import assert from "node:assert/strict";
import {mkdir} from "node:fs/promises";
import {chromium} from "../../.e2e/node_modules/playwright/index.mjs";
const browser=await chromium.launch({headless:true});
const url=process.env.SCREENSHOT_BASE_URL??"http://127.0.0.1:4173";
const screenshots=process.env.SCREENSHOT_OUTPUT;
const fixture={version:1,title:"7C-2a Mind Map QA",
 fields:[{id:"name",name:"Name",type:"text"},{id:"bucket",name:"Bucket",type:"select",options:["To do","Doing"]}],
 records:[{id:"root",values:{name:"Parent",bucket:"To do"}},
 {id:"other",values:{name:"Other",bucket:"Doing"}}],
 people:[],labels:[],views:[{id:"map",name:"Mind Map",kind:"mindmap"},{id:"grid",name:"Grid",kind:"table"}],
 activeViewId:"map"};
async function launch(width){
 const page=await browser.newPage({viewport:{width,height:820}});
 await page.addInitScript(data=>{
  localStorage.setItem("collection-planner:v1",JSON.stringify(data));
 },fixture);
 await page.goto(url,{waitUntil:"networkidle"});
 return page;
}
async function run(width,attempt){
 const page=await launch(width);
 const graph=page.getByTestId("collection-mindmap-graph");
 const node=id=>graph.locator('.react-flow__node[data-id="'+id+'"]');
 await node("root").click();
 await page.getByRole("button",{name:"Add child node"}).click();
 const added=await page.evaluate(()=>JSON.parse(localStorage.getItem("collection-planner:v1")).records
  .find(r=>!["root","other"].includes(r.id)));
 assert.equal(added.parentId,"root");
 const rename=node(added.id).locator("input[data-mindmap-rename]");
 await rename.waitFor({state:"visible"});
 await rename.fill("One click saves and selects");
 if(screenshots){
  // The baseline app may not allow clicking this node at all. Capture the
  // blocked state rather than force-clicking through the real hit target.
  if(width>=640)try{await node("other").locator("strong").click({timeout:2000});}
   catch{/* baseline interaction is obstructed */}
  await page.screenshot({path:`${screenshots}/${width}-mindmap-first-click-${attempt}.png`,fullPage:true});
  await page.close();return;
 }
 // FitView after adding a node can alter the transform. Assert that the
 // target has settled inside the interactive canvas before its first click.
 let stable=0,last="";
 for(let sample=0;sample<30&&stable<4;sample++){
  const rect=await node("other").boundingBox();
  const transform=await graph.locator(".react-flow__viewport").getAttribute("style");
  const now=JSON.stringify({rect,transform});
  stable=now===last?stable+1:0;last=now;
  await page.waitForTimeout(100);
 }
 assert(stable>=4,"Mind Map viewport must settle after adding a child");
 const bounds=await graph.boundingBox(),target=await node("other").boundingBox();
 assert(bounds&&target&&target.x>=bounds.x&&target.x+target.width<=bounds.x+bounds.width+1&&
  target.y>=bounds.y&&target.y+target.height<=bounds.y+bounds.height+1,
  "The target node must be fully inside the clickable canvas");
 await node("other").locator("strong").click();
 const selected=page.getByRole("combobox",{name:"Mind Map selected record"});
 assert.equal(await selected.inputValue(),"other","First click must select other node");
 await page.waitForFunction(id=>JSON.parse(localStorage.getItem("collection-planner:v1"))
  .records.some(r=>r.id===id&&r.values.name==="One click saves and selects"),added.id,{timeout:5000});
 await page.getByRole("button",{name:"Delete selected node"}).click();
 const dialog=page.getByRole("alertdialog",{name:"Delete Mind Map branch?"});
 assert((await dialog.textContent()).includes("Other"),"Delete must target the first-click selection");
 await dialog.getByRole("button",{name:"Cancel"}).click();
 assert(await node("other").count()===1,"Other node remains after cancel");
 await page.close();
 console.log("PASS 7C-2a Mind Map first-click selection",width,attempt);
}
try{
 if(screenshots)await mkdir(screenshots,{recursive:true});
 for(const width of [1280,375])for(let attempt=1;attempt<=3;attempt++)await run(width,attempt);
}catch(error){console.error("FAIL 7C-2a Mind Map first-click",error);process.exitCode=1}
finally{await browser.close()}
