import { Fragment,useMemo,useState } from "react";
import {viewGroupName} from "../collections/collectionToolbarGrouping";
import {buildTaskTree} from "../collections/collectionTaskTree";
import {taskBreadcrumb} from "../collections/collectionTreeActions";
import { CheckCircle2, Circle, CircleDot, Flag, Pencil, Trash2, ChevronDown, ChevronRight, CornerDownRight } from "lucide-react";
import { taskAssignees, taskDate, localToday } from "../collections/collectionTasks";
import { formatPlannerCardDate } from "../collections/collectionDateDisplay";
import { setTaskProgress } from "./collectionBoardGroups";
import { CollectionBlockedBadge } from "./CollectionBlockedBadge";
import { recordTitle, type CollectionBlockPayload, type CollectionRecord, type CollectionField } from "../collections/model";
interface Props {
 data:CollectionBlockPayload;rows:CollectionRecord[];selected:string[];readOnly:boolean;
 onSelect:(id:string,checked:boolean)=>void;onOpen:(id:string)=>void;
 onChange:(next:CollectionBlockPayload)=>void;onDeleteRequest:(id:string)=>void;groupField?:CollectionField;
}
export function CollectionGridMobileCards({data,rows,selected,readOnly,onSelect,onOpen,onChange,onDeleteRequest,groupField}:Props){
 const tree=useMemo(()=>buildTaskTree(data.records),[data.records]);
 const [collapsed,setCollapsed]=useState<Set<string>>(()=>new Set());
 const toggle=(id:string)=>setCollapsed(previous=>{const next=new Set(previous);if(next.has(id))next.delete(id);else next.add(id);return next;});
 return <div data-testid="collection-mobile-grid" className="space-y-1 sm:hidden">
  {rows.filter(record=>{let parent=record.parentId;const seen=new Set<string>();
   while(parent&&!seen.has(parent)){if(collapsed.has(parent))return false;seen.add(parent);parent=tree.byId.get(parent)?.parentId;}
   return true;
  }).map((record,index,all)=>{
   const depth=tree.depth.get(record.id)??1;
   const hasChildren=!!tree.children.get(record.id)?.length;
   const path=record.parentId?taskBreadcrumb(data,record.id).slice(0,-1).map(item=>recordTitle(data,item)).join(" › "):"";
   const title=recordTitle(data,record),people=taskAssignees(data,record);
   const labels=(data.labels??[]).filter(label=>record.labelIds?.includes(label.id));
   const due=taskDate(data,record,"due"),progress=record.progress??"not_started";
   return <Fragment key={record.id}>
   {groupField&&(index===0||all[index-1]?.values[groupField.id]!==record.values[groupField.id])&&
    <h3 data-testid="planner-grid-group" className="min-h-11 border-b border-[var(--planner-border)] p-3 text-sm font-semibold">
    {groupField.name}: {viewGroupName(record,groupField)}</h3>}
   <article data-record-id={record.id}
    className={"rounded-lg border-b border-[var(--planner-border)] bg-[var(--planner-surface)] p-2.5 text-[var(--planner-text)] "+(depth>1?"border-l-2 border-l-[var(--planner-accent)]":"")}
    style={{marginInlineStart:Math.min(depth-1,3)*14}} data-tree-depth={depth}>
    {depth>1&&<div className="mb-1 flex items-center gap-1 text-[10px] text-[var(--planner-secondary)]">
      <CornerDownRight size={12} aria-hidden="true"/><span className="truncate">{path}</span>
    </div>}
    <div className="flex flex-wrap items-center gap-1">
     {hasChildren?<button type="button" aria-label={(collapsed.has(record.id)?"Expand ":"Collapse ")+title}
       aria-expanded={!collapsed.has(record.id)} onClick={()=>toggle(record.id)}
       className="grid h-11 w-11 shrink-0 place-items-center rounded text-[var(--planner-secondary)] focus-visible:ring-2">
       {collapsed.has(record.id)?<ChevronRight size={15}/>:<ChevronDown size={15}/>}</button>:
       <span className="w-11 shrink-0" aria-hidden="true"/>}
     <button type="button" aria-label={(progress==="completed"?"Reopen ":"Complete ")+title}
      disabled={readOnly} onClick={()=>onChange(setTaskProgress(data,record.id,progress==="completed"?"not_started":"completed"))}
      className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[var(--planner-accent)] focus-visible:ring-2">
      {progress==="completed"?<CheckCircle2 size={19}/>:progress==="in_progress"?<CircleDot size={19}/>:<Circle size={19}/>}
     </button>
     <button type="button" className="min-h-11 min-w-[96px] flex-1 truncate text-left text-sm font-medium focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)]"
      onClick={()=>onOpen(record.id)} aria-label={"Open "+title}>{title}</button>
     <button type="button" aria-label={"Select task "+title} aria-pressed={selected.includes(record.id)}
      disabled={readOnly} onClick={()=>onSelect(record.id,!selected.includes(record.id))}
      className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[var(--planner-secondary)] focus-visible:ring-2">
      {selected.includes(record.id)?<CheckCircle2 size={16} className="text-[var(--planner-accent)]"/>:<Circle size={16}/>}</button>
     <button type="button" aria-label={"Edit "+title} title="Open task" onClick={()=>onOpen(record.id)}
      className="grid h-11 w-11 shrink-0 place-items-center rounded hover:bg-[var(--planner-hover)]"><Pencil size={15}/></button>
     <button type="button" aria-label={"Delete "+title} title="Delete task" disabled={readOnly}
      onClick={()=>onDeleteRequest(record.id)}
      className="grid h-11 w-11 shrink-0 place-items-center rounded text-[var(--planner-secondary)] hover:text-rose-600"><Trash2 size={14}/></button>
    </div>
    <button type="button" aria-label={"Edit "+title+" details"}
     className="ml-11 flex min-h-11 max-w-[calc(100%-2.75rem)] flex-wrap items-center gap-2 text-left text-[11px] text-[var(--planner-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)]"
     onClick={()=>onOpen(record.id)}>
     <CollectionBlockedBadge data={data} record={record}/>
     {due&&<span className={due<localToday()&&progress!=="completed"?"text-rose-600":""}>{formatPlannerCardDate(due,localToday())}</span>}
     {record.priority&&record.priority!=="medium"&&<span className="inline-flex items-center gap-0.5"><Flag size={12}/>{record.priority.charAt(0).toUpperCase()+record.priority.slice(1)}</span>}
     {labels.map(label=><span key={label.id} className="rounded px-1.5 py-0.5 text-white" style={{backgroundColor:/^#[0-9a-f]{6}$/i.test(label.color)?label.color:"#5B5FC7"}}>{label.name}</span>)}
     {people.map(person=><span key={person.id} className="rounded-full bg-[var(--planner-hover)] px-1.5 py-0.5" title={person.name}>{person.name}</span>)}
    </button>
   </article></Fragment>;
  })}
  {!rows.length&&<p role="status" className="rounded-lg border border-dashed p-5 text-center text-xs text-[var(--planner-secondary)]">
   No matching tasks. Change filters or add a task.</p>}
 </div>;
}
