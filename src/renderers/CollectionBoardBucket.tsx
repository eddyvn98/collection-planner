import { useEffect, useId, useRef, useState } from "react";
import { useDndContext, useDroppable } from "@dnd-kit/core";
import { ChevronDown, ChevronLeft, ChevronRight, Ellipsis, GripVertical, ListTodo, Pencil, Plus, Trash2 } from "lucide-react";
import { createGroupedTask, splitBucketCompletion, type BoardGroup, type BoardGroupBy } from "./collectionBoardGroups";
import { deleteBucket, moveBucket, renameBucket } from "./collectionBoardActions";
import { CollectionModalDialog } from "./CollectionModalDialog";
import { CollectionFloatingPanel } from "./CollectionFloatingPanel";
import { CollectionTaskCard } from "./CollectionTaskCard";
import { CollectionQuickAddInput,parsedQuickTitle } from "./CollectionQuickAddInput";
import {applyQuickTokens} from "../collections/collectionInputParser";
import type { CollectionBlockPayload, CollectionField } from "../collections/model";
interface Props {data:CollectionBlockPayload;group:BoardGroup;mode:BoardGroupBy;field?:CollectionField;
 readOnly:boolean;showSubtasks:boolean;counts:Map<string,{done:number;total:number}>;
 onChange:(next:CollectionBlockPayload)=>void;onOpen:(id:string,trigger:HTMLButtonElement)=>void;
 onReorder:(source:string,target:string)=>void;}
