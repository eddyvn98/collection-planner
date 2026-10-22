import assert from "node:assert/strict";
import {mkdir} from "node:fs/promises";
import {chromium} from "../../.e2e/node_modules/playwright/index.mjs";
const browser=await chromium.launch({headless:true});
const base=process.env.SCREENSHOT_BASE_URL??"http://127.0.0.1:4173";
const out=process.env.SCREENSHOT_OUTPUT;
const fixture={version:1,title:"Grid Spreadsheet QA",fields:[
 {id:"name",name:"Name",type:"text"},{id:"due",name:"Due",type:"date"},
 {id:"bucket",name:"Bucket",type:"select",options:["To do","Doing"]}],
 records:[{id:"a",values:{name:"Alpha",due:"2026-10-22",bucket:"To do"}},
 {id:"b",values:{name:"Beta",due:"2026-10-23",bucket:"To do"}},
 {id:"c",values:{name:"Gamma",due:"2026-10-24",bucket:"Doing"}}],
 people:[],labels:[],views:[{id:"grid",name:"Grid",kind:"table"},
 {id:"charts",name:"Charts",kind:"charts"},{id:"map",name:"Mind Map",kind:"mindmap"}],
 activeViewId:"grid"};
async function launch(width){
 const page=await browser.newPage({viewport:{width,height:820}});
 await page.addInitScript(data=>localStorage.setItem("collection-planner:v1",JSON.stringify(data)),fixture);
 await page.goto(base,{waitUntil:"networkidle"});
 return page;
}
async function saved(page,id,field,value){
 await page.waitForFunction(({id,field,value})=>
  JSON.parse(localStorage.getItem("collection-planner:v1")).records
   .find(row=>row.id===id)?.values[field]===value,{id,field,value},{timeout:5000});
}
async function paste(page,selector,text){
 await page.evaluate(({selector,text})=>{
  const element=document.querySelector(selector);
  if(!element)throw Error("Paste target missing: "+selector);
  const clipboardData=new DataTransfer();
  clipboardData.setData("text/plain",text);
  const event=new ClipboardEvent("paste",{bubbles:true,cancelable:true,clipboardData});
  if(element.dispatchEvent(event))throw Error("Spreadsheet paste handler did not consume clipboard");
 },{selector,text});
}
async function check(attempt){
 const page=await launch(1280);
 const table=page.getByTestId("collection-tanstack-table");
 const cell=(id,field)=>table.locator('tbody tr[data-record-id="'+id+'"] td[data-grid-field="'+field+'"]');
 const name=cell("a","name").locator("[data-grid-cell-editor]");
 await name.focus();await name.press("Tab");
 assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute("aria-label")),
  "Due for Alpha","Tab should move to next editable visible spreadsheet cell");
 await name.click();
 const editor=page.getByRole("textbox",{name:"Name for Alpha"});
 await editor.fill("Cancelled");await editor.press("Escape");
 assert.equal((await page.evaluate(()=>JSON.parse(localStorage.getItem("collection-planner:v1"))))
  .records[0].values.name,"Alpha","Escape cancels the edit");
 await paste(page,'tr[data-record-id="a"] td[data-grid-field="name"] [data-grid-cell-editor]',
  "Updated Alpha\t2026-11-01\nUpdated Beta\t2026-11-02");
 await saved(page,"a","name","Updated Alpha");
 await saved(page,"b","due","2026-11-02");
 const select=id=>table.locator('tr[data-record-id="'+id+'"]').getByRole("checkbox",{name:/Select task/});
 await select("a").check();await select("b").check();
 await cell("a","due").locator("[data-grid-cell-editor]").focus();
 await cell("a","due").locator("[data-grid-cell-editor]").press("Control+d");
 await saved(page,"b","due","2026-11-01");
 assert((await page.getByRole("status").allTextContents()).some(t=>t.includes("Đã điền xuống")));
 await page.getByRole("button",{name:"Charts",exact:true}).click();
 const charts=page.getByTestId("collection-charts");
 await charts.getByRole("button",{name:/To do 2/}).click();
 assert(await charts.isVisible(),"Charts view must not navigate to Grid on category click");
 await page.waitForFunction(()=>document.querySelector('[data-testid="collection-charts"]')
  ?.textContent?.includes("2 tasks"),null,{timeout:5000});
 await page.close();
 console.log("PASS 7C-2a spreadsheet + Charts in-place filter",attempt);
}
try{
 if(out){
  await mkdir(out,{recursive:true});
  for(const width of [1280,375]){
   const page=await launch(width);
   if(width===1280&&await page.locator('td[data-grid-field="name"]').count()){
    await paste(page,'tr[data-record-id="a"] td[data-grid-field="name"] [data-grid-cell-editor]',
     "New Alpha\t2026-11-01\nNew Beta\t2026-11-02");
    await saved(page,"a","name","New Alpha");
   }
   await page.screenshot({path:`${out}/${width}-grid-spreadsheet.png`,fullPage:true});
   await page.close();
  }
 }else for(let i=1;i<=3;i++)await check(i);
}catch(error){console.error("FAIL 7C-2a Grid E2E",error);process.exitCode=1}
finally{await browser.close()}
