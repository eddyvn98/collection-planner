"use client";

import React, { useEffect, useRef, useState } from "react";
import { btnClass } from "./CollectionFieldEditor";

interface Props {
  onExportCsv: () => void;
  onBackupJson: () => void;
  onImport: () => void;
  importDisabled: boolean;
}

function TransferIcon({ direction }: { direction: "up" | "down" }) {
  return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
    <path d={direction === "up" ? "M10 13V3m0 0L6 7m4-4 4 4M4 11v5h12v-5" : "M10 7v10m0 0 4-4m-4 4-4-4M4 9V4h12v5"}
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}

export function CollectionImportExportMenu({ onExportCsv, onBackupJson, onImport, importDisabled }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const run = (action: () => void) => {
    setOpen(false);
    action();
  };

  return <div ref={rootRef} className="relative">
    <button type="button" className={btnClass} aria-haspopup="menu" aria-expanded={open}
      aria-label="Import or export collection" title="Import or export collection" onClick={() => setOpen(value => !value)}>
      <TransferIcon direction="down" /><TransferIcon direction="up" />
      <span>Import / export</span>
    </button>
    {open && <div role="menu" aria-label="Import and export options"
      className="absolute left-0 top-full z-30 mt-2 min-w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
      <button type="button" role="menuitem" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-200 dark:hover:bg-slate-800"
        onClick={() => run(onExportCsv)}><TransferIcon direction="up" />Export CSV</button>
      <button type="button" role="menuitem" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-200 dark:hover:bg-slate-800"
        onClick={() => run(onBackupJson)}><TransferIcon direction="up" />Backup JSON</button>
      <button type="button" role="menuitem" disabled={importDisabled}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-200 dark:hover:bg-slate-800"
        onClick={() => run(onImport)}><TransferIcon direction="down" />Import CSV/JSON</button>
    </div>}
  </div>;
}
