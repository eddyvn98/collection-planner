import assert from "node:assert/strict";
import { chromium } from "../../.e2e/node_modules/playwright/index.mjs";
const browser=await chromium.launch({headless:true});
const fixture=records=>({
 version:1,title:"Small Board",fields:[
 {id:"name",name:"Name",type:"text"},
 {id:"status",name:"Status",type:"select",options:["To do","In progress","Done"]},
 {id:"due",name:"Due",type:"date"},
 {id:"bucket",name:"Bucket",type:"select",options:["To do","In progress","Done"]}],
 records:records?[{id:"task",values:{name:"Task one",bucket:"To do",status:"To do",due:"2026-10-25"},
  progress:"not_started",priority:"medium",assigneeIds:[],labelIds:[],attachments:[],comments:[],activity:[]}]:[],
 views:[{id:"board",name:"Board",kind:"kanban",groupFieldId:"bucket"},
 {id:"grid",name:"Grid",kind:"table"},
 {id:"schedule",name:"Schedule",kind:"calendar",dateFieldId:"due"},
 {id:"charts",name:"Charts",kind:"charts"}],activeViewId:"board",people:[],labels:[]
});
async function assertInside(page,locator,label){
 assert(await locator.isVisible(),label+" must be visible");
 const box=await locator.boundingBox();
 assert(box,label+" must have bounding box");
 const viewport=page.viewportSize();
 assert(box.x>=-1&&box.y>=-1&&box.x+box.width<=viewport.width+1&&
   box.y+box.height<=viewport.height+1,label+" clipped "+JSON.stringify(box));
}
async function escRestores(page,anchor,menu){
 await page.keyboard.press("Escape");
 await menu.waitFor({state:"detached"});
 assert.equal(await anchor.evaluate(el=>document.activeElement===el),true,
  "Escape must restore focus to trigger");
}
try{
 for(const [width,height] of [[1280,800],[375,812]]){
  for(const count of [0,1]){
   const context=await browser.newContext({viewport:{width,height}});
   const page=await context.newPage();
   await page.addInitScript(data=>{localStorage.setItem("collection-planner:v1",JSON.stringify(data));
    localStorage.setItem("planner:dark","0");},fixture(count));
   await page.goto("http://127.0.0.1:4173/",{waitUntil:"networkidle"});
   await page.getByTestId("collection-kanban").waitFor();
   const root=await page.getByTestId("collection-block").boundingBox();
   assert(root.height>=height-1,"Collection root must fill viewport");
   const filter=page.locator('button[aria-label="Filters"]');
   await filter.click();
   const popup=page.getByRole("dialog",{name:"Task filters"});
   await popup.waitFor();
   const clear=popup.getByRole("button",{name:"Clear filters"});
   await assertInside(page,clear,"Filter final Clear button");
   await clear.click();
   await escRestores(page,filter,popup);
   const more=page.getByRole("button",{name:"More plan actions"});
   await more.click();
   const menu=page.getByRole("menu",{name:"More plan actions"});
   const last=menu.getByRole("button",{name:"Toggle dark mode"});
   await assertInside(page,last,"More final dark action");
   await last.click();
   await escRestores(page,more,menu);
   const group=page.getByRole("button",{name:"Group by"});
   await group.click();
   const groupMenu=page.getByRole("menu",{name:"Group by"});
   await assertInside(page,groupMenu.getByRole("menuitem",{name:"Due date"}),"Group last option");
   await escRestores(page,group,groupMenu);
   const bucket=page.getByRole("button",{name:"Bucket actions To do"});
   await bucket.click();
   const bucketMenu=page.getByRole("menu",{name:"Actions for To do"});
   await assertInside(page,bucketMenu.getByRole("menuitem",{name:"Delete"}),"Bucket last action");
   await escRestores(page,bucket,bucketMenu);
   if(width===375){
    const picker=page.getByRole("button",{name:"Choose view"});
    await picker.click();
    const viewMenu=page.getByRole("menu",{name:"Select plan view"});
    await assertInside(page,viewMenu.getByRole("menuitemradio",{name:"Charts"}),"Mobile last view");
    await escRestores(page,picker,viewMenu);
   }
   if(count){
    const card=page.locator('[data-record-id="task"][data-testid="collection-kanban-card"]');
    const title=card.locator("[data-board-card-focus]");
    await title.click();
    const drawer=page.getByRole("dialog",{name:"Task Task one"});
    await drawer.waitFor();
    const actions=drawer.getByRole("button",{name:"Task actions",exact:true});
    await actions.click();
    const actionsMenu=page.getByRole("menu",{name:"Task actions menu"});
    await assertInside(page,actionsMenu.getByRole("menuitem",{name:"Move task"}),"Drawer last action");
    await escRestores(page,actions,actionsMenu);
    assert(await drawer.isVisible(),"Escape should leave drawer open");
    const assignees=drawer.getByRole("button",{name:"Assignees selector"});
    await assignees.click();
    const people=page.getByRole("dialog",{name:"Assignees options"});
    await assertInside(page,people.getByLabel("New assignee"),"Drawer assignee input");
    await escRestores(page,assignees,people);
    await page.keyboard.press("Escape");
    await drawer.waitFor({state:"detached"});
    await page.waitForFunction(()=>document.activeElement?.matches("[data-record-id='task'] [data-board-card-focus]"));
   }
   console.log("PASS empty/one-task portals",width,height,count);
   await context.close();
  }
 }
}catch(e){console.error("FAIL Phase5F portals",e);process.exitCode=1;}
finally{await browser.close();}
