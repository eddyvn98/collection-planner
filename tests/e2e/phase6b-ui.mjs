import assert from "node:assert/strict";
import {mkdir} from "node:fs/promises";
import {chromium} from "../../.e2e/node_modules/playwright/index.mjs";
const browser=await chromium.launch({headless:true});
const fixture={version:1,title:"Dependency plan",fields:[
 {id:"name",name:"Name",type:"text"},{id:"start",name:"Start",type:"date"},
 {id:"due",name:"Due",type:"date"},{id:"bucket",name:"Bucket",type:"select",options:["To do","Doing","Done"]}],
 records:[
  {id:"ship",values:{name:"Ship release",bucket:"To do",start:"2026-10-20",due:"2026-10-28"},
   priority:"medium",progress:"not_started",dependsOn:["api"]},
  {id:"api",values:{name:"API ready",bucket:"Doing",due:"2026-10-25"},
   priority:"important",progress:"in_progress"},
  {id:"done",values:{name:"Published docs",bucket:"Done",due:"2026-10-18"},
   progress:"completed"},
  {id:"cycle",values:{name:"Review deploy",bucket:"Doing",due:"2026-10-27"},
   progress:"not_started",dependsOn:["ship"]},
  {id:"qa",values:{name:"QA signoff",bucket:"To do",due:"2026-10-26"},
   progress:"not_started"}
 ],people:[],labels:[],
 views:[{id:"grid",name:"Grid",kind:"table"},
 {id:"board",name:"Board",kind:"kanban",groupFieldId:"bucket"},
 {id:"schedule",name:"Schedule",kind:"calendar",dateFieldId:"start",endDateFieldId:"due"},
 {id:"timeline",name:"Timeline",kind:"timeline",dateFieldId:"start",endDateFieldId:"due"}],
 activeViewId:"board"};
