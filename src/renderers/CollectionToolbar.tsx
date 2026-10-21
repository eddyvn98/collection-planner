"use client";

import type { ReactNode, RefObject } from "react";
import { ArrowLeft, CheckCircle2, ExternalLink, History, LoaderCircle, Settings2, TriangleAlert, X } from "lucide-react";

const iconButtonClass = "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--planner-secondary)] transition hover:bg-[var(--planner-hover)] hover:text-[var(--planner-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-[var(--planner-secondary)] dark:hover:bg-[var(--planner-surface)] dark:hover:text-white";

interface Props {
  title: string;
  recordCount: number;
  readOnly: boolean;
  full: boolean;
  settings: boolean;
  showHistory: boolean;
  navigation?: { collectionsHref: string; canvasHref: string; syncMessage: string };
  backButtonRef: RefObject<HTMLButtonElement>;
  onTitleChange: (value: string) => void;
  onToggleSettings: () => void;
  onToggleHistory: () => void;
  onCloseFull: () => void;
  actions?: ReactNode;
}

export function CollectionToolbar({ title, recordCount, readOnly, full, settings, showHistory, navigation,
  backButtonRef, onTitleChange, onToggleSettings, onToggleHistory, onCloseFull, actions }: Props) {
  const syncIcon = navigation?.syncMessage === "Saved" ? CheckCircle2
    : navigation?.syncMessage.startsWith("Save failed") ? TriangleAlert : LoaderCircle;
  const SyncIcon = syncIcon;
  return <header className="relative z-50 flex h-12 min-w-0 shrink-0 items-center gap-1 border-b border-[var(--planner-border)] bg-[var(--planner-surface)] px-2 dark:border-[var(--planner-border)] dark:bg-[var(--planner-surface)] sm:px-3">
    {navigation && <>
      <a href={navigation.collectionsHref} aria-label="All Collections" title="All Collections" className={iconButtonClass}>
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
      </a>
      <a href={navigation.canvasHref} aria-label="Open canvas" title="Open canvas" className={iconButtonClass}>
        <ExternalLink aria-hidden="true" className="h-4 w-4" />
      </a>
      <span aria-hidden="true" className="mx-1 h-5 border-l border-[var(--planner-border)] dark:border-[var(--planner-border)]" />
    </>}
    {!navigation && full && <button ref={backButtonRef} type="button" className={iconButtonClass}
      aria-label="Back" title="Back" onClick={onCloseFull}>
      <ArrowLeft aria-hidden="true" className="h-4 w-4" />
    </button>}
    <input aria-label="Collection title" className="min-w-0 flex-1 bg-transparent text-sm font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-blue-200 sm:text-base"
      title={title} value={title} disabled={readOnly} onChange={event => onTitleChange(event.target.value)} />
    <span aria-label={`${recordCount} records`} title={`${recordCount} records`}
      className="inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full bg-[var(--planner-hover)] px-2 text-xs font-medium tabular-nums text-[var(--planner-secondary)] dark:bg-[var(--planner-surface)] dark:text-[var(--planner-secondary)]">{recordCount}</span>
    {actions}
    <button type="button" aria-label={settings ? "Hide settings" : "Settings"} title={settings ? "Hide settings" : "Settings"}
      aria-pressed={settings} className={iconButtonClass + (settings ? " bg-[var(--planner-hover)] text-[var(--planner-text)] dark:bg-[var(--planner-surface)] dark:text-white" : "")}
      onClick={onToggleSettings}><Settings2 aria-hidden="true" className="h-4 w-4" /></button>
    <button type="button" aria-label={showHistory ? "Hide history" : "History"} title={showHistory ? "Hide history" : "History"}
      aria-pressed={showHistory} className={iconButtonClass + (showHistory ? " bg-[var(--planner-hover)] text-[var(--planner-text)] dark:bg-[var(--planner-surface)] dark:text-white" : "")}
      onClick={onToggleHistory}><History aria-hidden="true" className="h-4 w-4" /></button>
    {navigation && <span role="status" aria-label={navigation.syncMessage} title={navigation.syncMessage}
      className="ml-1 inline-flex h-8 w-8 shrink-0 items-center justify-center text-[var(--planner-secondary)]">
      <SyncIcon aria-hidden="true" className={`h-4 w-4 ${navigation.syncMessage === "Saved" ? "text-emerald-600" : navigation.syncMessage.startsWith("Save failed") ? "text-rose-600" : "animate-spin text-blue-600"}`} />
    </span>}
    {full && <button type="button" className={iconButtonClass} aria-label="Exit collection screen" title="Exit collection screen" onClick={onCloseFull}>
      <X aria-hidden="true" className="h-4 w-4" />
    </button>}
  </header>;
}
