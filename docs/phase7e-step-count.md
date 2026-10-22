# Phase 7E — Interaction step-count audit

## Counting rules
One mouse click/tap, one double-click gesture, one drag gesture, or one complete text-entry
(including Enter to commit) each count as **one user interaction**. Opening a menu counts
as one click; choosing an item counts as a second click. Hover, focus restoration and
render latency do not count. All changes must be verified through persisted
`collection-planner:v1` state. Do not count a non-persisting UI animation as success.

These are **target ceilings**, not unverified claims. `tests/e2e/phase7e-steps.mjs`
checks each supported path against the ceiling and logs measured counts for both
1280px and 375px. The pointer tests use `waitForFunction` on actual saved state
and port **4173**; each viewport runs three times per CI check.

| Action | Ceiling | Tested operation | Notes |
| --- | --- | --- | --- |
| Change due date | 2 clicks | Click Board due badge; click calendar day | 44px picker |
| Change assignee | 2 clicks | Open assignee badge; check person | Done closes panel, not part of changing value |
| Change label | 2 clicks | Open label badge; check label | Must save before dismissing |
| Change priority | 2 clicks | Open priority badge; click priority | Picker closes automatically |
| Add task + due + assignee | 1 typing, 0–1 click | Type `Release +3d @Mai`, Enter | One model mutation; Enter included in typing |
| Change bucket | 1 drag | Drag Board card to target bucket | 1280px direct pointer; mobile existing alternative needs review |
| Filter by person | 2 clicks | Filters → person chip | Reversible via Everyone |
| Create sub-task | 2 interactions | Open parent task → type title, Enter | Enter included in typing |
| Create dependency | 1 drag | Drag source Link handle → target card | Cycle validation and aria-live status |
| Rename | 2 interactions | Double-click card title → type, Enter | Enter included in typing |

## Scope and limitations
All view types show the **same Filter / Group / Sort / Fields / quick-create / Share** bar.
Filters and sorting apply to record views; Form is creation-focused and has no
record-list filtering. Grouping is visual in Board, Grid (flat lists), and
Gallery; nested Grid preserves its hierarchy instead of breaking parent/child
adjacency. Schedule, Timeline, Mind Map, Charts and Form preserve their native
layouts and explain unsupported grouping rather than silently displaying a fake
group state. Field visibility works in Grid/Gallery/Form; other views explain
that they do not use configurable card fields.

Sharing copies **only the page URL**. Data remains in localStorage and is NOT
shared to another device or user. An explicit success/failure state is shown.

The Playwright CI browser test does not replace local verification on a real
mobile device. A reviewer must repeat the suite three times locally and verify
scrolling, touch targets and clipboard permission behaviors before merging.
