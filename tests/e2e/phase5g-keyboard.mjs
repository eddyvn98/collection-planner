import assert from "node:assert/strict";
import {chromium} from "../../.e2e/node_modules/playwright/index.mjs";
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:"reduce"});
 await page.goto("http://127.0.0.1:4173/",{waitUntil:"networkidle"});
 const more=page.getByRole("button",{name:"More plan actions"});
 await more.click();
 const menu=page.getByRole("menu",{name:"More plan actions"});await menu.waitFor();
 const buttons=menu.locator('button:not([disabled])');
 await buttons.first().focus();
 await page.keyboard.press("ArrowDown");
 assert.equal(await buttons.nth(1).evaluate(e=>e===document.activeElement),true);
 await page.keyboard.press("End");
 assert(await buttons.last().evaluate(e=>e===document.activeElement));
 await page.keyboard.press("Home");
 assert(await buttons.first().evaluate(e=>e===document.activeElement));
 await page.keyboard.press("h");
 const focus=await menu.evaluate(e=>document.activeElement?.textContent?.trim()??"");
 assert(focus.toLowerCase().startsWith("history"),"typeahead must find History: "+focus);
 await page.keyboard.press("Escape");
 await menu.waitFor({state:"detached"});
 await page.waitForFunction(()=>document.activeElement?.getAttribute("aria-label")==="More plan actions");
 console.log("PASS menu arrows Home End typeahead and Escape focus");
 const views=page.getByRole("navigation",{name:"Plan views"});
 const board=views.getByRole("button",{name:"Board"});
 await board.click({button:"right"});
 const viewMenu=page.getByRole("menu",{name:/view actions/});await viewMenu.waitFor();
 await viewMenu.getByRole("menuitem",{name:"Delete view"}).click();
 const dialog=page.getByRole("alertdialog",{name:/Delete.*view/});
 await dialog.waitFor();
 const cancel=dialog.getByRole("button",{name:"Cancel"});
 const remove=dialog.getByRole("button",{name:"Delete view"});
 await cancel.focus();await page.keyboard.press("Shift+Tab");
 console.log("Focus after ShiftTab",await page.evaluate(()=>({active:document.activeElement?.outerHTML?.slice(0,300),floating:document.querySelectorAll("[data-planner-floating]").length,dialog:[...document.querySelectorAll("[role=alertdialog]")].map(x=>x.outerHTML.slice(0,100))})));
 assert(await remove.evaluate(e=>e===document.activeElement),"Shift+Tab should wrap to last button");
 await page.keyboard.press("Tab");
 assert(await cancel.evaluate(e=>e===document.activeElement),"Tab should wrap back to Cancel");
 await page.keyboard.press("Escape");await dialog.waitFor({state:"detached"});
 await page.waitForFunction(()=>document.activeElement?.textContent?.trim()==="Board");
 console.log("PASS confirmation modal Tab trap Escape and restore focus");
 const motion=await page.evaluate(()=>({
  pop:getComputedStyle(document.documentElement).getPropertyValue("--planner-motion-popover").trim(),
  drawer:getComputedStyle(document.documentElement).getPropertyValue("--planner-motion-drawer").trim()
 }));
 assert.equal(motion.pop,"0ms");assert.equal(motion.drawer,"0ms");
 console.log("PASS prefers-reduced-motion removes motion tokens");
 const mobile=await browser.newPage({viewport:{width:375,height:812}});
 await mobile.goto("http://127.0.0.1:4173/",{waitUntil:"networkidle"});
 for(const label of ["More plan actions","Choose view","Filters"]){
  const node=mobile.getByRole("button",{name:label,exact:true});
  const rect=await node.boundingBox();
  assert(rect&&rect.height>=44&&rect.width>=44,
   label+" must be at least 44x44px, got "+JSON.stringify(rect));
 }
 console.log("PASS mobile icon hit targets 44x44");
 await mobile.close();await page.close();
}catch(e){console.error("FAIL Phase5G keyboard",e);process.exitCode=1;}
finally{await browser.close();}
