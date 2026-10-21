# Task: upgrade this Collection module to Microsoft Planner-level UI/UX

Context: a React 18 + TypeScript + Vite + Tailwind 3 app. The data model is in `src/collections/model.ts`; every view
reads/writes one `CollectionBlockPayload` through `CollectionSurface` (`src/renderers/`). Current UI works but is
clumsy: dense toolbar, settings panel for everything, no task-first flow. Target: the feel of Microsoft Planner
(Grid, Board, Charts, Schedule) and Planner's task card.

## Goals
1. **Board (kanban) like Planner**: buckets as columns, quick "Add task" at bucket top, drag cards between/within buckets,
   card shows title, progress chip, due date (red when late), assignee avatars, labels, checklist count, attachment/notes icon.
   Rename/add/delete/reorder buckets inline. Group by Bucket / Progress / Priority / Assignee / Label / Due date.
2. **Task details drawer** (click a card/row): title, bucket, progress (Not started/In progress/Completed), priority
   (Urgent/Important/Medium/Low), start/due date, assignees, labels (colored, up to 25), notes, checklist, attachments,
   dependencies, comments + activity. Autosave, Esc to close.
3. **Grid view**: sortable, filterable, column show/hide, inline edit, multi-select with bulk actions, "Add new task" row.
4. **Schedule (calendar) view**: month/week, drag to reschedule, create by clicking a day.
5. **Charts view**: status, bucket, priority, assignee donut/bar charts + "late / due soon" counters.
6. **Missing features to add**: assignees (people list), labels, priority, progress, recurring tasks, task copy/move,
   filters bar (keyword, due, bucket, label, assignee, priority) with saved filters, keyboard shortcuts, undo/redo,
   empty states, loading/error states, responsive layout, dark mode, accessibility (focus, aria, contrast).
7. Keep CSV/JSON import-export and keep data backward compatible: write a migration in `normalizeCollection`.

## Constraints
- Keep files under 300 lines; split components. No new heavy deps beyond: `@dnd-kit/*`, `recharts` (charts), `date-fns`.
- `pnpm typecheck` and `pnpm test` must pass; add unit tests for new pure logic.
- Do not rename exported model types without a migration. No network calls; data stays in localStorage.

## Deliverable, in phases (finish one before the next)
Phase 1: task drawer + Board redesign. Phase 2: Grid + filters bar. Phase 3: Schedule + Charts. Phase 4: polish + a11y.
For each phase: list changed files with full code per file, then how to verify.