const url=process.env.SCREENSHOT_BASE_URL??"http://127.0.0.1:4173";
const output=process.env.SCREENSHOT_OUTPUT;
const newPage=async(width,theme)=>{
 const page=await browser.newPage({viewport:{width,height:800}});
 await page.addInitScript(({data,dark})=>{
  localStorage.setItem("collection-planner:v1",JSON.stringify(data));
  localStorage.setItem("planner:dark",dark?"1":"0");
 },{data:fixture,dark:theme==="dark"});
 await page.goto(url,{waitUntil:"networkidle"});
 return page;
};
const openShip=async(page)=>{
 const card=page.locator('[data-testid="collection-kanban-card"][data-record-id="ship"]');
 await card.locator("[data-board-card-focus]").click();
 const drawer=page.getByRole("dialog",{name:"Task Ship release"});
 await drawer.waitFor();
 await drawer.locator("summary").filter({hasText:"Dependencies"}).click();
 return drawer;
};
try{
 if(output){
  await mkdir(output,{recursive:true});
  for(const width of [1280,375])for(const theme of ["light","dark"]){
   const page=await newPage(width,theme);
   await page.screenshot({path:`${output}/${theme}-${width}-board.png`});
   await openShip(page);
   await page.screenshot({path:`${output}/${theme}-${width}-dependencies.png`});
   await page.close();
  }
  console.log("PASS 16 screenshot states (8 before/after per revision)");
 }else{
  const page=await newPage(1280,"light");
  const ship=page.locator('[data-testid="collection-kanban-card"][data-record-id="ship"]');
  const badge=ship.getByTestId("blocked-badge");
  await badge.waitFor();
  assert((await badge.getAttribute("title")).includes("API ready"));
  const drawer=await openShip(page);
  const picker=drawer.getByTestId("dependency-picker");
  await picker.waitFor();
  assert((await picker.textContent()).includes("API ready"));
  assert((await picker.textContent()).includes("Doing"));
  assert((await picker.textContent()).includes("25/10"));
  const search=picker.getByRole("searchbox",{name:"Search dependency tasks"});
  await search.fill("QA");
  await picker.getByRole("checkbox",{name:"Add dependency QA signoff"}).click();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem("collection-planner:v1")));
  assert.deepEqual(saved.records.find(x=>x.id==="ship").dependsOn,["api","qa"]);
  await search.fill("");
  assert.equal(await picker.getByRole("checkbox",{name:"Add dependency Published docs"}).count(),0);
  assert.equal(await picker.getByRole("checkbox",{name:"Add dependency Review deploy"}).count(),0);
  assert.equal(await picker.getByRole("checkbox",{name:"Add dependency Ship release"}).count(),0);
  assert((await badge.getAttribute("title")).includes("QA signoff"));
  await picker.getByRole("button",{name:"Remove dependency API ready"}).click();
  await picker.getByRole("button",{name:"Remove dependency QA signoff"}).click();
  assert.equal(await ship.getByTestId("blocked-badge").count(),0);
  console.log("PASS blocked tooltip, searchable bucket/due, cycle and completed exclusions, removal");
  await drawer.getByRole("button",{name:"Close task details"}).click();
  await page.getByRole("button",{name:"Grid",exact:true}).click();
  const gridRow=page.getByTestId("collection-tanstack-table").locator('tr[data-record-id="ship"]');
  const gridBlocker=gridRow.getByTestId("blocked-badge");
  assert.equal(await gridBlocker.count(),1);
  assert.equal(await gridBlocker.getAttribute("title"),"Blocked by API ready");
  const priority=page.getByRole("button",{name:"Priority for Ship release"});
  assert.equal((await priority.textContent()).trim(),"");
  const headers=await page.getByTestId("collection-tanstack-table").locator("thead th").evaluateAll(ths=>
   ths.slice(1,7).map(th=>({size:getComputedStyle(th).fontSize,weight:getComputedStyle(th).fontWeight})));
  assert(headers.every(x=>x.size===headers[0].size && x.weight===headers[0].weight),JSON.stringify(headers));
  const person=page.getByRole("button",{name:"Assignees for Ship release"});
  await person.click();await page.getByRole("dialog",{name:"Assignees for Ship release"}).waitFor();
  await page.keyboard.press("Escape");
  await page.waitForFunction(()=>document.activeElement?.getAttribute("aria-label")==="Assignees for Ship release");
  const actions=page.locator('[data-record-id="ship"] td').last().locator("div");
  assert.equal(await actions.evaluate(node=>getComputedStyle(node).opacity),"0");
  await page.locator('[data-testid="collection-tanstack-table"] [data-record-id="ship"]').hover();
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('[data-testid="collection-tanstack-table"] [data-record-id="ship"] td:last-child div')).opacity==="1");
  console.log("PASS Grid Medium hidden, headers consistent, Esc focus, desktop hover actions");
  await page.close();
  const mobile=await newPage(375,"dark");
  const header=mobile.getByRole("textbox",{name:"Collection title"});
  assert((await header.boundingBox()).height>=44);
  await mobile.getByRole("button",{name:"Choose view"}).click();
  await mobile.getByRole("menuitemradio",{name:"Grid"}).click();
  await mobile.getByTestId("collection-mobile-grid").waitFor();
  const newTask=mobile.getByRole("textbox",{name:"New task title"});
  assert((await newTask.boundingBox()).height>=44,"Mobile new task title touch target <44px");
  const card=mobile.locator('[data-testid="collection-mobile-grid"] [data-record-id="ship"]');
  assert.equal(await card.locator('input[type="checkbox"]').count(),0);
  await card.getByRole("button",{name:"Select task Ship release"}).click();
  assert.equal(await card.getByRole("button",{name:"Select task Ship release"}).getAttribute("aria-pressed"),"true");
  assert(await card.getByRole("button",{name:"Edit Ship release"}).isVisible());
  assert(await card.getByRole("button",{name:"Delete Ship release"}).isVisible());
  assert((await mobile.evaluate(()=>document.documentElement.scrollWidth))<=375);
  console.log("PASS 375px mobile touch target, round select and action icons");
  await mobile.close();
 }
}catch(error){console.error("FAIL Phase 6B Playwright",error);process.exitCode=1;}
finally{await browser.close();}
