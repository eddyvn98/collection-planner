import assert from "node:assert/strict";
import {chromium} from "../../.e2e/node_modules/playwright/index.mjs";
const browser=await chromium.launch({headless:true});
const fixture={version:1,title:"Phase 6A plan",fields:[
{id:"name",name:"Name",type:"text"},{id:"status",name:"Status",type:"select",options:["To do","In progress","Done"]},
{id:"start",name:"Start",type:"date"},{id:"due",name:"Due",type:"date"},
{id:"bucket",name:"Bucket",type:"select",options:["To do","In progress","Done"]}],
records:[{id:"r",values:{name:"Prepare release",status:"To do",bucket:"To do",due:"2026-10-21"},
 body:"Internal schedule",progress:"not_started",priority:"important",assigneeIds:["u"],labelIds:["l"],
 checklist:[{id:"item",text:"Review",done:true}],attachments:[],comments:[],activity:[]}],
people:[{id:"u",name:"Mai Nguyen"}],labels:[{id:"l",name:"Launch",color:"#5B5FC7"}],
views:[{id:"grid",name:"Grid",kind:"table"},
{id:"board",name:"Board",kind:"kanban",groupFieldId:"bucket"},
{id:"schedule",name:"Schedule",kind:"calendar",dateFieldId:"start",endDateFieldId:"due"},
{id:"charts",name:"Charts",kind:"charts"}],activeViewId:"board"};
const load=async()=>{const page=await browser.newPage({viewport:{width:1280,height:800}});
 await page.addInitScript(data=>{localStorage.setItem("collection-planner:v1",JSON.stringify(data));
  localStorage.removeItem("planner:my-person");localStorage.removeItem("planner:reminders:dismissed");},fixture);
 await page.goto("http://127.0.0.1:4173/",{waitUntil:"networkidle"});return page;};
