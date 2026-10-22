"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { btnClass, fieldTypeGuidance, fieldTypeLabels, hintClass, inputClass, FieldEditor } from "./CollectionFieldEditor";
import { CollectionScheduleView } from "./CollectionScheduleView";
import { CollectionChartsView } from "./CollectionChartsView";
import { CollectionTaskFilterBar } from "./CollectionTaskFilterBar";
import { EMPTY_TASK_FILTERS, filterPlannerTasks, type TaskFilterState } from "../collections/collectionPlannerFilters";
import { TimelineView } from "./CollectionTimelineView";
import { MindMapView } from "./CollectionMindMapView";
import { CollectionTableView } from "./CollectionTableView";
import { CollectionKanbanView } from "./CollectionKanbanView";
import { CollectionGalleryView } from "./CollectionGalleryView";
import { CollectionFormView } from "./CollectionFormView";
import { CollectionCardFormSettings } from "./CollectionCardFormSettings";
import { CollectionAutomationSettings } from "./CollectionAutomationSettings";
import { CollectionScheduledAutomationSettings } from "./CollectionScheduledAutomationSettings";
import { CollectionAuditPanel } from "./CollectionAuditPanel";
import { CollectionIntegrityPanel } from "./CollectionIntegrityPanel";
import { CollectionPlannerHeader } from "./CollectionPlannerHeader";
import { CollectionFilterChips } from "./CollectionFilterChips";

import { CollectionSettingsSection } from "./CollectionSettingsSection";
import { CollectionImportExportMenu } from "./CollectionImportExportMenu";
import { CollectionImportPrompts } from "./CollectionImportPrompts";
import { CollectionViewConditions } from "./CollectionViewConditions";
import { createPortal } from "react-dom";
import { useCollectionHistory } from "../collections/collectionHistory";
import { CollectionKeyboard } from "./CollectionKeyboard";

import { usePlannerDarkTheme } from "./usePlannerDarkTheme"; import { normalizeCollection } from "../collections/model";
import { visiblePlannerFields, isLegacyStatusField } from "../collections/collectionPlannerFields";
import type { CollectionBlockPayload, CollectionSources, CollectionField, CollectionRecord, CollectionView } from "../collections/model";
import { addRecord, addView, dateField, deleteRecord, endDateField, FIELD_TYPES, newId, primaryField, recordTitle, removeField, removeView, selectField, setParent, setRecordValue, updateField, updateView, visibleRecords } from "../collections/model";
import { downloadCollection, exportCollectionCsv, importCollectionCsv, importCollectionJson } from "../collections/io";
interface Props { blockId: string; data: CollectionBlockPayload; sources?: CollectionSources;
  standalone?: boolean;
  standaloneNavigation?: { collectionsHref: string; canvasHref: string; syncMessage: string };
  revisionNotice?: { stale: boolean; refreshing: boolean; error: string; refresh: () => Promise<void> };
  onChange: (next: CollectionBlockPayload) => void; readOnly: boolean }
