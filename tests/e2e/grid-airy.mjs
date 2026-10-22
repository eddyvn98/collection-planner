import assert from "node:assert/strict";
import {chromium} from "../../.e2e/node_modules/playwright/index.mjs";
import {mkdir} from "node:fs/promises";
const browser=await chromium.launch({headless:true});
const fixture={version:1,title:"Grid acceptance",fields:[
 {id:"name",name:"Name",type:"text"},{id:"start",name:"Start",type:"date"},
 {id:"due",name:"Due",type:"date"},{id:"bucket",name:"Bucket",type:"select",options:["To do"]},
 {id:"note",name:"Notes",type:"text"},{id:"size",name:"Size",type:"number"}],
 records:[{id:"uuid-123",values:{name:"Prepare release",start:"2026-10-20",due:"2026-10-21",bucket:"To do"},
 progress:"not_started",priority:"important",assigneeIds:[],labelIds:[]}],
 people:[],labels:[],views:[{id:"grid",name:"Grid",kind:"table"},
 {id:"board",name:"Board",kind:"kanban",groupFieldId:"bucket"}],activeViewId:"grid"};
const base=process.env.SCREENSHOT_BASE_URL??"http://127.0.0.1:4173";
const output=process.env.SCREENSHOT_OUTPUT;
const load=async(width,height,theme)=>{
 const page=await browser.newPage({viewport:{width,height}});
 await page.addInitScript(({data,dark})=>{
  localStorage.setItem("collection-planner:v1",JSON.stringify(data));
  localStorage.setItem("planner:dark",dark?"1":"0");
 },{data:fixture,dark:theme==="dark"});
 await page.goto(base,{waitUntil:"networkidle"});
 return page;
};
try{
 if(output)await mkdir(output,{recursive:true});
 for(const width of [1280,375])for(const theme of ["light","dark"]){
  const page=await load(width,800,theme);
  if(output)await page.screenshot({path:`${output}/${theme}-${width}-grid.png`,fullPage:true});
  if(width===1280&&!output){
   const table=page.getByTestId("collection-tanstack-table");
   assert.equal(await table.locator("thead th").count(),9,"6 visible data columns + 3 action columns");
   const progress=page.getByRole("button",{name:"Progress for Prepare release"});
   await progress.click();
   const select=page.getByRole("combobox",{name:"Progress for Prepare release"});
   assert(await select.isVisible());await select.selectOption("completed");
   assert.equal(await page.getByRole("combobox",{name:"Progress for Prepare release"}).count(),0);
   const due=page.getByRole("button",{name:"Due for Prepare release"});
   assert((await due.textContent()).includes("21/10"));
   await due.click();const input=page.getByRole("textbox",{name:"Due for Prepare release"});
   await input.fill("2026-11-02");await input.press("Enter");
   assert((await due.textContent()).includes("02/11"));
   const assignee=page.getByRole("button",{name:"Assignees for Prepare release"});
   await assignee.click();
   const dialog=page.getByRole("dialog",{name:"Assignees for Prepare release"});
   await dialog.getByRole("textbox",{name:"New person name"}).fill("Mai Nguyen");
   await dialog.getByRole("button",{name:"Add a person"}).click();
   assert((await page.evaluate(()=>JSON.parse(localStorage.getItem("collection-planner:v1")).people)).some(p=>p.name==="Mai Nguyen"));
   await page.keyboard.press("Escape");
   await page.getByRole("button",{name:"Grid column visibility"}).click();
   await page.getByRole("checkbox",{name:"Show column Start"}).check();
   assert(await table.getByRole("columnheader",{name:/Start/}).count()===1);
   await page.keyboard.press("Escape");
   console.log("PASS default columns, date, editor, person creation and visibility");
   await page.getByRole("button",{name:"More plan actions"}).click();
   await page.getByRole("menuitem",{name:"Settings"}).click();
   await page.setViewportSize({width:375,height:800});
   await page.setViewportSize({width:1280,height:800});
   await page.getByRole("button",{name:"Close settings"}).click();
   await page.getByRole("button",{name:"More plan actions"}).click();
   await page.getByRole("menuitem",{name:"Settings"}).click();
   assert(await page.getByTestId("collection-tanstack-table").count()===1);
   await page.keyboard.press("Escape");
   assert.equal(await page.getByTestId("collection-settings").count(),0);
   console.log("PASS side-pane resize and body Escape");
  }
  if(width===375&&!output){
   assert((await page.getByTestId("collection-mobile-grid").textContent()).includes("Prepare release"));
   const scroll=await page.evaluate(()=>document.documentElement.scrollWidth);
   assert(scroll<=375,"Unexpected horizontal overflow: "+scroll);
   console.log("PASS 375px mobile Grid "+theme);
  }
  await page.close();
 }
}catch(error){console.error("FAIL grid airy e2e",error);process.exitCode=1}
finally{await browser.close()}
