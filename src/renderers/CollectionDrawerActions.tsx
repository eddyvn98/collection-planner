import { useState } from "react";
import { Copy, Ellipsis, Layers3, Trash2 } from "lucide-react";
import { copyTask, moveTaskToBucket } from "../collections/collectionRecurrence";
import { plannerBucket } from "../collections/collectionPlannerFields";
import { type CollectionBlockPayload, type CollectionRecord } from "../collections/model";
export function CollectionDrawerActions({data,record,readOnly,onChange,onDelete}:{
 data:CollectionBlockPayload;record:CollectionRecord;readOnly:boolean;
 onChange:(next:CollectionBlockPayload)=>void;onDelete:()=>void;
}){
 const [open,setOpen]=useState(false),[moving,setMoving]=useState(false);
 const bucket=plannerBucket(data);
 const duplicate=()=>{onChange(copyTask(data,record.id));setOpen(false);};
 return <div className="relative flex items-center gap-1">
   <button type="button" aria-label="Task actions" title="Copy, duplicate or move task"
    className="grid h-9 w-9 place-items-center rounded hover:bg-[var(--planner-hover)] focus-visible:ring-2"
    onClick={()=>setOpen(!open)}><Ellipsis size={18} strokeWidth={1.75}/></button>
   <button type="button" aria-label="Delete task" title="Delete task" disabled={readOnly}
    className="grid h-9 w-9 place-items-center rounded text-red-600 hover:bg-[var(--planner-hover)] focus-visible:ring-2 disabled:opacity-50"
    onClick={()=>{if(window.confirm("Delete this task?"))onDelete();}}><Trash2 size={16}/></button>
   {open&&<div role="menu" aria-label="Task actions menu"
    className="absolute right-0 top-full z-50 mt-1 w-52 rounded border border-[var(--planner-border)] bg-[var(--planner-surface)] p-1 shadow-lg">
    <button role="menuitem" disabled={readOnly} onClick={duplicate}
     className="flex min-h-9 w-full items-center gap-2 rounded px-3 text-sm hover:bg-[var(--planner-hover)]">
     <Copy size={16}/> Copy task</button>
    <button role="menuitem" disabled={readOnly} onClick={duplicate}
     className="flex min-h-9 w-full items-center gap-2 rounded px-3 text-sm hover:bg-[var(--planner-hover)]">
     <Copy size={16}/> Duplicate</button>
    {bucket&&<button role="menuitem" disabled={readOnly} onClick={()=>setMoving(!moving)}
      className="flex min-h-9 w-full items-center gap-2 rounded px-3 text-sm hover:bg-[var(--planner-hover)]">
      <Layers3 size={16}/> Move task</button>}
    {moving&&bucket&&<select aria-label="Move task to bucket" value={record.values[bucket.id]??""}
      className="w-full rounded border border-[var(--planner-border)] bg-[var(--planner-surface)] p-2 text-sm"
      onChange={e=>{onChange(moveTaskToBucket(data,record.id,e.target.value));setOpen(false);setMoving(false);}}>
     <option value="">Unassigned</option>{(bucket.options??[]).map(name=><option key={name} value={name}>{name}</option>)}
    </select>}
   </div>}
  </div>;
}
