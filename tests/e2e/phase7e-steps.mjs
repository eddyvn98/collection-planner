import assert from "node:assert/strict";
import {mkdir,writeFile} from "node:fs/promises";
import {chromium} from "../../.e2e/node_modules/playwright/index.mjs";
const browser=await chromium.launch({headless:true});
const url=process.env.SCREENSHOT_BASE_URL??"http://127.0.0.1:4173";
const screenshots=process.env.SCREENSHOT_OUTPUT;
const iso=date=>[date.getFullYear(),String(date.getMonth()+1).padStart(2,"0"),String(date.getDate()).padStart(2,"0")].join("-");
const add=(days)=>{const date=new Date();date.setDate(date.getDate()+days);return iso(date);};
const fixture={version:1,title:"Phase 7E Step QA",fields:[
 {id:"name",name:"Name",type:"text"},{id:"bucket",name:"Bucket",type:"select",options:["To do","Doing","Done"]},
 {id:"start",name:"Start",type:"date"},{id:"due",name:"Due",type:"date"}],
 records:[
 {id:"a",values:{name:"Alpha",bucket:"To do",due:add(2)},priority:"medium"},
 {id:"b",values:{name:"Beta",bucket:"Doing",due:add(4)},priority:"medium"},
 {id:"c",values:{name:"Gamma",bucket:"To do",due:add(5)},priority:"low"}],
 people:[{id:"mai",name:"Mai"}],labels:[{id:"ui",name:"UI",color:"#5B5FC7"}],
 views:[
 {id:"board",kind:"kanban",name:"Board",groupFieldId:"bucket"},
 {id:"grid",kind:"table",name:"Grid"},
 {id:"gallery",kind:"gallery",name:"Gallery"},
 {id:"schedule",kind:"calendar",name:"Schedule",dateFieldId:"start",endDateFieldId:"due"},
 {id:"charts",kind:"charts",name:"Charts"},
 {id:"form",kind:"form",name:"Form"}],
 activeViewId:"board"};
async function open(width){
 const page=await browser.newPage({viewport:{width,height:860}});
 await page.addInitScript(value=>localStorage.setItem("collection-planner:v1",JSON.stringify(value)),fixture);
 await page.goto(url,{waitUntil:"networkidle"});
 return page;
}
const saved=page=>page.evaluate(()=>JSON.parse(localStorage.getItem("collection-planner:v1")));
const card=(page,id)=>page.getByTestId("collection-kanban").locator(
 '[data-testid="collection-kanban-card"][data-record-id="'+id+'"]');
async function waitRecord(page,id,check){
 await page.waitForFunction(({id,check})=>{
  const data=JSON.parse(localStorage.getItem("collection-planner:v1"));
  const row=data.records.find(record=>record.id===id);
  return !!row&&check.kind==="value"?row?.values[check.field]===check.expected:
   check.kind==="property"?row?.[check.field]===check.expected:
   check.kind==="member"?(row?.[check.field]??[]).includes(check.expected):false;
 },{id,check});
}
async function switchView(page,width,name){
 if(width===375){
  await page.getByRole("button",{name:"Choose view"}).click();
  await page.getByRole("menuitemradio",{name}).click();
 }else await page.getByRole("button",{name,exact:true}).click();
 await page.getByTestId("planner-unified-toolbar").waitFor();
}
async function drag(page,source,target){
 await source.scrollIntoViewIfNeeded();
 const a=await source.boundingBox(),b=await target.boundingBox();
 assert(a&&b,"Drag endpoints must be rendered");
 await page.mouse.move(a.x+a.width/2,a.y+a.height/2);
 await page.mouse.down();
 await page.mouse.move(a.x+a.width/2+10,a.y+a.height/2+4,{steps:5});
 await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:20});
 await page.mouse.up();
}
const targets=[
 {id:"due",maximum:2,kind:"clicks"},
 {id:"assignee",maximum:2,kind:"clicks"},
 {id:"label",maximum:2,kind:"clicks"},
 {id:"priority",maximum:2,kind:"clicks"},
 {id:"quick-add",maximum:1,kind:"typing",maxClicks:1},
 {id:"bucket",maximum:1,kind:"drags"},
 {id:"filter-person",maximum:2,kind:"clicks"},
 {id:"subtask",maximum:2,kind:"interactions"},
 {id:"dependency",maximum:1,kind:"drags"},
 {id:"rename",maximum:2,kind:"interactions"}];
