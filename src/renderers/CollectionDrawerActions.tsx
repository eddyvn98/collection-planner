import { useRef, useState } from "react";
import { CollectionFloatingPanel } from "./CollectionFloatingPanel";
import { CollectionModalDialog } from "./CollectionModalDialog";
import { Copy, Ellipsis, Layers3, Trash2 } from "lucide-react";
import { buildTaskTree } from "../collections/collectionTaskTree";
import { copyTask, moveTaskToBucket } from "../collections/collectionRecurrence";
import { plannerBucket } from "../collections/collectionPlannerFields";
import { type CollectionBlockPayload, type CollectionRecord } from "../collections/model";
export function CollectionDrawerActions({data,record,readOnly,onChange,onDelete}:{
 data:CollectionBlockPayload;record:CollectionRecord;readOnly:boolean;
 onChange:(next:CollectionBlockPayload)=>void;onDelete:(mode?:"subtree"|"promote")=>void;
}){
 const [open,setOpen]=useState(false),[moving,setMoving]=useState(false);
 const [confirmDelete,setConfirmDelete]=useState(false),deleteTrigger=useRef<HTMLButtonElement>(null);
 const trigger=useRef<HTMLButtonElement>(null);
 const bucket=plannerBucket(data);
 const hasChildren=(buildTaskTree(data.records).children.get(record.id)?.length??0)>0;
 const duplicate=()=>{onChange(copyTask(data,record.id));setOpen(false);};
 return <div className="relative flex items-center gap-1">
   <button ref={trigger} type="button" aria-label="Task actions" title="Copy, duplicate or move task"
    className="grid h-9 w-9 place-items-center rounded hover:bg-[var(--planner-hover)] focus-visible:ring-2"
    onClick={()=>setOpen(!open)}><Ellipsis size={18} strokeWidth={1.75}/></button>
   <button ref={deleteTrigger} type="button" aria-label="Delete task" title="Delete task" disabled={readOnly}
    className="grid h-9 w-9 place-items-center rounded text-red-600 hover:bg-[var(--planner-hover)] focus-visible:ring-2 disabled:opacity-50"
    onClick={()=>setConfirmDelete(true)}><Trash2 size={16}/></button>
   <CollectionFloatingPanel open={open} anchorRef={trigger} onClose={()=>{setOpen(false);setMoving(false);}}
     role="menu" label="Task actions menu" className="w-52 rounded p-1">
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
   </CollectionFloatingPanel>
   {confirmDelete&&<CollectionModalDialog label="Delete task?" trigger={deleteTrigger.current}
     onClose={()=>setConfirmDelete(false)}>
     <h2 className="font-semibold">Delete this task?</h2>
     <p className="mt-2 text-sm text-[var(--planner-secondary)]">{hasChildren?"Choose whether to keep its sub-tasks.":"This removes the task from the plan."}</p>
     <div className="mt-4 flex justify-end gap-2">
      <button data-dialog-initial type="button" className="min-h-9 rounded px-3 hover:bg-[var(--planner-hover)]"
        onClick={()=>setConfirmDelete(false)}>Cancel</button>
      {hasChildren&&<button type="button" className="min-h-9 rounded border border-[var(--planner-border)] px-3 text-xs"
        onClick={()=>{setConfirmDelete(false);onDelete("promote");}}>Keep sub-tasks (promote)</button>}
      <button type="button" className="min-h-9 rounded bg-red-700 px-3 text-xs text-white"
        onClick={()=>{setConfirmDelete(false);onDelete(hasChildren?"subtree":"promote");}}>
         {hasChildren?"Delete entire branch":"Delete task"}</button>
     </div>
   </CollectionModalDialog>}
  </div>;
}
