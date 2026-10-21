// Real Chromium pointer integration: do not substitute a pure reducer test here.
import assert from "node:assert/strict";
import { chromium } from "../../.e2e/node_modules/playwright/index.mjs";
const browser = await chromium.launch({ headless: true });
const testName = "Planner pointer drag and mobile agenda";
try {
  const desktop = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await desktop.newPage();
  const fixture = {
    version: 1, title: "Drag test", fields: [
      { id: "name", name: "Name", type: "text" },
      { id: "status", name: "Status", type: "select", options: ["To do", "In progress", "Done"] },
      { id: "start", name: "Start", type: "date" },
      { id: "due", name: "Due", type: "date" },
      { id: "bucket", name: "Bucket", type: "select", options: ["To do", "Done"] },
    ],
    records: [{
      id: "e2e-task", values: {
        name: "Drag task", status: "In progress", start: "2026-10-19",
        due: "2026-10-21", bucket: "To do",
      }, progress: "in_progress", priority: "medium",
      assigneeIds: [], labelIds: [], attachments: [], comments: [], activity: [],
    }],
    views: [
      { id: "schedule", name: "Schedule", kind: "calendar", dateFieldId: "start", endDateFieldId: "due" },
      { id: "grid", name: "Grid", kind: "table" },
      { id: "board", name: "Board", kind: "kanban", groupFieldId: "bucket" },
      { id: "charts", name: "Charts", kind: "charts" },
    ],
    activeViewId: "schedule",
  };
  await page.addInitScript(data => {
    localStorage.setItem("collection-planner:v1", JSON.stringify(data));
    localStorage.setItem("planner:dark", "0");
  }, fixture);
  page.on("pageerror", error => { throw error; });
  await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
  await page.getByLabel("Schedule selected day").fill("2026-10-21");
  const handle = page.getByRole("button", { name: "Drag Drag task" });
  const target = page.locator('[data-testid="collection-calendar-day"][data-date="2026-10-22"]');
  await handle.scrollIntoViewIfNeeded();
  const from = await handle.boundingBox(), to = await target.boundingBox();
  assert(from && to, "source/target rectangles must exist");
  const sx = from.x + from.width/2, sy = from.y + from.height/2;
  const tx = to.x + to.width/2, ty = to.y + to.height/2;
  console.log("drag", { from: [sx, sy], to: [tx, ty] });
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  for(let n = 1; n <= 12; n++) {
    await page.mouse.move(sx + (tx-sx)*n/12, sy + (ty-sy)*n/12);
    await page.waitForTimeout(25);
  }
  await page.mouse.up();
  await page.locator('[data-date="2026-10-22"] [data-record-id="e2e-task"]').waitFor({ timeout: 8000 });
  await page.getByRole("button",{name:"More plan actions"}).click();
  console.log("More menu inspect",await page.locator("[role=menu]").count(),await page.locator('button[aria-label="Undo last change"]').count());
  assert.equal(await page.locator('button[aria-label="Undo last change"]').isEnabled(), true,
    "Undo must become enabled after pointer drag");
  let persisted = await page.evaluate(() => JSON.parse(localStorage.getItem("collection-planner:v1")).records[0].values);
  assert.equal(persisted.due, "2026-10-22");
  assert.equal(persisted.start, "2026-10-20");
  await page.locator('button[aria-label="Undo last change"]').click();
  await page.getByRole("button",{name:"More plan actions"}).click();
  await page.locator('[data-date="2026-10-21"] [data-record-id="e2e-task"]').waitFor({ timeout: 8000 });
  console.log("PASS desktop drag (12 pointer moves), persistence and Undo");
  await page.locator('[data-date="2026-10-21"] [data-record-id="e2e-task"] button').last().click();
  await page.getByLabel("Move task to date").fill("2026-10-24");
  await page.locator('[role="dialog"][aria-label^="Task "] button[aria-label="Close task details"]').click();
  await page.locator('[data-date="2026-10-24"] [data-record-id="e2e-task"]').waitFor({ timeout: 8000 });
  await page.getByRole("button",{name:"More plan actions"}).click();
  assert.equal(await page.locator('button[aria-label="Undo last change"]').isEnabled(), true);
  await page.getByRole("button",{name:"More plan actions"}).click();
  console.log("PASS Move to date fallback updates Schedule and Undo");
  const mobile = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  const small = await mobile.newPage();
  await small.addInitScript(data => localStorage.setItem("collection-planner:v1", JSON.stringify(data)), fixture);
  await small.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
  await small.getByLabel("Schedule selected day").fill("2026-10-21");
  await small.getByTestId("collection-calendar-agenda").waitFor();
  const overscroll = await small.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert(overscroll <= 1, "375px view must not cause horizontal page overflow: "+overscroll);
  assert(await small.getByTestId("collection-calendar-agenda").getByText("Sun, 25 Oct 2026").count() === 1);
  console.log("PASS 375px agenda, all weekdays accessible and no horizontal overflow");
  await small.getByRole("button", { name: "Board", exact: true }).click();
  const toggle=small.locator('button[aria-label="Filters"]');
  assert.equal(await toggle.getAttribute("aria-expanded"), "false");
  await toggle.click();
  await small.getByLabel("Filter priority").selectOption("urgent");
  await toggle.click();
  assert.equal(await toggle.getAttribute("aria-expanded"), "false");
  assert.equal(await small.getByLabel("1 active filters").count(), 1);
  await small.getByRole("button", { name: "More plan actions" }).click();
  await small.locator('button[aria-label="Toggle dark mode"]').click();
  await small.getByRole("button", { name: "More plan actions" }).click();
  assert.equal(await small.locator("html.dark").count(), 1);
  await small.getByRole("button", { name: "Add view" }).click();
  const colors=await small.locator('[role="menu"]').last().evaluate(node => ({
    background: getComputedStyle(node).backgroundColor,
    foreground: getComputedStyle(node).color,
    colorScheme: getComputedStyle(node).colorScheme,
  }));
  console.log("dark Add view menu",colors);
  assert.notEqual(colors.background, "rgb(255, 255, 255)");
  assert.equal(await small.locator("html.dark").count(),1);
  console.log("PASS collapsed mobile filters badge and dark native View dropdown");
  await mobile.close(); await desktop.close();
  console.log("PASS", testName);
} catch (error) {
  console.error("FAIL", testName, error);
  process.exitCode = 1;
} finally {
  await browser.close();
}