const counts={};
function score(key,value){
 const expected=targets.find(item=>item.id===key);assert(expected,"Unknown metric: "+key);
 assert(value<=expected.maximum, key+" took "+value+" "+expected.kind);
 (counts[key]??=[]).push(value);
}
async function test(width,attempt){
 const page=await open(width),toolbar=page.getByTestId("planner-unified-toolbar");
 const a=card(page,"a"),dueButton=a.getByRole("button",{name:"Edit due date for Alpha"});
 await dueButton.click();
 await page.getByRole("dialog",{name:"Edit due date for Alpha"}).getByRole("button",{name:"Pick "+add(3)}).click();
 await waitRecord(page,"a",{kind:"value",field:"due",expected:add(3)});score("due",2);
 await a.getByRole("button",{name:"Edit assignees for Alpha"}).click();
 await page.getByRole("dialog",{name:"Edit assignees for Alpha"}).getByRole("checkbox",{name:"Mai"}).check();
 await waitRecord(page,"a",{kind:"member",field:"assigneeIds",expected:"mai"});score("assignee",2);
 await page.getByRole("dialog",{name:"Edit assignees for Alpha"}).getByRole("button",{name:"Done"}).click();
 await a.getByRole("button",{name:"Edit labels for Alpha"}).click();
 await page.getByRole("dialog",{name:"Edit labels for Alpha"}).getByRole("checkbox",{name:"UI"}).check();
 await waitRecord(page,"a",{kind:"member",field:"labelIds",expected:"ui"});score("label",2);
 await page.getByRole("dialog",{name:"Edit labels for Alpha"}).getByRole("button",{name:"Done"}).click();
 await a.getByRole("button",{name:"Edit priority for Alpha"}).click();
 await page.getByRole("dialog",{name:"Edit priority for Alpha"}).getByRole("button",{name:"Urgent"}).click();
 await waitRecord(page,"a",{kind:"property",field:"priority",expected:"urgent"});score("priority",2);
 const input=toolbar.getByRole("textbox",{name:"Quick create task"});
 await input.fill("Release +3d @Mai #UI !urgent");
 await toolbar.getByTestId("quick-add-preview").locator('[data-token-kind="assignee"]').waitFor();
 await input.press("Enter");
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem("collection-planner:v1"))
  .records.some(row=>row.values.name==="Release"));
 const release=(await saved(page)).records.find(row=>row.values.name==="Release");
 assert.equal(release.values.due,add(3));assert.deepEqual(release.assigneeIds,["mai"]);
 score("quick-add",1);
 await toolbar.getByRole("button",{name:"Filters"}).click();
 await page.getByRole("dialog",{name:"Task filters"}).getByRole("button",{name:"Filter for Mai"}).click();
 await page.getByRole("button",{name:"Remove Assigned: Mai"}).waitFor();
 score("filter-person",2);
 await toolbar.getByRole("button",{name:"Filters"}).click();
 await page.getByRole("dialog",{name:"Task filters"}).getByRole("button",{name:"Filter for Everyone"}).click();
 await a.locator('[data-board-card-focus]').click();
 const details=page.getByRole("dialog",{name:"Task Alpha"});
 await details.getByRole("textbox",{name:"New sub-task title"}).fill("Review subtasks");
 await details.getByRole("textbox",{name:"New sub-task title"}).press("Enter");
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem("collection-planner:v1"))
  .records.some(row=>row.parentId==="a"&&row.values.name==="Review subtasks"));
 score("subtask",2);
 await details.getByRole("button",{name:"Close task details"}).click();
 await a.locator('[data-board-card-focus]').dblclick();
 const rename=page.getByRole("textbox",{name:"Rename Alpha"});
 await rename.fill("Alpha renamed");await rename.press("Enter");
 await waitRecord(page,"a",{kind:"value",field:"name",expected:"Alpha renamed"});score("rename",2);
 if(width===1280){
  const alpha=card(page,"a"),beta=card(page,"b");
  await drag(page,alpha.getByRole("button",{name:"Drag dependency from Alpha renamed"}),beta);
  await waitRecord(page,"b",{kind:"member",field:"dependsOn",expected:"a"});
  score("dependency",1);
  const first=card(page,release.id).getByRole("button",{name:"Drag Release"});
  const destination=page.getByTestId("collection-kanban").locator(
   '[data-testid="collection-kanban-column"][data-status="bucket:Doing"] header');
  await drag(page,first,destination);
  await waitRecord(page,release.id,{kind:"value",field:"bucket",expected:"Doing"});
  score("bucket",1);
 }
 // The click right after a drop is lost while the board re-renders; wait for the Share button to stop moving.
 const shareButton=toolbar.getByRole("button",{name:"Share plan"});
 for(let stable=0,last="";stable<4;){
  const box=JSON.stringify(await shareButton.boundingBox());
  stable=box===last?stable+1:0;last=box;await page.waitForTimeout(150);
 }
 await shareButton.click();
 const feedbackSnapshot=await toolbar.evaluate(node=>{
  const panel=node.querySelector('[data-testid="planner-share-feedback"]');
  return {present:!!panel,text:panel?.textContent,
   html:panel?.outerHTML.slice(0,600),shareButtons:node.querySelectorAll('[aria-label="Share plan"]').length,
   toolbarVisible:getComputedStyle(node).visibility};
 });
 console.log("7E SHARE POST-CLICK",JSON.stringify(feedbackSnapshot));
 const share=page.getByTestId("planner-share-feedback");
 await share.waitFor();
 assert(/data stays (on this device|local)/i.test(await share.textContent()));
 await share.getByRole("button",{name:"Dismiss share feedback"}).click();
 for(const name of ["Group by","View sort","View fields","Filters","Share plan","Create task in place"]){
  const button=toolbar.getByRole("button",{name});
  const box=await button.boundingBox();assert(box&&box.height>=44&&box.width>=44,name+" >=44x44");
 }
 const settingsPage=await open(width);
 const settingsToolbar=settingsPage.getByTestId("planner-unified-toolbar");
 await switchView(settingsPage,width,"Grid");
 await settingsToolbar.getByRole("button",{name:"View sort"}).click();
 await settingsPage.getByRole("dialog",{name:"View sort"}).getByRole("combobox",{name:"Sort field in view"}).selectOption("due");
 await settingsPage.waitForFunction(()=>JSON.parse(localStorage.getItem("collection-planner:v1"))
  .views.find(v=>v.id==="grid")?.sorts?.[0]?.fieldId==="due");
 await settingsToolbar.getByRole("button",{name:"View sort"}).click();
 await settingsToolbar.getByRole("button",{name:"View fields"}).click();
 await settingsPage.getByRole("dialog",{name:"View fields"}).getByRole("checkbox",{name:"Show Due"}).check();
 await settingsPage.getByRole("dialog",{name:"View fields"}).getByRole("checkbox",{name:"Show Start"}).check();
 await settingsPage.waitForFunction(()=>JSON.parse(localStorage.getItem("collection-planner:v1"))
  .views.find(v=>v.id==="grid")?.gridHiddenFieldIds?.includes("start")===false);
 await settingsToolbar.getByRole("button",{name:"View fields"}).click();
 await settingsToolbar.getByRole("button",{name:"Group by"}).click();
 await settingsPage.getByRole("dialog",{name:"View group"}).getByRole("button",{name:"Bucket"}).click();
 await (width===375?
  settingsPage.getByTestId("collection-mobile-grid"):
  settingsPage.getByTestId("collection-tanstack-table"))
  .getByTestId("planner-grid-group").first().waitFor();
 await switchView(settingsPage,width,"Gallery");
 await settingsToolbar.getByRole("button",{name:"Group by"}).click();
 await settingsPage.getByRole("dialog",{name:"View group"}).getByRole("button",{name:"Bucket"}).click();
 await settingsPage.getByTestId("planner-gallery-group").first().waitFor();
 await switchView(settingsPage,width,"Schedule");
 assert.equal(await settingsToolbar.getByRole("button",{name:"Share plan"}).count(),1);
 await settingsPage.close();
 console.log("PASS 7E actions "+width+" iteration "+attempt);
 await page.close();
}
try{
 if(screenshots){
  await mkdir(screenshots,{recursive:true});
  for(const width of [1280,375]){
   const page=await open(width);
   await page.screenshot({path:screenshots+"/"+width+"-board.png",fullPage:true});
   await page.close();
  }
  await writeFile(screenshots+"/step-targets.json",JSON.stringify(targets,null,2));
 }else{
  for(const width of [1280,375])for(let attempt=1;attempt<=3;attempt++)await test(width,attempt);
  console.log("STEP COUNTS "+JSON.stringify({targets,actual:counts}));
 }
}catch(error){console.error("FAIL 7E",error);process.exitCode=1}
finally{await browser.close();}
