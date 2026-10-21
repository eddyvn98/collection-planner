import { chromium } from "../../.e2e/node_modules/playwright/index.mjs";
import { mkdir } from "node:fs/promises";
const browser=await chromium.launch({headless:true});
const old=process.argv[2]??"http://127.0.0.1:4174";
const next=process.argv[3]??"http://127.0.0.1:4173";
const board={version:1,title:"Empty Planner",fields:[
{id:"name",name:"Name",type:"text"},
{id:"status",name:"Status",type:"select",options:["To do","In progress","Done"]},
{id:"due",name:"Due",type:"date"},
{id:"bucket",name:"Bucket",type:"select",options:["To do","In progress","Done"]}],
records:[],views:[{id:"board",kind:"kanban",name:"Board",groupFieldId:"bucket"},
{id:"grid",kind:"table",name:"Grid"},{id:"schedule",kind:"calendar",name:"Schedule",dateFieldId:"due"},
{id:"charts",kind:"charts",name:"Charts"}],activeViewId:"board",people:[],labels:[]};
await mkdir("screenshots",{recursive:true});
try{
 for(const [version,url] of [["before",old],["after",next]]){
  for(const [width,height] of [[1280,800],[375,812]]){
   for(const theme of ["light","dark"]){
    const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1});
    const page=await context.newPage();
    await page.addInitScript(({data,dark})=>{
     localStorage.setItem("collection-planner:v1",JSON.stringify(data));
     localStorage.setItem("planner:dark",dark?"1":"0");
    },{data:board,dark:theme==="dark"});
    await page.goto(url,{waitUntil:"networkidle"});
    await page.getByTestId("collection-kanban").waitFor();
    const filter=page.locator('button[aria-label="Filters"]');
    await filter.click();
    await page.getByRole("dialog",{name:"Task filters"}).waitFor();
    const base=`screenshots/${version}-${theme}-${width}`;
    await page.screenshot({path:base+"-filter.png",animations:"disabled"});
    await filter.click();
    await page.getByRole("button",{name:"More plan actions"}).click();
    await page.getByRole("menu",{name:"More plan actions"}).waitFor();
    await page.screenshot({path:base+"-more.png",animations:"disabled"});
    console.log("PASS screenshots",version,theme,width);
    await context.close();
   }
  }
 }
}catch(e){console.error("FAIL Phase5F screenshots",e);process.exitCode=1;}
finally{await browser.close();}
