import { useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { CollectionFloatingPanel } from "./CollectionFloatingPanel";

export function CollectionDrawerPicker({label,value,children}:{
 label:string;value:string;children:ReactNode;
}){
 const [open,setOpen]=useState(false);
 const trigger=useRef<HTMLButtonElement>(null);
 return <div className="min-w-0">
  <button ref={trigger} type="button" aria-label={label+" selector"}
   aria-haspopup="dialog" aria-expanded={open} onClick={()=>setOpen(!open)}
   className="flex min-h-9 w-full min-w-0 items-center justify-between gap-2 truncate rounded-md border border-[var(--planner-border)] bg-[var(--planner-surface)] px-2 text-left text-sm text-[var(--planner-text)] hover:bg-[var(--planner-hover)] focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)]">
   <span className="min-w-0 truncate">{value}</span><ChevronDown size={14}/>
  </button>
  <CollectionFloatingPanel open={open} anchorRef={trigger} onClose={()=>setOpen(false)}
    role="dialog" label={label+" options"} className="w-[min(240px,calc(100vw-16px))] rounded-md p-2">
    {children}
  </CollectionFloatingPanel>
 </div>;
}
