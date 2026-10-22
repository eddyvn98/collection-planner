import { useRef,useState } from "react";
import { CollectionFloatingPanel } from "./CollectionFloatingPanel";
import type { CollectionBlockPayload,CollectionRecord } from "../collections/model";
import { updateTask } from "../collections/collectionTasks";
export function CollectionGridMultiSelect({data,record,kind,readOnly,save}:{
 data:()=>CollectionBlockPayload;record:CollectionRecord;kind:"assignee"|"label";
 readOnly:boolean;save:(next:CollectionBlockPayload)=>void;
}){
 const [open,setOpen]=useState(false),trigger=useRef<HTMLButtonElement>(null);
 const isPerson=kind==="assignee";
 const current=data(),ids=isPerson?record.assigneeIds??[]:record.labelIds??[];
 const options=isPerson?current.people??[]:current.labels??[];
 const caption=(isPerson?"Assignees":"Labels")+" for "+record.id;
 return <div className="min-w-0">
  <button ref={trigger} type="button" aria-label={caption}
   aria-expanded={open} onClick={()=>setOpen(!open)}
   className="min-h-9 w-full truncate rounded-md border border-[var(--planner-border)] bg-[var(--planner-surface)] p-1.5 text-left text-xs focus-visible:ring-2">
   {options.filter(p=>ids.includes(p.id)).map(p=>p.name).join(", ")||
    (isPerson?"Unassigned":"No labels")}
  </button>
  <CollectionFloatingPanel open={open} anchorRef={trigger} onClose={()=>setOpen(false)}
   role="dialog" label={caption} className="w-56 rounded-lg p-2">
   {!options.length&&<p className="text-xs text-[var(--planner-secondary)]">Add options in task details.</p>}
   {options.map(p=><label className="flex min-h-9 items-center gap-2 px-1 text-xs" key={p.id}>
    <input type="checkbox" disabled={readOnly} checked={ids.includes(p.id)}
     onChange={e=>{
      const next=e.target.checked?[...ids,p.id]:ids.filter(x=>x!==p.id);
      save(updateTask(data(),record.id,isPerson?{assigneeIds:next}:{labelIds:next},"Updated task"));
     }}/>{p.name}</label>)}
  </CollectionFloatingPanel>
 </div>;
}
