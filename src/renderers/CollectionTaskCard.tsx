import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useRef,useState } from "react";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays, CheckCircle2, Circle, ClipboardCheck, Flag, GripVertical,
 MessageCircle, Paperclip, StickyNote, Trash2, CornerDownRight } from "lucide-react";
import { deleteRecord,primaryField,recordTitle,setRecordValue, type CollectionBlockPayload, type CollectionRecord } from "../collections/model";
import { taskAssignees, localToday } from "../collections/collectionTasks";
import { formatPlannerCardDate,formatPlannerPriority } from "../collections/collectionDateDisplay";
import { cardIndicators } from "../collections/collectionCardIndicators";
import { CollectionBoardSubtaskDrop } from "./CollectionBoardSubtaskDrop";
import { CollectionBlockedBadge } from "./CollectionBlockedBadge";
import { CollectionModalDialog } from "./CollectionModalDialog";
import { setTaskProgress, cardDragId } from "./collectionBoardGroups";
interface Props {
 data:CollectionBlockPayload;record:CollectionRecord;groupKey:string;readOnly:boolean;
 onChange:(data:CollectionBlockPayload)=>void;onOpen:(trigger:HTMLButtonElement)=>void;
 descendants?:{done:number;total:number};
}
export function CollectionTaskCard({data,record,groupKey,readOnly,descendants,onChange,onOpen}:Props){
 const pendingOpen=useRef<ReturnType<typeof setTimeout>|null>(null);
 const cancelledRename=useRef(false);
 const titleRef=useRef<HTMLButtonElement>(null);
 const [confirmDelete,setConfirmDelete]=useState(false);
 const [renaming,setRenaming]=useState(false),[draft,setDraft]=useState("");
 const drag=useDraggable({id:cardDragId(record.id,groupKey),disabled:readOnly});
 const drop=useDroppable({id:cardDragId(record.id,groupKey),disabled:readOnly});
 const title=recordTitle(data,record),complete=record.progress==="completed";
 const finishRename=(save:boolean)=>{
  const field=primaryField(data);
  if(save&&field&&draft.trim()&&draft.trim()!==title)
   onChange(setRecordValue(data,record.id,field.id,draft.trim()));
  setRenaming(false);
  requestAnimationFrame(()=>titleRef.current?.focus());
 };
 const beginRename=()=>{if(readOnly)return;setDraft(title);cancelledRename.current=false;setRenaming(true);};
 const hasChildren=(descendants?.total??0)>0;
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
   className={"planner-motion-card group mb-2 overflow-hidden rounded-[4px] border border-[var(--planner-border)] bg-[var(--planner-surface)] p-2.5 text-[var(--planner-text)] shadow-[0_1px_3px_#00000013] transition hover:shadow-md "+
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
   {renaming?<input autoFocus aria-label={"Rename "+title} value={draft} maxLength={300}
    onFocus={event=>event.currentTarget.select()}
    onChange={event=>setDraft(event.target.value)}
    onBlur={()=>finishRename(!cancelledRename.current)}
    onKeyDown={event=>{event.stopPropagation();
     if(event.key==="Enter"){event.preventDefault();event.currentTarget.blur();}
     if(event.key==="Escape"){cancelledRename.current=true;event.currentTarget.blur();}
    }}
    className="min-h-11 min-w-0 flex-1 rounded border-2 border-[var(--planner-accent)] bg-[var(--planner-surface)] px-2 text-sm"/>:
   <button ref={titleRef} type="button" data-board-card-focus
    title="Double-click or F2 to rename"
    onClick={event=>{
     if(event.detail===0){onOpen(event.currentTarget);return;}
     if(pendingOpen.current)clearTimeout(pendingOpen.current);
     if(event.detail===1){
      const trigger=event.currentTarget;
      pendingOpen.current=setTimeout(()=>{pendingOpen.current=null;onOpen(trigger);},240);
     }
    }}
    onDoubleClick={event=>{
     event.preventDefault();if(pendingOpen.current)clearTimeout(pendingOpen.current);
     pendingOpen.current=null;beginRename();
    }}
    onKeyDown={event=>{
     if(event.key==="F2"){event.preventDefault();beginRename();return;}
     if(event.key===" "||event.key.toLowerCase()==="e"){
      event.preventDefault();onChange(setTaskProgress(data,record.id,complete?"not_started":"completed"));return;
     }
     if(event.key==="Delete"){event.preventDefault();setConfirmDelete(true);return;}
     focusArrow(event);
    }}
    className={"min-h-11 min-w-0 flex-1 text-left text-sm font-medium hover:text-[var(--planner-accent)] focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)] "+
     (complete?"text-[var(--planner-secondary)] line-through":"")}>{title}</button>}
   <button type="button" aria-label={"Delete "+title} title="Delete task or branch"
    disabled={readOnly} onClick={()=>setConfirmDelete(true)}
    className="grid h-8 w-8 shrink-0 place-items-center rounded text-[var(--planner-secondary)] opacity-80 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 hover:text-rose-600">
    <Trash2 size={14}/></button>
   <button type="button" aria-label={"Drag "+title} title="Drag task" disabled={readOnly}
    className="min-h-8 min-w-8 shrink-0 cursor-grab touch-none rounded text-[var(--planner-secondary)] opacity-60 hover:bg-[var(--planner-hover)] group-hover:opacity-100 focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)]"
    {...drag.attributes} {...drag.listeners}><GripVertical size={16} strokeWidth={1.75}/></button>
  </div>
  {record.parentId&&<div className="flex items-center gap-1 pl-9 text-[10px] text-[var(--planner-secondary)]"><CornerDownRight size={12}/>Sub-task</div>}
  <div className="mt-1.5 flex flex-wrap items-center gap-3 pl-1 text-xs text-[var(--planner-secondary)]">
   <CollectionBlockedBadge data={data} record={record}/>
   {!!descendants?.total&&<span data-testid="task-descendant-count" title="Completed sub-tasks / all descendants" className="inline-flex items-center gap-1 rounded bg-[var(--planner-hover)] px-1.5 py-0.5">
    <span>{descendants.done}/{descendants.total}</span><span className="inline-block h-1.5 w-8 rounded bg-[var(--planner-border)]">
     <span className="block h-full rounded bg-[var(--planner-accent)]" style={{width:Math.round(100*descendants.done/descendants.total)+"%"}}/></span>
   </span>}
   {indicators.priority&&<span data-testid="card-priority" title={"Priority "+record.priority}
     className="flex gap-1 text-red-600"><Flag size={15} strokeWidth={1.75}/>{formatPlannerPriority(record.priority??"")}</span>}
   {!!indicators.checklist&&<span data-testid="card-checklist" title="Checklist" className="flex gap-1"><ClipboardCheck size={15}/>{indicators.checklist}</span>}
   {!!indicators.attachments&&<span data-testid="card-attachments" title="Attachments" className="flex gap-1"><Paperclip size={15}/>{indicators.attachments}</span>}
   {indicators.notes&&<span data-testid="card-notes" title="Notes"><StickyNote size={15}/></span>}
   {!!indicators.comments&&<span data-testid="card-comments" title="Comments" className="flex gap-1"><MessageCircle size={15}/>{indicators.comments}</span>}
  </div>
  {(due||people.length>0)&&<div className="mt-2 flex items-center justify-between gap-2 text-xs">
   {due?<span data-testid="card-due" title={due} className={"inline-flex items-center gap-1 rounded px-1.5 py-1 "+
     (late?"bg-red-50 font-semibold text-red-700 dark:bg-red-950 dark:text-red-300":"text-[var(--planner-secondary)]")}>
      <CalendarDays size={14}/>{formatPlannerCardDate(due,localToday())}</span>:<span/>}
   {!!people.length&&<div data-testid="card-avatars" className="flex -space-x-1.5">
     {people.slice(0,4).map(person=><span key={person.id} title={person.name} aria-label={person.name}
       className="grid h-7 w-7 place-items-center rounded-full border-2 border-[var(--planner-surface)] bg-[#dcdafa] text-[10px] font-bold text-[#32317a]">
       {person.name.split(/\s+/).slice(0,2).map(x=>x[0]??"").join("").toUpperCase()}</span>)}
   </div>}
  </div>}
  <CollectionBoardSubtaskDrop data={data} record={record}/>
  {confirmDelete&&<CollectionModalDialog label={"Delete "+title+" task?"} onClose={()=>setConfirmDelete(false)} trigger={titleRef.current}>
    <h3 className="font-semibold">Delete “{title}”?</h3>
    <p className="mt-2 text-xs text-[var(--planner-secondary)]">{hasChildren?"Keep children or delete all descendants?":"You can undo this change."}</p>
    <div className="mt-4 flex justify-end gap-2">
     <button data-dialog-initial className="min-h-9 rounded px-3 hover:bg-[var(--planner-hover)]" onClick={()=>setConfirmDelete(false)}>Cancel</button>
     {hasChildren&&<button className="min-h-9 rounded border px-3" onClick={()=>{
      setConfirmDelete(false);onChange(deleteRecord(data,record.id,"promote"));}}>Promote children</button>}
     <button className="min-h-9 rounded bg-red-700 px-3 text-white" onClick={()=>{
      setConfirmDelete(false);onChange(deleteRecord(data,record.id,hasChildren?"subtree":"promote"));}}>
      {hasChildren?"Delete branch":"Delete"}</button>
    </div>
   </CollectionModalDialog>}
 </article>;
}
