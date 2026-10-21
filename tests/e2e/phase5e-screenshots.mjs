import {chromium} from "../../.e2e/node_modules/playwright/index.mjs";
import {mkdir} from "node:fs/promises";
const browser=await chromium.launch({headless:true});
const before=process.argv[2]??"http://127.0.0.1:4174";
const after=process.argv[3]??"http://127.0.0.1:4173";
const fixture={version:1,title:"Product launch planning board 2026",fields:[
{id:"name",name:"Name",type:"text"},{id:"status",name:"Status",type:"select",options:["To do","In progress","Done"]},
{id:"start",name:"Start",type:"date"},{id:"due",name:"Due",type:"date"},
{id:"bucket",name:"Bucket",type:"select",options:["To do","In progress","Done"]}],
records:[{id:"rich",values:{name:"Prepare launch review",status:"In progress",bucket:"To do",
 start:"2026-10-14",due:"2026-10-18"},progress:"in_progress",priority:"urgent",
 assigneeIds:["mai","linh"],labelIds:["launch"],body:"Review the launch report and clarify milestones.",
 checklist:[{id:"c1",text:"Draft",done:false},{id:"c2",text:"Review",done:true}],
 attachments:[{id:"a",name:"Planning document",url:"https://example.com/doc"}],
 comments:[{id:"m",author:"Mai",text:"Review due soon",at:"2026-10-20"}],activity:[]},
 {id:"other",values:{name:"Review onboarding",bucket:"In progress",status:"To do",due:"2026-10-30"},
 progress:"not_started",priority:"low",assigneeIds:["mai"],labelIds:[],attachments:[],comments:[],activity:[]},
 {id:"done",values:{name:"Publish FAQ",bucket:"Done",status:"Done"},progress:"completed",
 priority:"medium",assigneeIds:[],labelIds:[],attachments:[],comments:[],activity:[]}],
people:[{id:"mai",name:"Mai Nguyen"},{id:"linh",name:"Linh"}],
labels:[{id:"launch",name:"Launch",color:"#5B5FC7"}],
views:[{id:"board",name:"Board",kind:"kanban",groupFieldId:"bucket"},
{id:"grid",name:"Grid",kind:"table"},{id:"schedule",name:"Schedule",kind:"calendar",dateFieldId:"start",endDateFieldId:"due"},
{id:"charts",name:"Charts",kind:"charts"}],activeViewId:"board"};
await mkdir("screenshots",{recursive:true});
try {
 for(const [version,url] of [["before",before],["after",after]]){
  for(const width of [1280,375]){
   for(const theme of ["light","dark"]){
    const context=await browser.newContext({viewport:{width,height:820},deviceScaleFactor:1});
    const page=await context.newPage();
    await page.addInitScript(({data,dark})=>{
      localStorage.setItem("collection-planner:v1",JSON.stringify(data));
      localStorage.setItem("planner:dark",dark?"1":"0");
    },{data:fixture,dark:theme==="dark"});
    await page.goto(url,{waitUntil:"networkidle"});
    await page.getByTestId("collection-kanban").waitFor();
    const prefix=`screenshots/${version}-${theme}-${width}`;
    const rich=page.locator('[data-testid="collection-kanban-card"][data-record-id="rich"]');
    await page.screenshot({path:prefix+"-board.png",animations:"disabled",fullPage:true});
    await rich.screenshot({path:prefix+"-card.png",animations:"disabled"});
    await rich.locator("[data-board-card-focus]").click();
    await page.locator('[role="dialog"][aria-label^="Task "]').waitFor();
    await page.screenshot({path:prefix+"-drawer.png",animations:"disabled",fullPage:true});
    await page.getByRole("button",{name:"Close task details"}).click();
    const filter=page.locator('button[aria-label="Filters"]');
    await filter.click();
    await page.getByLabel("Filter priority").selectOption("urgent");
    await filter.click();
    await page.getByTestId("planner-active-filter-chips").waitFor();
    await filter.click();
    await page.getByTestId("planner-filter-panel").waitFor();
    await page.screenshot({path:prefix+"-filters.png",animations:"disabled",fullPage:true});
    if(theme==="dark"){
     await filter.click();
     for(const viewName of ["Schedule","Charts"]){
      if(width===375){
       await page.getByRole("button",{name:"Choose view"}).click();
       await page.getByRole("menuitemradio",{name:viewName}).click();
      } else await page.getByRole("button",{name:viewName,exact:true}).click();
      await page.screenshot({path:prefix+"-"+viewName.toLowerCase()+".png",animations:"disabled",fullPage:true});
     }
    }
    console.log("PASS Phase5E screenshots",version,width,theme);
    await context.close();
   }
  }
 }
} catch(error){console.error(error);process.exitCode=1;}
finally{await browser.close();}
