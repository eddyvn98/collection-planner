import assert from "node:assert/strict";
import { chromium } from "../../.e2e/node_modules/playwright/index.mjs";
const browser = await chromium.launch({headless:true});
const title = "Planner quick-add: click and Enter from empty localStorage";
try {
  const page = await browser.newPage({viewport:{width:1280,height:840}});
  const errors = [];
  page.on("pageerror", error=>errors.push(error.message));
  // Fresh context: no existing collection, view, filter or theme state.
  await page.goto("http://127.0.0.1:4173/",{waitUntil:"networkidle"});
  assert.equal(await page.evaluate(()=>localStorage.getItem("collection-planner:v1")!==null),true);
  const cases = [
    { bucket:"To do", title:"Soạn báo cáo", method:"click" },
    { bucket:"In progress", title:"Review sprint", method:"enter" },
    { bucket:"Done", title:"Document handover", method:"click" },
    { bucket:"To do", title:"Final report", method:"enter" },
  ];
  for (const testCase of cases) {
    const column=page.locator('[data-testid="collection-kanban-column"]')
      .filter({has:page.locator("header h3",{hasText:testCase.bucket})}).first();
    const input=column.getByRole("textbox",{name:"New task in "+testCase.bucket});
    if(!(await input.isVisible()))await column.locator("[data-planner-add-task]").click();
    await input.fill(testCase.title);
    if(testCase.method==="enter") await input.press("Enter");
    else await column.locator("form button[type=submit]").click();
    await page.waitForFunction(expected=>{
      const stored=JSON.parse(localStorage.getItem("collection-planner:v1")??"{}");
      return stored.records?.some(record=>Object.values(record.values).includes(expected));
    },testCase.title);
    const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem("collection-planner:v1")));
    const bucketId=stored.fields.find(field=>field.name==="Bucket").id;
    const statusId=stored.fields.find(field=>field.name==="Status").id;
    const row=stored.records.find(record=>Object.values(record.values).includes(testCase.title));
    assert(row,"new record must exist");
    assert.equal(row.values[bucketId],testCase.bucket,"must stay in selected bucket");
    assert.equal(row.values[statusId],testCase.bucket,"legacy Status must follow bucket");
    assert.equal(row.progress,"not_started","new task cannot be completed");
    const card=column.locator('[data-testid="collection-kanban-card"]')
      .filter({hasText:testCase.title});
    assert.equal(await card.count(),1,"task must render outside collapsed Completed area");
    assert.equal(await card.locator("button[aria-label^='Complete ']").count(),1);
    const completed=column.locator('[data-testid="planner-completed-section"]');
    if(await completed.count())
      assert.equal(await completed.locator('[data-testid="collection-kanban-card"]')
        .filter({hasText:testCase.title}).count(),0,"new task must not appear in Completed");
    console.log("PASS quick-add",testCase.method,testCase.bucket,testCase.title);
  }
  await page.reload({waitUntil:"networkidle"});
  const persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem("collection-planner:v1")));
  assert.equal(persisted.records.length,4);
  assert(persisted.records.every(row=>row.progress==="not_started"));
  assert.deepEqual(errors,[]);
  console.log("PASS",title,"4 records persisted without completion");
} catch(error) {
  console.error("FAIL",title,error);
  process.exitCode=1;
} finally { await browser.close(); }
