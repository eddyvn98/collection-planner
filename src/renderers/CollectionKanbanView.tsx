"use client";
import { Plus } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, pointerWithin, rectIntersection,
 useSensor, useSensors, type CollisionDetection, type DragEndEvent } from "@dnd-kit/core";
import { descendantCounts, MAX_VISIBLE_TREE_NODES } from "../collections/collectionTaskTree";
import { moveTaskTree } from "../collections/collectionTreeActions";
import { addBucket } from "./collectionBoardActions";
import { boardGroups, moveGroupedTask, parseCardDragId } from "./collectionBoardGroups";
import { CollectionBoardBucket } from "./CollectionBoardBucket";
import { CollectionRecordDetails } from "./CollectionRecordDetails";
import { type CollectionBlockPayload, type CollectionField, type CollectionRecord,
 type CollectionView } from "../collections/model";
interface Props {
 data: CollectionBlockPayload; view: CollectionView; rows: CollectionRecord[]; group?: CollectionField;
 groupOptions: string[]; readOnly: boolean; onChange: (next: CollectionBlockPayload) => void;
 patch: (record: CollectionRecord, field: CollectionField, value: string) => void;
}
export function CollectionKanbanView({data,view,rows,group,readOnly,onChange}:Props){
 const [openId,setOpenId]=useState<string|null>(null);
 const opener=useRef<HTMLButtonElement|null>(null);
 const [newBucket,setNewBucket]=useState(""),[creating,setCreating]=useState(false);
 const [showSubtasks,setShowSubtasks]=useState(false);
 const [dragWarning,setDragWarning]=useState("");
 const mode=view.boardGroupBy??"bucket";
 const counts=useMemo(()=>descendantCounts(data.records),[data.records]);
 const boardRows=showSubtasks?rows:rows.filter(row=>!row.parentId);
 const visibleRows=boardRows.length>MAX_VISIBLE_TREE_NODES?boardRows.slice(0,MAX_VISIBLE_TREE_NODES):boardRows;
 const groups=boardGroups(data,visibleRows,mode,group);
 const sensors=useSensors(
  useSensor(PointerSensor,{activationConstraint:{distance:6}}),
  useSensor(TouchSensor,{activationConstraint:{delay:600,tolerance:6}}),
  useSensor(KeyboardSensor));
 const collisionDetection:CollisionDetection=args=>{
  const nested=pointerWithin(args).filter(hit=>String(hit.id).startsWith("subtask:"));
  return nested.length?nested:rectIntersection(args);
 };
 const onDragEnd=({active,over}:DragEndEvent)=>{
  if(readOnly||!over)return;
  const moving=parseCardDragId(String(active.id));
  if(!moving)return;
  const target=String(over.id);
  if(target.startsWith("subtask:")){
   const parent=target.slice(8);
   const next=moveTaskTree(data,moving[0],parent,"child");
   if(next!==data){setDragWarning("");onChange(next);}else setDragWarning("Cannot move: cycle or maximum 6 levels.");
   return;
  }
  if(target.startsWith("bucket:") && data.records.some(row=>row.id===moving[0]&&row.parentId)){
   const key=target.slice(7);
   const next=moveTaskTree(data,moving[0],null,"after",key.startsWith("bucket:")?key.slice(7):key);
   if(next!==data)onChange(next);
   return;
  }
  const card=parseCardDragId(target);
  const to=card?.[1]??(target.startsWith("bucket:")?target.slice(7):null);
  if(to===null)return;
  const next=mode==="bucket"&&card
   ? moveTaskTree(data,moving[0],card[0],"before",to.slice(7))
   :moveGroupedTask(data,moving[0],moving[1],to,mode,group,card?.[0],readOnly);
  if(next!==data)onChange(next);
 };
 return <div className="flex min-h-0 flex-1 flex-col">
  <div className="flex items-center gap-3 px-2 py-1 text-xs">
   <label className="flex min-h-9 items-center gap-2"><input type="checkbox" aria-label="Show sub-tasks"
     checked={showSubtasks} onChange={event=>setShowSubtasks(event.target.checked)}/>Show sub-tasks</label>
   {dragWarning&&<span role="alert" className="text-amber-600">{dragWarning}</span>}
  </div>
  {rows.length>MAX_VISIBLE_TREE_NODES&&<p role="status" className="p-2 text-xs text-[var(--planner-secondary)]">
    Showing first {MAX_VISIBLE_TREE_NODES} of {rows.length} tasks. Use search or filters to narrow the plan.
  </p>}
  <DndContext sensors={sensors} collisionDetection={collisionDetection} onDragEnd={onDragEnd}>
   <div className="flex min-h-0 flex-1 items-start gap-2 overflow-x-auto overscroll-x-contain pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-3 sm:snap-none" data-testid="collection-kanban">
    {groups.map(item=><CollectionBoardBucket key={item.key} data={data} group={item} mode={mode} field={group} counts={counts}
     readOnly={readOnly} onChange={onChange} showSubtasks={showSubtasks} onOpen={(id, trigger) => { opener.current = trigger; setOpenId(id); }}/>)}
    {mode==="bucket"&&!!group&&!readOnly&&(creating?
     <form className="w-64 shrink-0 space-y-2 rounded-xl bg-[var(--planner-hover)] p-3"
      onSubmit={e=>{e.preventDefault();const next=addBucket(data,group.id,newBucket);
       if(next!==data){onChange(next);setNewBucket("");setCreating(false);}}}>
      <input autoFocus aria-label="New bucket" value={newBucket} onChange={e=>setNewBucket(e.target.value)}
       className="w-full rounded border p-2 text-sm" placeholder="Bucket name" maxLength={80}/>
      <button type="submit" className="rounded bg-blue-600 px-3 py-1 text-sm text-white" disabled={!newBucket.trim()}>Add</button>
      <button type="button" className="ml-2 text-sm" onClick={()=>setCreating(false)}>Cancel</button>
     </form>:<button type="button" className="w-56 shrink-0 rounded-xl border border-dashed p-3 text-left text-sm text-blue-600"
      onClick={()=>setCreating(true)}><Plus size={16} strokeWidth={1.75} className="inline-block"/> Add new bucket</button>)}
   </div>
  </DndContext>
  {openId&&<CollectionRecordDetails data={data} recordId={openId} returnFocusTo={opener.current} group={group}
   readOnly={readOnly} onChange={onChange} onClose={()=>setOpenId(null)}/>}
 </div>;
}
