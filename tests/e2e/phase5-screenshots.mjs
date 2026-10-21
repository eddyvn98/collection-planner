import { chromium } from "../../.e2e/node_modules/playwright/index.mjs";
import { mkdir } from "node:fs/promises";
const browser=await chromium.launch({headless:true});
const before=process.argv[2]??"http://127.0.0.1:4174";
const after=process.argv[3]??"http://127.0.0.1:4173";
await mkdir("screenshots",{recursive:true});
const fixture={version:1,title:"Product launch plan",
 fields:[{id:"name",name:"Name",type:"text"},{id:"status",name:"Status",type:"select",options:["To do","In progress","Done"]},
 {id:"start",name:"Start",type:"date"},{id:"due",name:"Due",type:"date"},
 {id:"bucket",name:"Bucket",type:"select",options:["To do","In progress","Done"]}],
 records:[{id:"a",values:{name:"Write launch brief",status:"In progress",bucket:"To do",due:"2026-10-18"},
   progress:"in_progress",priority:"important",assigneeIds:["me"],labelIds:["launch"],
   checklist:[{id:"a1",text:"Draft",done:true},{id:"a2",text:"Review",done:false}],
   body:"Outline product narrative",attachments:[{id:"att1",name:"Design",url:"https://example.com"}],comments:[],activity:[]},
 {id:"b",values:{name:"Design onboarding",status:"To do",bucket:"In progress",due:"2026-11-02"},
   progress:"not_started",priority:"medium",assigneeIds:["me"],labelIds:[],attachments:[],comments:[],activity:[]},
 {id:"c",values:{name:"QA release checklist",status:"Done",bucket:"Done"},
   progress:"completed",priority:"low",assigneeIds:[],labelIds:[],attachments:[],comments:[],activity:[]}],
 people:[{id:"me",name:"You"}],labels:[{id:"launch",name:"Launch",color:"#5B5FC7"}],
 views:[{id:"grid",name:"Grid",kind:"table"},{id:"board",name:"Board",kind:"kanban",groupFieldId:"bucket"},
 {id:"schedule",name:"Schedule",kind:"calendar",dateFieldId:"start",endDateFieldId:"due"},
 {id:"charts",name:"Charts",kind:"charts"}],activeViewId:"board"};
try{
 for(const [name,url] of [["before",before],["after",after]]){
  for(const width of [1280,375]){
   const context=await browser.newContext({viewport:{width,height:820},deviceScaleFactor:1});
   const page=await context.newPage();
   await page.addInitScript(data=>{localStorage.setItem("collection-planner:v1",JSON.stringify(data));localStorage.setItem("planner:dark","0");},fixture);
   await page.goto(url,{waitUntil:"networkidle"});
   await page.getByTestId("collection-kanban").waitFor({timeout:15000});
   await page.screenshot({path:`screenshots/${name}-${width}.png`,fullPage:true,animations:"disabled"});
   console.log("Screenshot",name,width,await page.title());
   await context.close();
  }
 }
}finally{await browser.close();}
