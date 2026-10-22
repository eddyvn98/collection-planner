import { useRef,useState } from "react";
import { CollectionFloatingPanel } from "./CollectionFloatingPanel";
import { newId, recordTitle } from "../collections/model";
import type { CollectionBlockPayload,CollectionRecord } from "../collections/model";
import { updateTask } from "../collections/collectionTasks";
export function CollectionGridMultiSelect({data,record,kind,readOnly,save}:{
 data:()=>CollectionBlockPayload;record:CollectionRecord;kind:"assignee"|"label";
 readOnly:boolean;save:(next:CollectionBlockPayload)=>void;
}){
 const [open,setOpen]=useState(false),[newPerson,setNewPerson]=useState("");
 const trigger=useRef<HTMLButtonElement>(null);
 const isPerson=kind==="assignee";
 const current=data(),ids=isPerson?record.assigneeIds??[]:record.labelIds??[];
 const options=isPerson?current.people??[]:current.labels??[];
 const caption=(isPerson?"Assignees":"Labels")+" for "+recordTitle(current,record);
 return <div className="min-w-0">
  <button ref={trigger} type="button" aria-label={caption}
   aria-expanded={open} onClick={()=>setOpen(!open)}
   className="min-h-9 w-full truncate rounded-md border-2 border-transparent bg-transparent px-1.5 text-left text-xs hover:bg-[var(--planner-hover)] focus-visible:border-[var(--planner-accent)]">
   {isPerson?<span className="flex -space-x-1">{options.filter(p=>ids.includes(p.id)).map(p=><span key={p.id} title={p.name} className="grid h-6 w-6 place-items-center rounded-full border border-[var(--planner-surface)] bg-[var(--planner-accent)] text-[10px] font-semibold text-white">{p.name.slice(0,2).toUpperCase()}</span>)}</span>:
    <span className="flex gap-1">{options.filter(p=>ids.includes(p.id)).map(p=><span key={p.id} className="max-w-24 truncate rounded px-1.5 py-0.5 text-white" style={{backgroundColor:/^#[0-9a-f]{6}$/i.test("color" in p?String(p.color):"")?String("color" in p?p.color:""):"#5B5FC7"}}>{p.name}</span>)}</span>}
  </button>
  <CollectionFloatingPanel open={open} anchorRef={trigger} onClose={()=>{setOpen(false);requestAnimationFrame(()=>{if(trigger.current&&document.activeElement===document.body)trigger.current.focus();});}}
   role="dialog" label={caption} className="w-56 rounded-lg p-2">
   {!options.length&&!isPerson&&<p className="text-xs text-[var(--planner-secondary)]">Add labels in task details.</p>}
   {options.map(p=><label className="flex min-h-9 items-center gap-2 px-1 text-xs" key={p.id}>
    <input type="checkbox" disabled={readOnly} checked={ids.includes(p.id)}
     onChange={e=>{
      const next=e.target.checked?[...ids,p.id]:ids.filter(x=>x!==p.id);
      save(updateTask(data(),record.id,isPerson?{assigneeIds:next}:{labelIds:next},"Updated task"));
     }}/>{p.name}</label>)}
   {isPerson&&!readOnly&&<form className="mt-2 flex gap-1 border-t border-[var(--planner-border)] pt-2" onSubmit={e=>{e.preventDefault();const name=newPerson.trim();if(!name)return;
    const id=newId(),current=data();save({...updateTask(current,record.id,{assigneeIds:[...(record.assigneeIds??[]),id]},"Assigned person"),people:[...(current.people??[]),{id,name}]});setNewPerson("");}}>
    <input aria-label="New person name" value={newPerson} onChange={e=>setNewPerson(e.target.value)} placeholder="Person name" className="min-w-0 flex-1 rounded border border-[var(--planner-border)] bg-transparent px-2 text-xs"/>
    <button type="submit" className="rounded bg-[var(--planner-accent)] px-2 text-xs text-white">Add a person</button>
   </form>}
  </CollectionFloatingPanel>
 </div>;
}