try{
 const page=await load();
 await page.keyboard.press("/");
 const search=page.getByRole("textbox",{name:"Search plan tasks"});
 await search.waitFor();await page.waitForFunction(()=>document.activeElement?.getAttribute("aria-label")==="Search plan tasks");
 assert(await search.evaluate(x=>x===document.activeElement));
 await search.fill("Launch");
 assert.equal(await page.locator('[data-record-id="r"][data-testid="collection-kanban-card"]').count(),1);
 await search.fill("unmatched");assert.equal(await page.locator('[data-record-id="r"][data-testid="collection-kanban-card"]').count(),0);
 await search.press("Escape");assert.equal(await search.count(),0);
 console.log("PASS header / search by label, Escape clears");
 const add=page.locator('[data-status="bucket:To do"] [data-planner-add-task]');
 await add.click();
 const input=page.getByRole("textbox",{name:"New task in To do"});
 await input.fill("Write spec");await input.press("Enter");
 assert(await input.isVisible());assert(await input.evaluate(x=>x===document.activeElement));
 await input.fill("Design review");await input.press("Enter");
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem("collection-planner:v1")));
 assert(saved.records.some(x=>x.values.name==="Write spec"));
 assert(saved.records.some(x=>x.values.name==="Design review"));
 await input.press("Escape");await input.waitFor({state:"detached"});
 await page.waitForFunction(()=>document.activeElement?.hasAttribute("data-planner-add-task"));
 console.log("PASS quick-add Enter continuous focus, Esc closes and returns focus");
 await page.keyboard.press("n");
 await page.getByRole("textbox",{name:"New task in To do"}).waitFor();
 await page.keyboard.press("Escape");
 await page.getByRole("textbox",{name:"New task in To do"}).waitFor({state:"detached"});
 console.log("PASS N opens quick-add; Escape closes");
 await page.keyboard.press("?");
 const help=page.getByRole("dialog",{name:"Shortcuts"});await help.waitFor();
 assert((await help.textContent()).includes("1–4"));
 await page.keyboard.press("Escape");await help.waitFor({state:"detached"});
 await page.keyboard.press("1");await page.getByRole("button",{name:"Grid",exact:true}).waitFor();
 await page.keyboard.press("2");await page.getByTestId("collection-kanban").waitFor();
 await page.keyboard.press("3");await page.waitForFunction(()=>JSON.parse(localStorage.getItem("collection-planner:v1")).activeViewId==="schedule");
 await page.keyboard.press("4");await page.getByTestId("collection-charts").waitFor();
 await page.keyboard.press("2");await page.getByTestId("collection-kanban").waitFor();
 console.log("PASS ? and 1–4 view shortcuts");
 const bell=page.getByRole("button",{name:/Notifications \(/});
 await bell.click();
 const notifications=page.getByRole("dialog",{name:"Task notifications"});await notifications.waitFor();
 assert((await notifications.textContent()).includes("Prepare release"));
 await notifications.getByRole("button",{name:"Dismiss Prepare release"}).click();
 assert.equal(await notifications.getByRole("button",{name:"Dismiss Prepare release"}).count(),0);
 assert((await page.evaluate(()=>localStorage.getItem("planner:reminders:dismissed"))??"").includes("r:2026-10-21"));
 await bell.click();
 console.log("PASS bell overdue reminder and persisted dismiss");
 await page.getByRole("button",{name:"My tasks"}).click();
 await page.getByLabel("Select my identity").selectOption("u");
 assert.equal(await page.getByRole("button",{name:"My tasks"}).getAttribute("aria-pressed"),"true");
 await page.getByRole("region",{name:"Assigned to me"}).waitFor();
 assert((await page.getByRole("region",{name:"Assigned to me"}).textContent()).includes("Prepare release"));
 assert.equal(await page.evaluate(()=>localStorage.getItem("planner:my-person")),"u");
 console.log("PASS My tasks immediate selection and due-group view");
 await page.getByRole("button",{name:"My tasks"}).click();
 await page.getByTestId("collection-kanban").waitFor();
 const card=page.locator('[data-record-id="r"][data-testid="collection-kanban-card"]');
 await card.locator("[data-board-card-focus]").click();
 const drawer=page.getByRole("dialog",{name:"Task Prepare release"});await drawer.waitFor();
 await drawer.getByRole("button",{name:"Task actions",exact:true}).click();
 await page.getByRole("menu",{name:"Task actions menu"}).getByRole("menuitem",{name:"Duplicate"}).click();
 const after=await page.evaluate(()=>JSON.parse(localStorage.getItem("collection-planner:v1")));
 const copied=after.records.find(row=>row.values.name==="Prepare release (copy)");
 assert(copied);assert.deepEqual(copied.assigneeIds,["u"]);assert.deepEqual(copied.labelIds,["l"]);
 assert.deepEqual(copied.checklist.map(x=>x.done),[true]);
 assert.equal(after.records[after.records.findIndex(row=>row.id==="r")+1].id,copied.id);
 console.log("PASS Duplicate checklist/labels/people, position and title");
 await page.keyboard.press("Escape");
 await page.getByRole("button",{name:"More plan actions"}).click();
 await page.getByRole("menu",{name:"More plan actions"}).getByRole("menuitem",{name:"Settings"}).click();
 const panel=page.getByTestId("collection-settings");await panel.waitFor();
 assert(await panel.getByRole("combobox",{name:"Plan template"}).isVisible());
 const aside=page.locator("aside").filter({has:panel});
 const bounds=await aside.boundingBox();assert(bounds&&bounds.x>600);
 await panel.getByRole("button",{name:"Close settings"}).click();await panel.waitFor({state:"detached"});
 console.log("PASS Planner settings right-side pane");
 const duplicateCard=page.locator('[data-testid="collection-kanban-card"]').filter({hasText:"Prepare release (copy)"});
 const titleButton=duplicateCard.locator("[data-board-card-focus]");
 await titleButton.focus();await titleButton.press("e");
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem("collection-planner:v1")).records
  .some(row=>row.values.name==="Prepare release (copy)"&&row.progress==="completed"));
 console.log("PASS E completes focused task");
 const originalCard=page.locator('[data-record-id="r"][data-testid="collection-kanban-card"]');
 await originalCard.locator("[data-board-card-focus]").focus();
 await originalCard.locator("[data-board-card-focus]").press("Space");
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem("collection-planner:v1")).records.find(x=>x.id==="r")?.progress==="completed");
 console.log("PASS Space completes focused task");
 const quick=page.locator('[data-testid="collection-kanban-card"]').filter({hasText:"Write spec"});
 await quick.locator("[data-board-card-focus]").focus();
 await quick.locator("[data-board-card-focus]").press("Delete");
 const confirm=page.getByRole("alertdialog",{name:"Delete Write spec task?"});
 await confirm.waitFor();await page.keyboard.press("Escape");await confirm.waitFor({state:"detached"});
 console.log("PASS Delete requires confirmation; Esc cancels");
 await page.close();
 const mobile=await browser.newPage({viewport:{width:375,height:812}});
 await mobile.addInitScript(data=>localStorage.setItem("collection-planner:v1",JSON.stringify(data)),fixture);
 await mobile.goto("http://127.0.0.1:4173/",{waitUntil:"networkidle"});
 await mobile.getByRole("button",{name:"Search tasks"}).click();
 await mobile.getByRole("textbox",{name:"Search plan tasks"}).fill("Mai Nguyen");
 await mobile.locator('[data-record-id="r"][data-testid="collection-kanban-card"]').waitFor();
 const scroll=await mobile.evaluate(()=>document.documentElement.scrollWidth);
 assert(scroll<=375,"6A mobile header must not overflow: "+scroll);
 await mobile.getByRole("textbox",{name:"Search plan tasks"}).press("Escape");
 console.log("PASS 375px search by assigned person without page horizontal overflow");
 await mobile.close();
}catch(error){console.error("FAIL Phase6A browser",error);process.exitCode=1;}
finally{await browser.close();}