export function CollectionBoardBucket({data,group,mode,field,readOnly,showSubtasks,counts,onChange,onOpen,onReorder}:Props){
 const bucketMenuRef=useRef<HTMLButtonElement>(null);
 const addTriggerRef=useRef<HTMLButtonElement>(null);
 const drop=useDroppable({id:"bucket:"+group.key,disabled:readOnly});
 const bucketPointer=useRef<{id:number;x:number;y:number}|null>(null);
 const [draggingBucket,setDraggingBucket]=useState(false);
 const startBucket=(event:React.PointerEvent<HTMLButtonElement>)=>{
  bucketPointer.current={id:event.pointerId,x:event.clientX,y:event.clientY};
  event.currentTarget.setPointerCapture(event.pointerId);
 };
 const finishBucket=(event:React.PointerEvent<HTMLButtonElement>)=>{
  const start=bucketPointer.current;bucketPointer.current=null;setDraggingBucket(false);
  if(!start||start.id!==event.pointerId||
   Math.hypot(event.clientX-start.x,event.clientY-start.y)<8)return;
  const target=document.elementFromPoint(event.clientX,event.clientY)
   ?.closest<HTMLElement>('[data-testid="collection-kanban-column"][data-status]')
   ?.dataset.status;
  if(target?.startsWith("bucket:")&&target!==group.key)
   onReorder(group.key.slice(7),target.slice(7));
 };
 const {active}=useDndContext();
 const [title,setTitle]=useState(""),[adding,setAdding]=useState(false);
 useEffect(()=>{const close=()=>setAdding(false);document.addEventListener("planner:escape",close);return()=>document.removeEventListener("planner:escape",close);},[]);
 const [renaming,setRenaming]=useState(false),[name,setName]=useState(group.title),[menu,setMenu]=useState(false);
 const [confirmDelete,setConfirmDelete]=useState(false);
 const [collapsed,setCollapsed]=useState(false),regionId=useId();
 const bucket=group.key.slice(7),editable=mode==="bucket"&&!!field&&!!bucket;
 const {active:pending,completed}=splitBucketCompletion(group.rows);
 const save=()=>{
  const parsed=parsedQuickTitle(data,title);
  const next=createGroupedTask(data,parsed.title,group.key,mode,field);
  if(next!==data){onChange(applyQuickTokens(next,parsed));setTitle("");}
 };
 const action=(operation:"rename"|"left"|"right"|"delete")=>{
   setMenu(false);if(!field)return;
   if(operation==="rename"){setName(bucket);setRenaming(true);}
   if(operation==="left")onChange(moveBucket(data,field.id,bucket,-1));
   if(operation==="right")onChange(moveBucket(data,field.id,bucket,1));
   if(operation==="delete")setConfirmDelete(true);
 };
 const card=(record:typeof group.rows[number])=><CollectionTaskCard key={record.id} data={data}
   record={record} groupKey={group.key} readOnly={readOnly} onChange={onChange}
   descendants={counts.get(record.id)}
   onOpen={trigger=>onOpen(record.id,trigger)}/>;
 return <section ref={drop.setNodeRef} data-testid="collection-kanban-column" data-status={group.key}
   className={"w-[calc(100vw-64px)] max-w-[340px] shrink-0 snap-start self-start rounded-md sm:w-72 bg-[var(--planner-canvas)] p-2 "+
    (drop.isOver?"ring-2 ring-[var(--planner-accent)]":"")}>
  <header className="mb-1 flex min-h-11 items-center gap-1">
   {!readOnly&&editable&&<button type="button"
    aria-label={"Drag bucket "+group.title} title="Drag to reorder buckets; Arrow keys to move"
    onPointerDown={startBucket}
    onPointerMove={event=>{if(bucketPointer.current?.id===event.pointerId&&
     Math.hypot(event.clientX-bucketPointer.current.x,event.clientY-bucketPointer.current.y)>=8)
      setDraggingBucket(true);}}
    onPointerUp={finishBucket}
    onPointerCancel={()=>{bucketPointer.current=null;setDraggingBucket(false);}}
    onKeyDown={event=>{if(event.key==="ArrowLeft"||event.key==="ArrowRight"){
     event.preventDefault();const op=event.key==="ArrowLeft"?"left":"right";
     action(op);
    }}}
    aria-pressed={draggingBucket}
    className={"nodrag grid h-11 w-11 shrink-0 cursor-grab touch-none place-items-center rounded hover:bg-[var(--planner-hover)] focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)] "+
     (draggingBucket?"bg-[var(--planner-hover)] ring-2 ring-[var(--planner-accent)]":"")}>
    <GripVertical size={17}/></button>}
   {renaming&&editable?<input autoFocus aria-label="Bucket name" value={name}
      className="min-w-0 flex-1 rounded border border-[var(--planner-accent)] bg-[var(--planner-surface)] px-2 py-1 text-sm"
      onChange={e=>setName(e.target.value)}
      onKeyDown={e=>{if(e.key==="Escape"){setName(bucket);setRenaming(false);}
        if(e.key==="Enter")e.currentTarget.blur();}}
      onBlur={()=>{if(name.trim()!==bucket&&field)onChange(renameBucket(data,field.id,bucket,name));setRenaming(false);}}/>
    : <h3 tabIndex={editable&&!readOnly?0:undefined} title="Double-click or F2 to rename bucket"
      onDoubleClick={()=>{if(editable&&!readOnly){setName(bucket);setRenaming(true);}}}
      onKeyDown={event=>{if(event.key==="F2"&&editable&&!readOnly){
       event.preventDefault();setName(bucket);setRenaming(true);
      }}}
      className="min-w-0 flex-1 truncate rounded px-1 text-sm font-semibold text-[var(--planner-text)] focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)]">{group.title}</h3>}
   <span aria-label={group.rows.length+" tasks"} className="rounded-full bg-[var(--planner-surface)] px-2 py-0.5 text-xs text-[var(--planner-secondary)]">{group.rows.length}</span>
   <button type="button" aria-label={(collapsed?"Expand ":"Collapse ")+group.title+" bucket"}
    aria-expanded={!collapsed} aria-controls={regionId} onClick={()=>setCollapsed(!collapsed)}
    className="grid min-h-8 min-w-8 place-items-center rounded text-[var(--planner-secondary)] hover:bg-[var(--planner-hover)] focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)]">
    <ChevronDown size={16} strokeWidth={1.75} className={"transition-transform duration-planner-settle "+(collapsed?"-rotate-90":"")}/>
   </button>
   {!readOnly&&editable&&<div className="relative">
     <button ref={bucketMenuRef} type="button" title={"Bucket actions "+bucket} aria-label={"Bucket actions "+bucket}
       aria-expanded={menu} className="flex min-h-8 min-w-8 items-center justify-center rounded hover:bg-[var(--planner-hover)] focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)]"
       onClick={()=>setMenu(!menu)}><Ellipsis size={16} strokeWidth={1.75}/></button>
     <CollectionFloatingPanel open={menu} anchorRef={bucketMenuRef} onClose={()=>setMenu(false)}
       role="menu" label={"Actions for "+bucket} className="w-44 rounded p-1">
       {([["rename",Pencil,"Rename"],["left",ChevronLeft,"Move left"],
         ["right",ChevronRight,"Move right"],["delete",Trash2,"Delete"]] as const).map(([kind,Icon,label])=>
         <button key={kind} role="menuitem" className={"flex min-h-9 w-full items-center gap-2 rounded px-2 text-left text-sm hover:bg-[var(--planner-hover)] "+
             (kind==="delete"?"text-red-600":"")} onClick={()=>action(kind)}>
           <Icon size={16} strokeWidth={1.75}/>{label}</button>)}
     </CollectionFloatingPanel>
   </div>}
  </header>
  <div className={"grid transition-[grid-template-rows,opacity] duration-planner-settle "+
    (collapsed?"grid-rows-[0fr] opacity-0":"grid-rows-[1fr] opacity-100")}
    aria-hidden={collapsed}>
   <div id={regionId} className="min-h-0 overflow-hidden">
  {!readOnly&&(adding?<form className="mb-2 space-y-1" onSubmit={e=>{e.preventDefault();save();}}>
    <CollectionQuickAddInput data={data} autoFocus label={"New task in "+group.title}
     value={title} onChange={setTitle} disabled={readOnly} placeholder="Task name · mai @người #nhãn !urgent"
     onEscape={()=>{setAdding(false);requestAnimationFrame(()=>addTriggerRef.current?.focus());}}
     className="min-h-11 w-full rounded border border-[var(--planner-border)] bg-[var(--planner-surface)] p-2 text-sm"/>
    <div className="flex gap-2">
      <button type="submit" disabled={!title.trim()} className="min-h-8 rounded bg-[var(--planner-accent)] px-3 text-xs text-white disabled:opacity-50">Add task</button>
      <button type="button" className="min-h-8 rounded px-2 text-xs hover:bg-[var(--planner-hover)]" onClick={()=>setAdding(false)}>Cancel</button>
    </div></form>:
    <button ref={addTriggerRef} type="button" data-planner-add-task onClick={()=>setAdding(true)}
      className="mb-2 inline-flex min-h-9 w-full items-center gap-2 rounded px-2 text-left text-sm text-[var(--planner-secondary)] hover:bg-[var(--planner-hover)] hover:text-[var(--planner-accent)] focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)]">
      <Plus size={16} strokeWidth={1.75}/>Add task</button>)}
  <div aria-label={group.title+" tasks"} className="min-h-4" data-show-subtasks={showSubtasks}>
    {pending.map(card)}
    {!pending.length&&active&&<div aria-label="Drop task here" className="mb-2 h-12 rounded border-2 border-dashed border-[var(--planner-accent)]"/>}
    {!group.rows.length&&!active&&<div className="rounded-md px-3 py-5 text-center text-xs text-[var(--planner-secondary)]">
      <ListTodo size={20} className="mx-auto mb-2"/>{!readOnly?"Add your first task":"No tasks yet"}</div>}
  </div>
  {!!completed.length&&<details className="mt-3 border-t border-[var(--planner-border)] pt-2" data-testid="planner-completed-section">
    <summary className="flex min-h-9 cursor-pointer items-center gap-2 text-xs text-[var(--planner-secondary)] hover:text-[var(--planner-accent)]">
     <ChevronDown size={16} strokeWidth={1.75}/>Completed ({completed.length})</summary>
    <div className="mt-2">{completed.map(card)}</div>
  </details>}
   </div>
  </div>
  {confirmDelete&&<CollectionModalDialog label={"Delete "+bucket+" bucket?"}
     trigger={bucketMenuRef.current} onClose={()=>setConfirmDelete(false)}>
    <h2 className="text-base font-semibold">Delete “{bucket}” bucket?</h2>
    <p className="my-3 text-sm text-[var(--planner-secondary)]">Tasks move to the first remaining bucket.</p>
    <div className="flex justify-end gap-2">
     <button data-dialog-initial className="min-h-9 rounded px-3 hover:bg-[var(--planner-hover)]" onClick={()=>setConfirmDelete(false)}>Cancel</button>
     <button className="min-h-9 rounded bg-red-700 px-3 text-white" onClick={()=>{
      if(field)onChange(deleteBucket(data,field.id,bucket));setConfirmDelete(false);
     }}>Delete bucket</button>
    </div>
   </CollectionModalDialog>}
 </section>;
}
