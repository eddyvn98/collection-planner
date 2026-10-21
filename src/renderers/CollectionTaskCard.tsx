import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays, CheckCircle2, Circle, ClipboardCheck, Flag, GripVertical,
 MessageCircle, Paperclip, StickyNote } from "lucide-react";
import { recordTitle, type CollectionBlockPayload, type CollectionRecord } from "../collections/model";
import { taskAssignees } from "../collections/collectionTasks";
import { cardIndicators } from "../collections/collectionCardIndicators";
import { setTaskProgress, cardDragId } from "./collectionBoardGroups";
interface Props {
 data:CollectionBlockPayload;record:CollectionRecord;groupKey:string;readOnly:boolean;
 onChange:(data:CollectionBlockPayload)=>void;onOpen:(trigger:HTMLButtonElement)=>void;
}
export function CollectionTaskCard({data,record,groupKey,readOnly,onChange,onOpen}:Props){
 const drag=useDraggable({id:cardDragId(record.id,groupKey),disabled:readOnly});
 const drop=useDroppable({id:cardDragId(record.id,groupKey),disabled:readOnly});
 const title=recordTitle(data,record),complete=record.progress==="completed";
 const indicators=cardIndicators(data,record);
 const due=indicators.due,late=indicators.overdue;
 const people=taskAssignees(data,record);
 const labels=(data.labels??[]).filter(item=>record.labelIds?.includes(item.id));
 const img=record.attachments?.find(item=>
   /\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(item.url) && (item.url.startsWith("data:image/") || item.url.startsWith("/")));
 const focusArrow=(e:React.KeyboardEvent<HTMLButtonElement>)=>{
  if(!["ArrowDown","ArrowUp","ArrowLeft","ArrowRight"].includes(e.key))return;
  const buttons=[...document.querySelectorAll<HTMLButtonElement>("[data-board-card-focus]")];
  const index=buttons.indexOf(e.currentTarget);
  const offset=["ArrowRight","ArrowDown"].includes(e.key)?1:-1;
  const target=buttons[(index+offset+buttons.length)%buttons.length];
  if(target){e.preventDefault();target.focus();}
 };
 return <article ref={node=>{drag.setNodeRef(node);drop.setNodeRef(node);}}
   data-testid="collection-kanban-card" data-record-id={record.id}
   className={"group mb-2 overflow-hidden rounded-[4px] border border-[var(--planner-border)] bg-[var(--planner-surface)] p-2.5 text-[var(--planner-text)] shadow-[0_1px_3px_#00000013] transition hover:shadow-md "+
    (drop.isOver?"ring-2 ring-[var(--planner-accent)]":"")}
   style={{transform:CSS.Translate.toString(drag.transform),opacity:drag.isDragging?.55:1}}>
  {img&&<img src={img.url} alt={img.name} loading="lazy" className="mb-2 h-24 w-full rounded object-cover"/>}
  {!!labels.length&&<div data-testid="card-labels" className="mb-2 flex flex-wrap gap-1">
    {labels.map(label=><span key={label.id} className="rounded-[3px] px-2 py-0.5 text-[11px] text-white"
      style={{backgroundColor:/^#[0-9a-f]{6}$/i.test(label.color)?label.color:"#5B5FC7"}}>{label.name}</span>)}
   </div>}
  <div className="flex items-start gap-1.5">
   <button type="button" title={complete?"Mark not started":"Mark complete"} aria-label={(complete?"Reopen ":"Complete ")+title}
    disabled={readOnly} onClick={()=>onChange(setTaskProgress(data,record.id,complete?"not_started":"completed"))}
    className="flex min-h-8 min-w-8 shrink-0 items-center justify-center rounded-full text-[var(--planner-accent)] hover:bg-[var(--planner-hover)] focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)]">
     {complete?<CheckCircle2 size={18} strokeWidth={1.75}/>:<Circle size={18} strokeWidth={1.75}/>}
   </button>
   <button type="button" data-board-card-focus onClick={e=>onOpen(e.currentTarget)} onKeyDown={focusArrow}
    className={"min-h-8 min-w-0 flex-1 text-left text-sm font-medium hover:text-[var(--planner-accent)] focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)] "+
     (complete?"text-[var(--planner-secondary)] line-through":"")}>{title}</button>
   <button type="button" aria-label={"Drag "+title} title="Drag task" disabled={readOnly}
    className="min-h-8 min-w-8 shrink-0 cursor-grab touch-none rounded text-[var(--planner-secondary)] opacity-60 hover:bg-[var(--planner-hover)] group-hover:opacity-100 focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)]"
    {...drag.attributes} {...drag.listeners}><GripVertical size={16} strokeWidth={1.75}/></button>
  </div>
  <div className="mt-1.5 flex flex-wrap items-center gap-3 pl-1 text-xs text-[var(--planner-secondary)]">
   {indicators.priority&&<span data-testid="card-priority" title={"Priority "+record.priority}
     className="flex gap-1 text-red-600"><Flag size={15} strokeWidth={1.75}/>{record.priority}</span>}
   {!!indicators.checklist&&<span data-testid="card-checklist" title="Checklist" className="flex gap-1"><ClipboardCheck size={15}/>{indicators.checklist}</span>}
   {!!indicators.attachments&&<span data-testid="card-attachments" title="Attachments" className="flex gap-1"><Paperclip size={15}/>{indicators.attachments}</span>}
   {indicators.notes&&<span data-testid="card-notes" title="Notes"><StickyNote size={15}/></span>}
   {!!indicators.comments&&<span data-testid="card-comments" title="Comments" className="flex gap-1"><MessageCircle size={15}/>{indicators.comments}</span>}
  </div>
  {(due||people.length>0)&&<div className="mt-2 flex items-center justify-between gap-2 text-xs">
   {due?<span data-testid="card-due" className={"inline-flex items-center gap-1 rounded px-1.5 py-1 "+
     (late?"bg-red-50 font-semibold text-red-700 dark:bg-red-950 dark:text-red-300":"text-[var(--planner-secondary)]")}>
      <CalendarDays size={14}/>{due}</span>:<span/>}
   {!!people.length&&<div data-testid="card-avatars" className="flex -space-x-1.5">
     {people.slice(0,4).map(person=><span key={person.id} title={person.name} aria-label={person.name}
       className="grid h-7 w-7 place-items-center rounded-full border-2 border-[var(--planner-surface)] bg-[#dcdafa] text-[10px] font-bold text-[#32317a]">
       {person.name.split(/\s+/).slice(0,2).map(x=>x[0]??"").join("").toUpperCase()}</span>)}
   </div>}
  </div>}
 </article>;
}
