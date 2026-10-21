"use client";
import { Plus } from "lucide-react";
import { useRef, useState } from "react";
import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors,
 type DragEndEvent } from "@dnd-kit/core";
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
 const mode=view.boardGroupBy??"bucket";
 const groups=boardGroups(data,rows,mode,group);
 const sensors=useSensors(
  useSensor(PointerSensor,{activationConstraint:{distance:6}}),
  useSensor(TouchSensor,{activationConstraint:{delay:200,tolerance:6}}),
  useSensor(KeyboardSensor));
 const onDragEnd=({active,over}:DragEndEvent)=>{
  if(readOnly||!over)return;
  const moving=parseCardDragId(String(active.id));
  if(!moving)return;
  const target=String(over.id);
  const card=parseCardDragId(target);
  const to=card?.[1]??(target.startsWith("bucket:")?target.slice(7):null);
  if(to===null)return;
  const next=moveGroupedTask(data,moving[0],moving[1],to,mode,group,card?.[0],readOnly);
  if(next!==data)onChange(next);
 };
 return <div className="flex min-h-0 flex-1 flex-col">
  <DndContext sensors={sensors} onDragEnd={onDragEnd}>
   <div className="flex min-h-0 flex-1 items-start gap-2 overflow-x-auto overscroll-x-contain pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-3 sm:snap-none" data-testid="collection-kanban">
    {groups.map(item=><CollectionBoardBucket key={item.key} data={data} group={item} mode={mode} field={group}
     readOnly={readOnly} onChange={onChange} onOpen={(id, trigger) => { opener.current = trigger; setOpenId(id); }}/>)}
    {mode==="bucket"&&!!group&&!readOnly&&(creating?
     <form className="w-64 shrink-0 space-y-2 rounded-xl bg-slate-100 p-3"
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
