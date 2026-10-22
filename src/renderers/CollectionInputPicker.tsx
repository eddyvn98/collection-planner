import {useRef,useState,type ReactNode} from "react";
import {addDays,addMonths,endOfMonth,format,parseISO,startOfMonth} from "date-fns";
import {ChevronDown,ChevronLeft,ChevronRight,CalendarDays} from "lucide-react";
import {parseNaturalDate} from "../collections/collectionInputParser";
import {CollectionFloatingPanel} from "./CollectionFloatingPanel";
interface Props{label:string;value:string;onChange:(value:string)=>void;disabled:boolean;
 kind:"date"|"select";options?:{value:string;label:string}[];placeholder?:string;
 children?:ReactNode;testId?:string;warning?:boolean;panelLabel?:string;}
export function CollectionInputPicker({label,value,onChange,disabled,kind,options=[],
 placeholder,children,testId,warning,panelLabel}:Props){
 const [open,setOpen]=useState(false),[draft,setDraft]=useState("");
 const [error,setError]=useState("");
 const [month,setMonth]=useState(()=>value||format(new Date(),"yyyy-MM-dd"));
 const trigger=useRef<HTMLButtonElement>(null);
 const date=value?parseNaturalDate(value):null;
 const pick=(next:string)=>{onChange(next);setDraft("");setError("");setOpen(false);};
 const typed=()=>{
  const parsed=parseNaturalDate(draft);
  if(parsed)pick(parsed);else setError("Use mai, thứ 6, +3d or YYYY-MM-DD");
 };
 const first=startOfMonth(parseISO(month)),last=endOfMonth(first);
 const pad=(first.getDay()+6)%7;
 const days=Array.from({length:Math.ceil((pad+last.getDate())/7)*7},(_,i)=>
  format(addDays(first,i-pad),"yyyy-MM-dd"));
 return <span className="inline-flex min-w-0 max-w-full">
  <button ref={trigger} type="button" disabled={disabled} aria-label={label} data-testid={testId}
   aria-haspopup="dialog" aria-expanded={open} onClick={()=>{setOpen(x=>!x);setError("");}}
   className={"flex min-h-11 min-w-11 max-w-full items-center gap-2 rounded border border-[var(--planner-border)] bg-[var(--planner-surface)] px-3 text-sm hover:bg-[var(--planner-hover)] focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)] "+(warning?"font-semibold text-red-600":"")}>
   {children??<>
   {kind==="date"?<CalendarDays size={16}/>:null}
   <span className="min-w-0 truncate">{value||placeholder||"Choose..."}</span>
   <ChevronDown size={14}/></>}
  </button>
  <CollectionFloatingPanel open={open} anchorRef={trigger} onClose={()=>setOpen(false)}
   role="dialog" label={panelLabel??(label+" picker")} align="start"
   className="w-[min(320px,calc(100vw-16px))] rounded-lg p-3">
   {kind==="select"?<div className="grid max-h-72 gap-1 overflow-auto">
    <strong className="mb-1 text-sm">{label}</strong>
    {([{value:"",label:"Unassigned"},...options]).map(item=><button key={item.value}
     type="button" aria-pressed={value===item.value} onClick={()=>pick(item.value)}
     className="min-h-11 rounded px-3 text-left text-sm hover:bg-[var(--planner-hover)] aria-pressed:bg-[var(--planner-hover)]">
     {item.label}</button>)}
   </div>:<div className="space-y-2">
    <label className="block text-xs">Enter natural date
     <input autoFocus aria-label={"Natural date for "+label} value={draft} onChange={e=>{setDraft(e.target.value);setError("");}}
      placeholder="mai · thứ 6 · +3d · 2026-11-01"
      className="mt-1 min-h-11 w-full rounded border border-[var(--planner-border)] bg-[var(--planner-surface)] px-3 text-sm"
      onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();typed();}}}/>
    </label>
    {error&&<p role="alert" className="text-xs text-red-600">{error}</p>}
    <div className="flex gap-2">
     <button type="button" onClick={typed} className="min-h-11 flex-1 rounded bg-[var(--planner-accent)] px-3 text-sm text-white">Apply</button>
     <button type="button" onClick={()=>pick("")} className="min-h-11 rounded px-3 text-sm underline">Clear</button>
    </div>
    <div className="flex items-center gap-1">
     <button type="button" aria-label="Previous month" onClick={()=>setMonth(format(addMonths(first,-1),"yyyy-MM-dd"))}
      className="grid h-11 w-11 place-items-center rounded hover:bg-[var(--planner-hover)]"><ChevronLeft/></button>
     <strong className="flex-1 text-center text-xs">{format(first,"MMMM yyyy")}</strong>
     <button type="button" aria-label="Next month" onClick={()=>setMonth(format(addMonths(first,1),"yyyy-MM-dd"))}
      className="grid h-11 w-11 place-items-center rounded hover:bg-[var(--planner-hover)]"><ChevronRight/></button>
    </div>
    <div className="overflow-x-auto"><div className="grid min-w-[320px] grid-cols-7 gap-0.5">
     {["M","T","W","T","F","S","S"].map((name,i)=><span key={i} className="text-center text-xs">{name}</span>)}
     {days.map(day=><button type="button" key={day} aria-label={"Pick "+day}
      className={"min-h-11 min-w-11 rounded text-xs hover:bg-[var(--planner-hover)] "+
       (date===day?"bg-[var(--planner-accent)] text-white":"")}
      onClick={()=>pick(day)}>{Number(day.slice(8))}</button>)}
    </div></div>
   </div>}
  </CollectionFloatingPanel>
 </span>;
}
