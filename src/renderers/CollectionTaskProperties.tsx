import { useState } from "react";
import { newId, type CollectionBlockPayload, type CollectionRecord, type TaskPriority, type TaskProgress } from "../collections/model";
import { PROGRESS, PRIORITIES, updateTask, setTaskDate, taskDate, addTaskComment } from "../collections/collectionTasks";
import { setCollectionDependencies } from "../collections/collectionDependencies";
import { CollectionChecklist } from "./CollectionChecklist";
import { setTaskProgress } from "./collectionBoardGroups";
import { inputClass } from "./CollectionFieldEditor";
export function CollectionTaskProperties({ data, record, readOnly, onChange }: {
 data: CollectionBlockPayload; record: CollectionRecord; readOnly: boolean;
 onChange: (next: CollectionBlockPayload) => void;
}) {
 const [person,setPerson]=useState(""),[label,setLabel]=useState(""),[comment,setComment]=useState(""),[url,setUrl]=useState("");
 const patch=(changes:Partial<CollectionRecord>)=>onChange(updateTask(data,record.id,changes,"Updated task"));
 const makePerson=()=>{const name=person.trim();if(!name)return;
  const found=data.people?.find(p=>p.name.toLowerCase()===name.toLowerCase());
  const entry=found??{id:newId(),name};const next={...data,people:found?data.people:[...(data.people??[]),entry]};
  onChange(updateTask(next,record.id,{assigneeIds:[...new Set([...(record.assigneeIds??[]),entry.id])]}));setPerson("");
 };
 const makeLabel=()=>{const name=label.trim();if(!name||(data.labels??[]).length>=25)return;
  const found=data.labels?.find(l=>l.name.toLowerCase()===name.toLowerCase());
  const entry=found??{id:newId(),name,color:"#2563eb"};const next={...data,labels:found?data.labels:[...(data.labels??[]),entry]};
  onChange(updateTask(next,record.id,{labelIds:[...new Set([...(record.labelIds??[]),entry.id])].slice(0,25)}));setLabel("");
 };
 return <div className="space-y-5">
  <div className="grid grid-cols-2 gap-3">
   <label className="text-xs">Progress<select className={inputClass+" w-full"} disabled={readOnly} value={record.progress??"not_started"}
    onChange={e=>onChange(setTaskProgress(data,record.id,e.target.value as TaskProgress))}>{PROGRESS.map(p=><option key={p.value} value={p.value}>{p.label}</option>)}</select></label>
   <label className="text-xs">Priority<select className={inputClass+" w-full"} disabled={readOnly} value={record.priority??"medium"}
    onChange={e=>patch({priority:e.target.value as TaskPriority})}>{PRIORITIES.map(p=><option key={p.value} value={p.value}>{p.label}</option>)}</select></label>
   {(["start","due"] as const).map(kind=><label key={kind} className="text-xs">{kind==="start"?"Start":"Due"} date
    <input className={inputClass+" w-full"} type="date" disabled={readOnly} value={taskDate(data,record,kind)}
     onChange={e=>onChange(setTaskDate(data,record.id,kind,e.target.value))} /></label>)}
  </div>
  <fieldset className="space-y-2"><legend className="text-sm font-semibold">Assignees</legend>
   {(data.people??[]).map(p=><label key={p.id} className="mr-3 inline-flex gap-1 text-xs">
    <input type="checkbox" disabled={readOnly} checked={!!record.assigneeIds?.includes(p.id)}
     onChange={e=>patch({assigneeIds:e.target.checked?[...(record.assigneeIds??[]),p.id]:(record.assigneeIds??[]).filter(id=>id!==p.id)})} />{p.name}</label>)}
   {!readOnly&&<form className="flex gap-2" onSubmit={e=>{e.preventDefault();makePerson();}}>
    <input aria-label="New assignee" className={inputClass+" min-w-0 flex-1"} value={person} onChange={e=>setPerson(e.target.value)} placeholder="New person" maxLength={80} />
    <button type="submit" className="text-blue-600">Add</button></form>}
  </fieldset>
  <fieldset className="space-y-2"><legend className="text-sm font-semibold">Labels</legend>
   {(data.labels??[]).map(l=><label key={l.id} className="mr-3 inline-flex gap-1 text-xs">
    <input type="checkbox" disabled={readOnly} checked={!!record.labelIds?.includes(l.id)}
     onChange={e=>patch({labelIds:e.target.checked?[...(record.labelIds??[]),l.id]:(record.labelIds??[]).filter(id=>id!==l.id)})}/>
    <input aria-label={"Color for "+l.name} title={"Color for "+l.name} type="color"
     className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0" disabled={readOnly}
     value={/^#[0-9a-fA-F]{6}$/.test(l.color)?l.color:"#2563eb"}
     onChange={e=>onChange({...data,labels:(data.labels??[]).map(item=>item.id===l.id?{...item,color:e.target.value}:item)})}/>
    {l.name}</label>)}
   {!readOnly&&(data.labels??[]).length<25&&<form className="flex gap-2" onSubmit={e=>{e.preventDefault();makeLabel();}}>
    <input aria-label="New label" className={inputClass+" min-w-0 flex-1"} value={label} onChange={e=>setLabel(e.target.value)} placeholder="New label (max 25)" maxLength={80}/>
    <button type="submit" className="text-blue-600">Add</button></form>}
  </fieldset>
  <CollectionChecklist items={record.checklist} readOnly={readOnly} onChange={checklist=>patch({checklist})}/>
  <section id="task-attachments" className="scroll-mt-4 space-y-2"><h3 className="text-sm font-semibold">Attachments</h3>
   {(record.attachments??[]).map(a=><p key={a.id} className="flex justify-between gap-2 text-xs">
    <a href={a.url} target="_blank" rel="noopener noreferrer" className="truncate text-blue-600 underline">{a.name}</a>
    {!readOnly&&<button onClick={()=>patch({attachments:record.attachments?.filter(x=>x.id!==a.id)})}>Remove</button>}</p>)}
   {!readOnly&&<form className="flex gap-2" onSubmit={e=>{e.preventDefault();try{
    const link=new URL(url);if(!["http:","https:"].includes(link.protocol))return;
    patch({attachments:[...(record.attachments??[]),{id:newId(),name:link.hostname,url:link.href}]});setUrl("");
   }catch{/* invalid URL */}}}>
    <input type="url" required aria-label="Attachment URL" className={inputClass+" min-w-0 flex-1"} value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://..."/>
    <button type="submit" className="text-blue-600">Attach</button></form>}
  </section>
  <section className="space-y-2"><h3 className="text-sm font-semibold">Dependencies</h3>
   {data.records.filter(r=>r.id!==record.id).map(r=><label key={r.id} className="mr-3 inline-flex gap-1 text-xs">
    <input type="checkbox" disabled={readOnly} checked={!!record.dependsOn?.includes(r.id)}
     onChange={e=>onChange(setCollectionDependencies(data,record.id,e.target.checked?[...(record.dependsOn??[]),r.id]:(record.dependsOn??[]).filter(id=>id!==r.id)))}/>
    {r.values[data.fields[0]?.id]??r.id}</label>)}
  </section>
  <section id="task-comments" className="scroll-mt-4 space-y-2"><h3 className="text-sm font-semibold">Comments</h3>
   {(record.comments??[]).map(c=><p key={c.id} className="rounded bg-[var(--planner-hover)] p-2 text-xs dark:bg-[var(--planner-surface)]">
    <strong>{c.author}</strong> · {new Date(c.at).toLocaleString()}<span className="block whitespace-pre-wrap">{c.text}</span></p>)}
   {!readOnly&&<form onSubmit={e=>{e.preventDefault();onChange(addTaskComment(data,record.id,comment));setComment("");}}>
    <textarea aria-label="New comment" className={inputClass+" w-full"} maxLength={5000} value={comment} onChange={e=>setComment(e.target.value)}/>
    <button type="submit" disabled={!comment.trim()} className="text-blue-600">Post comment</button></form>}
  </section>
  <section id="task-activity" className="scroll-mt-4"><h3 className="text-sm font-semibold">Activity</h3>
   {(record.activity??[]).slice().reverse().map(a=><p key={a.id} className="text-xs text-[var(--planner-secondary)]">{new Date(a.at).toLocaleString()} · {a.summary}</p>)}
  </section>
 </div>;
}
