import { CheckCircle2, Circle, CircleDot, Flag } from "lucide-react";
import { taskAssignees, taskDate, localToday } from "../collections/collectionTasks";
import { formatPlannerCardDate } from "../collections/collectionDateDisplay";
import { setTaskProgress } from "./collectionBoardGroups";
import { recordTitle, type CollectionBlockPayload, type CollectionRecord } from "../collections/model";
interface Props {
 data:CollectionBlockPayload;rows:CollectionRecord[];selected:string[];readOnly:boolean;
 onSelect:(id:string,checked:boolean)=>void;onOpen:(id:string)=>void;
 onChange:(next:CollectionBlockPayload)=>void;
}
export function CollectionGridMobileCards({data,rows,selected,readOnly,onSelect,onOpen,onChange}:Props){
 return <div data-testid="collection-mobile-grid" className="space-y-1 sm:hidden">
  {rows.map(record=>{
   const title=recordTitle(data,record),people=taskAssignees(data,record);
   const labels=(data.labels??[]).filter(label=>record.labelIds?.includes(label.id));
   const due=taskDate(data,record,"due"),progress=record.progress??"not_started";
   return <article key={record.id} data-record-id={record.id}
    className="rounded-lg border-b border-[var(--planner-border)] bg-[var(--planner-surface)] p-2.5 text-[var(--planner-text)]">
    <div className="flex items-center gap-2">
     <button type="button" aria-label={(progress==="completed"?"Reopen ":"Complete ")+title}
      disabled={readOnly} onClick={()=>onChange(setTaskProgress(data,record.id,progress==="completed"?"not_started":"completed"))}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[var(--planner-accent)] focus-visible:ring-2">
      {progress==="completed"?<CheckCircle2 size={19}/>:progress==="in_progress"?<CircleDot size={19}/>:<Circle size={19}/>}
     </button>
     <button type="button" className="min-w-0 flex-1 truncate text-left text-sm font-medium focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)]"
      onClick={()=>onOpen(record.id)} aria-label={"Open "+title}>{title}</button>
     <input type="checkbox" className="h-4 w-4 shrink-0" aria-label={"Select task "+title}
      disabled={readOnly} checked={selected.includes(record.id)}
      onChange={e=>onSelect(record.id,e.target.checked)}/>
    </div>
    <button type="button" aria-label={"Edit "+title+" details"}
     className="ml-11 flex min-h-7 max-w-[calc(100%-2.75rem)] flex-wrap items-center gap-2 text-left text-[11px] text-[var(--planner-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)]"
     onClick={()=>onOpen(record.id)}>
     {due&&<span className={due<localToday()&&progress!=="completed"?"text-rose-600":""}>{formatPlannerCardDate(due,localToday())}</span>}
     {record.priority&&record.priority!=="medium"&&<span className="inline-flex items-center gap-0.5"><Flag size={12}/>{record.priority}</span>}
     {labels.map(label=><span key={label.id} className="rounded px-1.5 py-0.5 text-white" style={{backgroundColor:/^#[0-9a-f]{6}$/i.test(label.color)?label.color:"#5B5FC7"}}>{label.name}</span>)}
     {people.map(person=><span key={person.id} className="rounded-full bg-[var(--planner-hover)] px-1.5 py-0.5" title={person.name}>{person.name}</span>)}
    </button>
   </article>;
  })}
  {!rows.length&&<p role="status" className="rounded-lg border border-dashed p-5 text-center text-xs text-[var(--planner-secondary)]">
   No matching tasks. Change filters or add a task.</p>}
 </div>;
}