export function CollectionSurface({ blockId, data, sources = {}, revisionNotice, standalone = false, standaloneNavigation, onChange: persist, readOnly }: Props) {
  const {onChange,undo,redo,canUndo,canRedo}=useCollectionHistory(data,persist,readOnly);
  const root=useRef<HTMLDivElement>(null);
  const [darkMode,setDarkMode]=useState(()=>typeof localStorage!=="undefined"&&localStorage.getItem("planner:dark")==="1");
  useEffect(()=>{try{localStorage.setItem("planner:dark",darkMode?"1":"0");}catch{/* storage unavailable */}},[darkMode]);
  usePlannerDarkTheme(darkMode);
  const [search, setSearch] = useState(""); const [taskFilters, setTaskFilters] = useState<TaskFilterState>({...EMPTY_TASK_FILTERS}); const [localViewId, setLocalViewId] = useState<string | null>(null); const [settings, setSettings] = useState(false); const [fieldSettingsTarget, setFieldSettingsTarget] = useState<string | null>(null); const [fieldsPanelOpen, setFieldsPanelOpen] = useState(false); const [showHistory, setShowHistory] = useState(false); const [full, setFull] = useState(false); const expanded = full || standalone; const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  useEffect(() => {
    if (!settings || !fieldSettingsTarget) return;
    const target = Array.from(document.querySelectorAll<HTMLElement>("[data-field-setting-id]"))
      .find(element => element.dataset.fieldSettingId === fieldSettingsTarget);
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [settings, fieldSettingsTarget]);
  const openFieldSettings = (fieldId: string) => {
    setSettings(true);
    setShowHistory(false);
    setFieldSettingsTarget(fieldId);
  };
  const fileInput = useRef<HTMLInputElement>(null); const openCollectionButton = useRef<HTMLButtonElement>(null); const backButton = useRef<HTMLButtonElement>(null); const wasFull = useRef(false);
  const closeFull = useCallback(() => {
    if (window.history.state?.collectionFullscreen === blockId) {
      window.history.back();
      return;
    }
    const url = new URL(window.location.href);
    if (url.searchParams.get("collectionScreen") === blockId) url.searchParams.delete("collectionScreen");
    window.history.replaceState(window.history.state, "", url);
    setFull(false);
  }, [blockId]);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("collectionScreen") === blockId) setFull(true);
  }, [blockId]);
  useEffect(() => {
    const syncFocusedRoute = () => setFull(new URLSearchParams(window.location.search).get("collectionScreen") === blockId);
    window.addEventListener("popstate", syncFocusedRoute);
    return () => window.removeEventListener("popstate", syncFocusedRoute);
  }, [blockId]);
  useEffect(() => {
    if (full) { wasFull.current = true; return; }
    if (wasFull.current) {
      wasFull.current = false;
      openCollectionButton.current?.focus();
    }
  }, [full]);
  useEffect(() => {
    if (!full) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => backButton.current?.focus());
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeFull();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [blockId, closeFull, full]);
  const openFull = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("collectionScreen", blockId);
    window.history.pushState({ ...window.history.state, collectionFullscreen: blockId }, "", url);
    setFull(true);
  };
  const view = data.views.find((v) => v.id === (localViewId ?? data.activeViewId)) ?? data.views[0];
  const plannerView = ["table", "kanban", "calendar", "charts"].includes(view.kind);
  const rows = useMemo(() => {
    const base = visibleRecords(data, view, plannerView ? "" : search, sources);
    return plannerView ? filterPlannerTasks(data, base, taskFilters) : base;
  }, [data, view, search, sources, plannerView, taskFilters]);
  const titleField = primaryField(data);
  const group = selectField(data, view);
  const date = dateField(data, view);
  const end = endDateField(data, view);
  const latest = useRef(data);
  latest.current = data;
  const patch = (record: CollectionRecord, field: CollectionField, value: string) => {
    // Read the latest Collection, not this render's snapshot: two edits in one
    // render/save window must never replay stale record values.
    if (readOnly) return;
    const next = setRecordValue(normalizeCollection(latest.current), record.id, field.id, value);
    if (next !== latest.current) { latest.current = next; onChange(next); }
  };
  const renameView = (change: Partial<CollectionView>) => onChange(updateView(data, view.id, change));
  const options = group?.options ?? [];
  const groupOptions = [...options, ...new Set(rows.map((r) => r.values[group?.id ?? ""] || "").filter((o) => o && !options.includes(o)))];
  const [pendingImport,setPendingImport]=useState<CollectionBlockPayload|null>(null),[importError,setImportError]=useState("");
  const openImport = () => fileInput.current?.click();
  const loadFile = async (file?: File) => {
    if (!file || readOnly) return;
    try {
      const text = await file.text();
      const next = file.name.toLowerCase().endsWith(".json") ? importCollectionJson(text) : importCollectionCsv(text);
      setPendingImport(next);
    } catch (error) { setImportError(error instanceof Error ? error.message : "Import failed"); }
  };
  const importExportMenu = <CollectionImportExportMenu
    onExportCsv={() => downloadCollection("collection.csv", exportCollectionCsv(data, sources), "text/csv")}
    onBackupJson={() => downloadCollection("collection.json", JSON.stringify(data, null, 2), "application/json")}
    onImport={openImport} importDisabled={readOnly} />;
  const keepFocusInScreen = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!full || event.key !== "Tab") return;
    const focusable = [...event.currentTarget.querySelectorAll<HTMLElement>(
      'button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex]:not([tabindex="-1"])',
    )].filter(element => element.getClientRects().length > 0);
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === event.currentTarget)) {
      event.preventDefault(); last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first?.focus();
    }
  };
  const content = <div ref={root} data-testid="collection-block" role={full ? "dialog" : undefined} aria-modal={full ? true : undefined}
    aria-label={full ? `${data.title || "Untitled collection"} Collection screen` : undefined}
    tabIndex={full ? -1 : undefined} onKeyDown={keepFocusInScreen}
    className={"flex min-h-[100dvh] h-full w-full flex-col overflow-hidden bg-[var(--planner-canvas)] text-[var(--planner-text)] " + (darkMode ? "dark " : "") + (full ? "fixed inset-0 z-[9999] p-0" : "")}
    onPointerDown={(e) => { if (!(e.target as HTMLElement).closest("[data-collection-drag-handle]")) e.stopPropagation(); }} onDoubleClick={(e) => e.stopPropagation()} onWheel={(e) => e.stopPropagation()}>
    <CollectionKeyboard root={root} undo={undo} redo={redo} disabled={readOnly}
      onEscape={()=>{setTaskFilters({...EMPTY_TASK_FILTERS});setSearch("");setSettings(false);}} />
    <CollectionPlannerHeader data={data} view={view} readOnly={readOnly}
      filters={taskFilters} onFilters={setTaskFilters}
      filterControl={plannerView ? <CollectionTaskFilterBar data={data} value={taskFilters} readOnly={readOnly}
       onChange={setTaskFilters} onDataChange={onChange}/> : null}
      onTitle={title=>onChange({...data,title})}
      onSelect={viewId=>{if(readOnly)setLocalViewId(viewId);else{setLocalViewId(null);onChange({...data,activeViewId:viewId});}}}
      onDelete={viewId=>onChange(removeView(data,viewId))}
      onAddView={kind=>onChange(addView(data,kind))}
      onGroup={mode=>onChange(updateView(data,view.id,{boardGroupBy:mode}))}
      settings={settings} showHistory={showHistory}
      onSettings={()=>{setSettings(!settings);setShowHistory(false);}}
      onHistory={()=>{setShowHistory(!showHistory);setSettings(false);}}
      importExport={importExportMenu} canUndo={canUndo} canRedo={canRedo}
      undo={undo} redo={redo} darkMode={darkMode} setDarkMode={setDarkMode}
      navigation={standaloneNavigation} full={full} onExpand={openFull} onClose={closeFull} backRef={backButton}/>
    {revisionNotice?.stale && <div role="status" className="flex shrink-0 flex-wrap items-center gap-2 border-b px-2 py-1 text-xs">
      <span>Another session has saved a newer board version.</span>
      <button className={btnClass} disabled={revisionNotice.refreshing} onClick={() => void revisionNotice.refresh()}>
        {revisionNotice.refreshing ? "Saving..." : "Save & refresh"}
      </button>
      {revisionNotice.error && <span role="alert">{revisionNotice.error}</span>}
    </div>}
    {revisionNotice?.error && <p role="alert" className="border-b px-3 py-2 text-sm text-red-700 dark:text-red-300">{revisionNotice.error}</p>}
    {revisionNotice?.refreshing && <p role="status" className="px-3 py-1 text-xs text-blue-600">Refreshing collection…</p>}
    {plannerView&&<CollectionFilterChips data={data} value={taskFilters} onChange={setTaskFilters}/>}
    <div className={"flex min-h-0 flex-1 flex-col overflow-hidden " + (settings || showHistory ? "md:flex-row" : "")}>
    {(settings || showHistory) && <aside className="max-h-[min(55vh,28rem)] min-h-0 shrink-0 overflow-y-auto overscroll-contain px-3 py-2 md:h-full md:max-h-none md:w-[min(24vw,20rem)] md:border-r md:border-[var(--planner-border)] dark:md:border-[var(--planner-border)]">
    {showHistory && <CollectionAuditPanel data={data} onClose={() => setShowHistory(false)} />}
    {settings && <div role="region" aria-label="Collection settings" tabIndex={0} data-testid="collection-settings"
      className="min-h-0 space-y-2 text-xs">
      <div className="border-b border-[var(--planner-border)] pb-2 dark:border-[var(--planner-border)]"><h2 className="text-sm font-semibold">Settings</h2><p className={hintClass}>Configure this view and the collection’s fields. Changes save automatically.</p></div>
      <div className="flex flex-wrap items-center gap-2"><label>View name <input className={inputClass} value={view.name} disabled={readOnly} onChange={(e) => renameView({ name: e.target.value })} /></label></div>
      <CollectionSettingsSection title="View options" description="Choose which records appear, how they are grouped or sorted, and what totals are shown.">
      <div className="flex flex-wrap items-center gap-2">
        {view.kind === "kanban" && <label>Group cards by <select className={inputClass} value={group?.id ?? ""} disabled={readOnly} onChange={(e) => renameView({ groupFieldId: e.target.value })}>{data.fields.filter((f) => f.type === "select" && !isLegacyStatusField(f)).map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select></label>}
        {(view.kind === "calendar" || view.kind === "timeline") && <><label>{view.kind === "calendar" ? "Calendar date" : "Start date"} <select aria-label={view.kind === "calendar" ? "Calendar date" : "Start date"} className={inputClass} value={date?.id ?? ""} disabled={readOnly} onChange={(e) => renameView({ dateFieldId: e.target.value })}>{data.fields.filter((f) => f.type === "date").map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select></label>{view.kind === "timeline" && <label>End date <select aria-label="End date" className={inputClass} value={end?.id ?? ""} disabled={readOnly} onChange={(e) => renameView({ endDateFieldId: e.target.value })}>{data.fields.filter((f) => f.type === "date").map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select></label>}</> }
      </div>
      <CollectionViewConditions view={view} fields={visiblePlannerFields(data)} readOnly={readOnly} onChange={renameView} />
      <CollectionCardFormSettings view={view} fields={visiblePlannerFields(data)} readOnly={readOnly} onChange={renameView} />
      </CollectionSettingsSection>
      <CollectionSettingsSection title="Automations" description="Rules can update fields when records change or on a schedule. They do not send messages.">
      <CollectionAutomationSettings data={data} readOnly={readOnly} onChange={onChange} />
      <CollectionScheduledAutomationSettings data={data} readOnly={readOnly} onChange={onChange} />
      </CollectionSettingsSection>
      <CollectionSettingsSection title="Data integrity" description="Review collection links and repair references to missing records.">
        <CollectionIntegrityPanel data={data} sources={sources} readOnly={readOnly} onChange={onChange} />
      </CollectionSettingsSection>
      <CollectionSettingsSection title={`Fields and properties (${data.fields.length})`} description="Each row is one column. Rename it, choose the kind of data it stores, then configure its options." open={fieldsPanelOpen || !!fieldSettingsTarget} onToggle={open => { setFieldsPanelOpen(open); if (!open) setFieldSettingsTarget(null); }}>
      <p className={hintClass}>{fieldTypeGuidance}</p>
      <section aria-label="Field settings" className="space-y-2">
      <div className="flex flex-col">
        {visiblePlannerFields(data).map((f) => <span key={f.id} data-field-setting-id={f.id} className="flex flex-wrap items-center gap-2 border-b border-[var(--planner-border)] py-2 last:border-0 dark:border-[var(--planner-border)]"><input aria-label={"Rename " + f.name} className="w-24 max-w-full bg-transparent" value={f.name} disabled={readOnly} onChange={(e) => onChange(updateField(data, f.id, { name: e.target.value }))} /><select aria-label={"Type " + f.name} className={inputClass} value={f.type} disabled={readOnly} onChange={(e) => onChange(updateField(data, f.id, { type: e.target.value as CollectionField["type"] }))}>{FIELD_TYPES.map((t) => <option key={t} value={t}>{fieldTypeLabels[t]}</option>)}</select>{(f.type === "lookup" || f.type === "rollup") && <><select aria-label={"Lookup relation " + f.name} className={inputClass} value={f.relationFieldId ?? ""} disabled={readOnly} onChange={(e) => onChange(updateField(data, f.id, { relationFieldId: e.target.value || undefined }))}><option value="">Choose relation</option>{data.fields.filter((x) => x.type === "relation").map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select><select aria-label={"Lookup target " + f.name} className={inputClass} value={f.targetFieldId ?? ""} disabled={readOnly} onChange={(e) => onChange(updateField(data, f.id, { targetFieldId: e.target.value || undefined }))}><option value="">Choose field</option>{(() => { const relation = data.fields.find(x => x.id === f.relationFieldId);
          const target = relation?.relationTargetBlockId ? sources[relation.relationTargetBlockId] : data;
          return (target?.fields ?? []).filter(x => x.id !== f.id && !["lookup", "rollup", "formula", "relation"].includes(x.type))
            .map(x => <option key={x.id} value={x.id}>{x.name}</option>); })()}</select></>}{f.type === "rollup" && <select aria-label={"Rollup operation " + f.name} className={inputClass}
          value={f.rollupOperation ?? "count"} disabled={readOnly}
          onChange={e => onChange(updateField(data, f.id, { rollupOperation: e.target.value as CollectionField["rollupOperation"] }))}>
          {["count", "sum", "average", "min", "max"].map(op => <option key={op}>{op}</option>)}
        </select>}{f.type === "relation" && <label>Target collection
          <select aria-label={"Relation collection " + f.name} className={inputClass}
            value={f.relationTargetBlockId ?? ""} disabled={readOnly}
            onChange={event => {
              const next = updateField(data, f.id, { relationTargetBlockId: event.target.value || undefined });
              onChange({ ...next, records: next.records.map(record => ({ ...record,
                values: { ...record.values, [f.id]: "" } })),
                fields: next.fields.map(field => field.relationFieldId === f.id
                  ? { ...field, targetFieldId: undefined } : field) });
            }}>
            <option value="">This collection</option>
            {Object.entries(sources).map(([id, item]) => <option key={id} value={id}>{item.title}</option>)}
          </select>
        </label>}{f.type === "relation" && <label>Multiple
          <input type="checkbox" aria-label={"Multiple links " + f.name} disabled={readOnly}
            checked={!!f.relationMultiple} onChange={e => {
              if (!e.target.checked && data.records.some(record => (record.values[f.id] ?? "").startsWith("["))) {
                setImportError("Remove multi-link values before switching to single selection."); return;
              }
              onChange(updateField(data, f.id, { relationMultiple: e.target.checked }));
            }} />
        </label>}{f.type === "formula" && <><select aria-label={"Formula operation " + f.name} className={inputClass} value={f.formulaOperation ?? ""} disabled={readOnly} onChange={(e) => onChange(updateField(data, f.id, { formulaOperation: e.target.value as CollectionField["formulaOperation"] }))}><option value="">Choose formula</option>{["sum", "subtract", "multiply", "divide", "average", "concat", "expression"].map((op) => <option key={op} value={op}>{op}</option>)}</select>{f.formulaOperation === "expression" && <input className={inputClass + " w-44"}
          aria-label={"Formula expression " + f.name} value={f.formulaExpression ?? ""}
          placeholder="{fieldId} * 1.1" maxLength={500} disabled={readOnly}
          onChange={event => onChange(updateField(data, f.id, { formulaExpression: event.target.value }))} />}
          {f.formulaOperation !== "expression" && [0, 1].map((i) => <select key={i} aria-label={"Formula source " + (i + 1) + " " + f.name} className={inputClass} value={f.formulaFieldIds?.[i] ?? ""} disabled={readOnly} onChange={(e) => { const ids = [...(f.formulaFieldIds ?? ["", ""])]; ids[i] = e.target.value; onChange(updateField(data, f.id, { formulaFieldIds: ids })); }}><option value="">Choose field</option>{data.fields.filter((x) => x.id !== f.id && x.type !== "formula").map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>)}</>}{f.type === "select" && <input aria-label={"Options " + f.name} className={inputClass + " w-56 max-w-full"} value={(f.options ?? []).join(", ")} disabled={readOnly} onChange={(e) => onChange(updateField(data, f.id, { options: e.target.value.split(",").map((v) => v.trim()).filter(Boolean) }))}/>}<button type="button" className="shrink-0 rounded p-1 text-[var(--planner-secondary)] hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:hover:bg-rose-950" aria-label={"Remove field " + f.name} disabled={readOnly || f.id === data.fields[0].id} onClick={() => onChange(removeField(data, f.id))}>×</button></span>)}
      </div></section>
      </CollectionSettingsSection>
    </div>}
    </aside>}
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto bg-[var(--planner-hover)]/80 p-4 dark:bg-[var(--planner-surface)]">
      {view.kind === "table" && <CollectionTableView data={data} sources={sources} view={view} rows={rows} readOnly={readOnly} onChange={onChange} patch={patch} onOpenFieldSettings={openFieldSettings} />}
      {view.kind === "kanban" && <CollectionKanbanView data={data} view={view} rows={rows} group={group} groupOptions={groupOptions} readOnly={readOnly} onChange={onChange} patch={patch} />}
      {view.kind === "gallery" && <CollectionGalleryView data={data} sources={sources} view={view} rows={rows} titleField={titleField} readOnly={readOnly} patch={patch} onChange={onChange} />}
      {view.kind === "calendar" && <CollectionScheduleView data={data} view={view} rows={rows} month={month} setMonth={setMonth} readOnly={readOnly} onChange={onChange} />}
      {view.kind === "charts" && <CollectionChartsView data={data} rows={rows} onDrilldown={filters => {
        const grid = data.views.find(item => item.kind === "table");
        setTaskFilters(filters); if (!grid) return;
        if (readOnly) setLocalViewId(grid.id);
        else { setLocalViewId(null); onChange({ ...data, activeViewId: grid.id }); }
      }} />}
      {view.kind === "timeline" && <TimelineView rows={rows} data={data} start={date} end={end} readOnly={readOnly} patch={patch} onChange={onChange} />}
      {view.kind === "mindmap" && <MindMapView rows={rows} data={data} readOnly={readOnly} onChange={onChange} />}
      {view.kind === "form" && <CollectionFormView data={data} sources={sources} view={view} readOnly={readOnly} onChange={onChange} />}
      {!rows.length && view.kind !== "form" && <div className="p-4 text-center text-xs text-[var(--planner-secondary)]">No matching records. Add one to get started.</div>}
    </div>
    </div>
    {view.kind !== "table" && <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-[var(--planner-border)] bg-[var(--planner-surface)] px-4 py-3 dark:border-[var(--planner-border)] dark:bg-[var(--planner-surface)]">
      <button className={btnClass} disabled={readOnly} onClick={() => onChange(addRecord(data))}>+ Record</button>
    </div>}
    <CollectionImportPrompts pending={pendingImport} error={importError}
      onConfirm={()=>{if(pendingImport)onChange(pendingImport);setPendingImport(null);}}
      onCancel={()=>setPendingImport(null)} onErrorClose={()=>setImportError("")}/>
    <input ref={fileInput} type="file" accept=".csv,.json" className="hidden" onChange={(e) => { void loadFile(e.target.files?.[0]); e.target.value = ""; }} />
  </div>;
  if (full && typeof document !== "undefined") return createPortal(content, document.body);
  if (standalone) return content;
  const previewRecords = visibleRecords(data, view, "", sources).slice(0, 3);
  return <section data-testid="collection-block" aria-label={`${data.title || "Untitled collection"} preview`}
    className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-[var(--planner-border)] bg-[var(--planner-surface)] p-3 text-[var(--planner-text)] shadow-sm dark:border-[var(--planner-border)] dark:bg-[var(--planner-surface)] dark:text-[var(--planner-secondary)]"
    onPointerDown={(event) => event.stopPropagation()} onDoubleClick={(event) => event.stopPropagation()}>
    <header className="flex min-w-0 items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-blue-600">Collection</div>
        <h2 className="mt-1 truncate text-sm font-semibold" title={data.title}>{data.title || "Untitled collection"}</h2>
        <p className="mt-0.5 text-xs text-[var(--planner-secondary)]">{data.records.length} records · {view.name}</p>
      </div>
      <button ref={openCollectionButton} type="button" className={btnClass + " shrink-0"} onClick={openFull}>Open collection</button>
    </header>
    <ul className="mt-3 min-h-0 flex-1 space-y-1 overflow-hidden text-xs text-[var(--planner-secondary)] dark:text-[var(--planner-secondary)]" aria-label="Recent records">
      {previewRecords.map((record) => <li key={record.id} className="truncate rounded bg-[var(--planner-hover)] px-2 py-1.5 dark:bg-[var(--planner-surface)]">{recordTitle(data, record) || "Untitled record"}</li>)}
      {!previewRecords.length && <li className="rounded border border-dashed px-2 py-2 text-[var(--planner-secondary)]">No records yet</li>}
    </ul>
  </section>;
}
