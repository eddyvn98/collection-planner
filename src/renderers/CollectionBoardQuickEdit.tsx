import {useRef,useState,type ReactNode} from "react";
import {CollectionFloatingPanel} from "./CollectionFloatingPanel";
import {PRIORITIES,setTaskDate,taskDate,updateTask} from "../collections/collectionTasks";
import type {CollectionBlockPayload,CollectionRecord} from "../collections/model";
type Kind="due"|"priority"|"labels"|"assignees";
interface Props{kind:Kind;data:CollectionBlockPayload;record:CollectionRecord;
 readOnly:boolean;onChange:(next:CollectionBlockPayload)=>void;children:ReactNode;
 testId?:string;title:string;}
const kindName:Record<Kind,string>={due:"due date",priority:"priority",labels:"labels",assignees:"assignees"};
export function CollectionBoardQuickEdit({kind,data,record,readOnly,onChange,children,testId,title}:Props){
 const [open,setOpen]=useState(false),anchor=useRef<HTMLButtonElement>(null);
 const update=(ids:string[],field:"labelIds"|"assigneeIds")=>{
  const next=updateTask(data,record.id,{[field]:ids},"Updated task "+field);
  if(next!==data)onChange(next);
 };
 const toggle=(field:"labelIds"|"assigneeIds",id:string)=>{
  const current=record[field]??[];
  update(current.includes(id)?current.filter(value=>value!==id):[...current,id],field);
 };
 const label="Edit "+kindName[kind]+" for "+title;
 const items=kind==="labels"?(data.labels??[]):(data.people??[]);
 return <div className="inline-flex min-w-0 max-w-full">
  <button ref={anchor} type="button" data-testid={testId} aria-label={label}
   title={label} aria-haspopup="dialog" aria-expanded={open} disabled={readOnly}
   onClick={event=>{event.stopPropagation();setOpen(value=>!value);}}
   className="nodrag nopan inline-flex min-h-11 min-w-11 max-w-full items-center justify-center gap-1.5 rounded px-2 text-left text-xs text-[var(--planner-secondary)] hover:bg-[var(--planner-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)] disabled:cursor-default">
   {children}
  </button>
  <CollectionFloatingPanel open={open} anchorRef={anchor} onClose={()=>setOpen(false)}
   role="dialog" label={label} align="start" className="w-64 max-w-[calc(100vw-16px)] rounded-lg p-3">
   <h4 className="mb-2 text-sm font-semibold">{label}</h4>
   {kind==="due"&&<label className="block text-xs">Due date
    <input autoFocus type="date" aria-label={"Due date for "+title}
     value={taskDate(data,record,"due")} disabled={readOnly}
     onChange={event=>{const next=setTaskDate(data,record.id,"due",event.target.value);
      if(next!==data)onChange(next);}}
     className="mt-1 min-h-11 w-full rounded border border-[var(--planner-border)] bg-[var(--planner-surface)] px-2 text-sm"/>
    <button type="button" disabled={readOnly} className="mt-2 min-h-11 w-full rounded text-left text-xs underline"
     onClick={()=>{const next=setTaskDate(data,record.id,"due","");
      if(next!==data)onChange(next);setOpen(false);}}>Clear due date</button>
   </label>}
   {kind==="priority"&&<div className="grid gap-1">
    {PRIORITIES.map(item=><button type="button" key={item.value}
     aria-pressed={(record.priority??"medium")===item.value}
     className="min-h-11 rounded px-3 text-left text-sm hover:bg-[var(--planner-hover)] aria-pressed:bg-[var(--planner-hover)]"
     onClick={()=>{const next=updateTask(data,record.id,{priority:item.value},"Changed priority");
      if(next!==data)onChange(next);setOpen(false);}}>{item.label}</button>)}
   </div>}
   {(kind==="labels"||kind==="assignees")&&<div className="max-h-60 overflow-y-auto">
    {items.length?items.map(item=><label key={item.id} className="flex min-h-11 items-center gap-2 text-sm">
     <input type="checkbox" checked={(record[kind==="labels"?"labelIds":"assigneeIds"]??[]).includes(item.id)}
      disabled={readOnly} onChange={()=>toggle(kind==="labels"?"labelIds":"assigneeIds",item.id)}/>
     {item.name}
    </label>):<p className="text-xs text-[var(--planner-secondary)]">
     No {kind==="labels"?"labels":"people"} configured.</p>}
   </div>}
   <button type="button" className="mt-2 min-h-11 w-full rounded border border-[var(--planner-border)] text-sm"
    onClick={()=>{setOpen(false);anchor.current?.focus();}}>Done</button>
  </CollectionFloatingPanel>
 </div>;
}
