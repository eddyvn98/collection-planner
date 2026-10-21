"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { btnClass } from "./CollectionFieldEditor";
import type { CollectionView } from "../collections/model";

interface Props {
  views: CollectionView[];
  activeViewId: string;
  readOnly: boolean;
  onSelect: (viewId: string) => void;
  onDelete: (viewId: string) => void;
}

export function CollectionViewTabs({ views, activeViewId, readOnly, onSelect, onDelete }: Props) {
  const [deleteViewId, setDeleteViewId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ viewId: string; x: number; y: number } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const target = views.find(view => view.id === deleteViewId);
  useEffect(() => {
    if (!contextMenu) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!contextMenuRef.current?.contains(event.target as Node)) setContextMenu(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setContextMenu(null);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [contextMenu]);
  const menuTarget = views.find(view => view.id === contextMenu?.viewId);
  const menu = contextMenu && menuTarget && typeof document !== "undefined" ? createPortal(
    <div ref={contextMenuRef} role="menu" aria-label={`${menuTarget.name} view actions`}
      className="fixed z-[130] min-w-40 rounded-lg border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900"
      style={{ left: Math.max(8, Math.min(contextMenu.x, window.innerWidth - 176)), top: Math.max(8, Math.min(contextMenu.y, window.innerHeight - 52)) }}>
      <button type="button" role="menuitem" disabled={readOnly || views.length <= 1}
        className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-rose-950"
        onClick={() => { setContextMenu(null); setDeleteViewId(menuTarget.id); }}>Delete view</button>
    </div>, document.body) : null;
  const dialog = target && typeof document !== "undefined" ? createPortal(
    <div role="alertdialog" aria-modal="true" aria-labelledby="collection-delete-view-title"
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/30 p-4"
      onMouseDown={event => { if (event.target === event.currentTarget) setDeleteViewId(null); }}
      onKeyDown={event => { if (event.key === "Escape") setDeleteViewId(null); }}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-2xl dark:bg-slate-900">
        <h2 id="collection-delete-view-title" className="text-sm font-semibold">Delete “{target.name}” view?</h2>
        <p className="mt-1 text-sm text-slate-500">This removes the view and its filters. Collection records will remain.</p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" autoFocus className={btnClass} onClick={() => setDeleteViewId(null)}>Cancel</button>
          <button type="button" className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            onClick={() => { onDelete(target.id); setDeleteViewId(null); }}>Delete view</button>
        </div>
      </div>
    </div>, document.body) : null;

  return <>
    <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
      {views.map(view => <button key={view.id} aria-pressed={view.id === activeViewId}
        className={btnClass + (view.id === activeViewId ? " bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white" : " text-slate-500 dark:text-slate-400")}
        onContextMenu={event => { event.preventDefault(); setContextMenu({ viewId: view.id, x: event.clientX, y: event.clientY }); }}
        onClick={event => { if (event.button === 0) onSelect(view.id); }}>{view.name}</button>)}
    </div>
    {menu}
    {dialog}
  </>;
}
