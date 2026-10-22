"use client";

import { useRef, useState } from "react";
import { CollectionFloatingPanel } from "./CollectionFloatingPanel";
import { CollectionModalDialog } from "./CollectionModalDialog";
import { btnClass } from "./CollectionFieldEditor";
import { Table2, Columns3, CalendarDays, BarChart3 } from "lucide-react";
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
  const [contextMenu,setContextMenu]=useState<string|null>(null);
  const rightClickRef=useRef<HTMLButtonElement>(null);
  const target=views.find(view=>view.id===deleteViewId);
  const menuTarget=views.find(view=>view.id===contextMenu);
  const icons = {table:Table2, kanban:Columns3, calendar:CalendarDays, charts:BarChart3};
  const labels = {table:"Grid",kanban:"Board",calendar:"Schedule",charts:"Charts"};
  return <>
    <nav aria-label="Plan views" className="flex h-11 min-w-0 items-stretch gap-1 overflow-x-auto">
      {views.filter(v=>v.kind in icons).map(view=>{
        const Icon=icons[view.kind as keyof typeof icons];
        return <button type="button" key={view.id} aria-current={view.id===activeViewId?"page":undefined}
          className={"inline-flex min-h-10 shrink-0 items-center gap-1.5 border-b-2 px-2 text-sm transition hover:bg-[var(--planner-hover)] focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[var(--planner-accent)] "+
            (view.id===activeViewId?"border-[var(--planner-accent)] font-semibold text-[var(--planner-accent)]":"border-transparent text-[var(--planner-secondary)]")}
          onContextMenu={event=>{event.preventDefault();rightClickRef.current=event.currentTarget;setContextMenu(view.id);}}
          onClick={()=>onSelect(view.id)}><Icon aria-hidden="true" size={16} strokeWidth={1.75}/>
          {labels[view.kind as keyof typeof labels]}</button>;
      })}
    </nav>
    <CollectionFloatingPanel open={!!menuTarget} anchorRef={rightClickRef}
     role="menu" label={(menuTarget?.name??"View")+" view actions"}
     onClose={()=>setContextMenu(null)} className="w-44 rounded-lg p-1" align="start">
     <button type="button" role="menuitem" disabled={readOnly||views.length<=1}
       className="min-h-9 w-full rounded-md px-3 text-left text-sm text-red-700 hover:bg-[var(--planner-hover)] focus-visible:ring-2 disabled:opacity-40"
       onClick={()=>{setContextMenu(null);if(menuTarget)setDeleteViewId(menuTarget.id);}}>
       Delete view
     </button>
    </CollectionFloatingPanel>
    {target&&<CollectionModalDialog label={"Delete "+target.name+" view?"}
      trigger={rightClickRef.current} onClose={()=>setDeleteViewId(null)}>
      <h2 className="text-sm font-semibold">Delete “{target.name}” view?</h2>
      <p className="mt-2 text-sm text-[var(--planner-secondary)]">Records will remain.</p>
      <div className="mt-4 flex justify-end gap-2">
       <button data-dialog-initial type="button" className={btnClass}
        onClick={()=>setDeleteViewId(null)}>Cancel</button>
       <button type="button" className="min-h-9 rounded bg-red-700 px-3 text-sm text-white"
        onClick={()=>{onDelete(target.id);setDeleteViewId(null);}}>Delete view</button>
      </div>
    </CollectionModalDialog>}
  </>;
}
