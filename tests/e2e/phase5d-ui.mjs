import assert from "node:assert/strict";
import {chromium} from "../../.e2e/node_modules/playwright/index.mjs";
const browser=await chromium.launch({headless:true});
const fixture={version:1,title:"My long planning collection",fields:[
 {id:"name",name:"Name",type:"text"},{id:"status",name:"Status",type:"select",options:["To do","In progress","Done"]},
 {id:"due",name:"Due",type:"date"},{id:"start",name:"Start",type:"date"},
 {id:"bucket",name:"Bucket",type:"select",options:["To do","In progress","Done"]}],
 records:[{id:"rich",values:{name:"Soạn báo cáo",status:"In progress",bucket:"To do",due:"2026-10-18"},
  progress:"in_progress",priority:"urgent",labelIds:["label"],assigneeIds:["person"],
  checklist:[{id:"one",text:"Review",done:false}],body:"Write background",
  attachments:[{id:"att",name:"Brief",url:"https://example.com/brief"}],
  comments:[{id:"comment",author:"Mai",text:"Please review",at:"2026-10-20"}],activity:[]}],
 people:[{id:"person",name:"Mai"}],labels:[{id:"label",name:"High priority",color:"#5B5FC7"}],
 views:[{id:"board",name:"Board",kind:"kanban",groupFieldId:"bucket"},
 {id:"grid",name:"Grid",kind:"table"},
 {id:"schedule",name:"Schedule",kind:"calendar",dateFieldId:"start",endDateFieldId:"due"},
 {id:"charts",name:"Charts",kind:"charts"}],activeViewId:"board"};
try{
 for(const width of [1280,375]){
  const context=await browser.newContext({viewport:{width,height:820},deviceScaleFactor:1});
  const page=await context.newPage();
  await page.addInitScript(data=>{localStorage.setItem("collection-planner:v1",JSON.stringify(data));
    localStorage.setItem("planner:dark","0");},fixture);
  await page.goto("http://127.0.0.1:4173/",{waitUntil:"networkidle"});
  const rich=page.locator('[data-record-id="rich"][data-testid="collection-kanban-card"]');
  await rich.waitFor();
  for(const name of ["card-priority","card-checklist","card-attachments","card-notes","card-comments","card-due","card-avatars","card-labels"])
   assert.equal(await rich.getByTestId(name).count(),1,"Missing card "+name);
  const due=rich.getByTestId("card-due");
  assert((await due.getAttribute("class")).includes("text-red"));
  if(width===375){
   const header=page.getByTestId("planner-header");
   assert((await header.boundingBox()).width<=375);
   assert.equal(await page.getByRole("button",{name:"Choose view"}).count(),1);
   const layout=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:window.innerWidth}));
   assert(layout.scroll<=layout.viewport+1,"mobile page overflow "+JSON.stringify(layout));
   await page.getByRole("button",{name:"Choose view"}).click();
   await page.getByRole("menuitemradio",{name:"Schedule"}).click();
   await page.getByTestId("collection-calendar-agenda").waitFor();
   await page.getByRole("button",{name:"Choose view"}).click();
   await page.getByRole("menuitemradio",{name:"Charts"}).click();
   await page.getByTestId("collection-charts").waitFor();
   await page.getByRole("button",{name:"Choose view"}).click();
   await page.getByRole("menuitemradio",{name:"Board"}).click();
   const board=page.getByTestId("collection-kanban");
   const styles=await board.evaluate(e=>({snap:getComputedStyle(e).scrollSnapType,
     scrollbar:getComputedStyle(e).scrollbarWidth}));
   assert(styles.snap.includes("mandatory"),JSON.stringify(styles));
  }
  await page.locator('button[aria-label="Filters"]').click();
  await page.getByLabel("Filter priority").selectOption("urgent");
  await page.locator('button[aria-label="Filters"]').click();
  await page.getByTestId("planner-active-filter-chips").waitFor();
  assert.equal(await page.getByRole("button",{name:"Remove Priority: urgent"}).count(),1);
  await page.getByRole("button",{name:"Clear all filters"}).click();
  assert.equal(await page.getByTestId("planner-active-filter-chips").count(),0);
  await rich.locator("[data-board-card-focus]").click();
  const pane=page.getByRole("dialog",{name:/Task Soạn báo cáo/});
  await pane.waitFor();
  assert.equal(await pane.getByLabel("due formatted date").textContent(),"18/10/2026");
  await pane.getByRole("button",{name:"Task actions",exact:true}).click();
  await pane.getByRole("menuitem",{name:"Move task"}).click();
  assert.equal(await pane.locator("[role=menu] select[aria-label='Move task to bucket']").count(),1);
  await page.keyboard.press("Escape");
  assert.equal(await pane.count(),0);
  assert.equal(await rich.locator("[data-board-card-focus]").evaluate(el=>document.activeElement===el),true);
  await page.getByRole("button",{name:"More plan actions"}).click();
  await page.getByRole("button",{name:"Toggle dark mode"}).click();
  const token=await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue("--planner-canvas").trim());
  assert.equal(token.toLowerCase(),"#1f1f1f");
  await context.close();
  console.log("PASS responsive Phase5D",width,"card, filter, drawer, theme");
 }
} catch(err){console.error("FAIL Phase5D",err);process.exitCode=1;}
finally{await browser.close();}
