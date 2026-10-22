import { useEffect,useLayoutEffect,useRef,useState } from "react";
import {Search,X} from "lucide-react";
export function CollectionToolbarSearch({value,onChange}:{
 value:string;onChange:(text:string)=>void;
}){
 const [open,setOpen]=useState(false);
 const ref=useRef<HTMLInputElement>(null),trigger=useRef<HTMLButtonElement>(null);
 useLayoutEffect(()=>{if(open)ref.current?.focus({preventScroll:true});},[open]);
 useEffect(()=>{
  const listen=()=>setOpen(true);
  document.addEventListener("planner:focus-search",listen);
  return ()=>document.removeEventListener("planner:focus-search",listen);
 },[]);
 const close=()=>{onChange("");setOpen(false);requestAnimationFrame(()=>trigger.current?.focus());};
 return <div className="flex min-w-0 items-center">
  <button ref={trigger} type="button" aria-label="Search tasks" title="Search tasks (/)"
   onClick={()=>setOpen(true)}
   className="grid h-10 w-10 place-items-center rounded hover:bg-[var(--planner-hover)] focus-visible:ring-2">
   <Search size={16}/></button>
  {open&&<div className="flex w-[min(28vw,180px)] min-w-[68px] items-center gap-1 rounded border border-[var(--planner-border)] bg-[var(--planner-surface)] sm:w-44">
   <input ref={ref} aria-label="Search plan tasks" placeholder="Search…"
    className="min-w-0 w-full p-1.5 text-sm" value={value}
    onChange={e=>onChange(e.target.value)}
    onKeyDown={e=>{if(e.key==="Escape"){e.preventDefault();e.stopPropagation();close();}}}/>
   <button aria-label="Clear and close search" type="button" onClick={close}
    className="grid h-8 w-8 shrink-0 place-items-center rounded hover:bg-[var(--planner-hover)]"><X size={14}/></button>
  </div>}
 </div>;
}