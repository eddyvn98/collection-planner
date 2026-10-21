import { useRef, useState } from "react";
import { BarChart3, CalendarDays, ChevronDown, Columns3, Table2 } from "lucide-react";
import { CollectionFloatingPanel } from "./CollectionFloatingPanel";
import type { CollectionView } from "../collections/model";
const ICONS={table:Table2,kanban:Columns3,calendar:CalendarDays,charts:BarChart3};
const NAMES={table:"Grid",kanban:"Board",calendar:"Schedule",charts:"Charts"};
export function CollectionMobileViewPicker({views,selected,onSelect}:{
 views:CollectionView[];selected:string;onSelect:(id:string)=>void;
}){
 const [open,setOpen]=useState(false);
 const trigger=useRef<HTMLButtonElement>(null);
 const current=views.find(x=>x.id===selected),kind=current?.kind;
 const Icon=kind&&kind in ICONS?ICONS[kind as keyof typeof ICONS]:Table2;
 const label=kind&&kind in NAMES?NAMES[kind as keyof typeof NAMES]:(current?.name??"View");
 return <div className="relative min-w-0 shrink-0 sm:hidden">
  <button ref={trigger} type="button" aria-label="Choose view" aria-haspopup="menu" aria-expanded={open}
   onClick={()=>setOpen(!open)} className="flex h-10 min-w-[88px] max-w-[110px] items-center justify-center gap-1 rounded px-1 text-[var(--planner-accent)] hover:bg-[var(--planner-hover)] focus-visible:ring-2">
   <Icon size={16} strokeWidth={1.75}/><span className="truncate text-xs font-semibold">{label}</span><ChevronDown size={13}/>
  </button>
  <CollectionFloatingPanel open={open} anchorRef={trigger} onClose={()=>setOpen(false)}
   role="menu" label="Select plan view" align="start" className="w-44 rounded-md p-1">
   {views.filter(v=>v.kind in ICONS).map(v=>{
    const K=ICONS[v.kind as keyof typeof ICONS];
    return <button key={v.id} type="button" role="menuitemradio" aria-checked={v.id===selected}
     className="flex min-h-11 w-full items-center gap-2 rounded px-3 text-left text-sm hover:bg-[var(--planner-hover)] focus-visible:ring-2"
     onClick={()=>{onSelect(v.id);setOpen(false);}}>
      <K size={16} strokeWidth={1.75}/>{NAMES[v.kind as keyof typeof NAMES]}</button>;
   })}
  </CollectionFloatingPanel>
 </div>;
}
