import { displayPlannerDate } from "../collections/collectionDateDisplay";
import { CalendarDays, Circle, CircleDot, CheckCircle2, Flag, Repeat, Tag, UserRound, Layers3 } from "lucide-react";
import { newId, setRecordValue, type CollectionBlockPayload, type CollectionRecord,
 type TaskProgress, type TaskPriority } from "../collections/model";
import { plannerBucket } from "../collections/collectionPlannerFields";
import { setRecurrence, type TaskRecurrence } from "../collections/collectionRecurrence";
import { PROGRESS, PRIORITIES, taskDate, setTaskDate, updateTask } from "../collections/collectionTasks";
import { setTaskProgress } from "./collectionBoardGroups";
interface Props{data:CollectionBlockPayload;record:CollectionRecord;readOnly:boolean;
 onChange:(data:CollectionBlockPayload)=>void;}
const row="grid grid-cols-[18px_78px_minmax(0,1fr)] items-center gap-3 py-2 text-sm";
const input="min-h-9 w-full min-w-0 rounded-md border border-[var(--planner-border)] bg-[var(--planner-surface)] px-2 text-sm text-[var(--planner-text)] focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)]";
export function CollectionPlannerTaskFields({data,record,readOnly,onChange}:Props){
 const bucket=plannerBucket(data);
 const patch=(field:Partial<CollectionRecord>)=>onChange(updateTask(data,record.id,field,"Updated task"));
 const people=data.people??[],labels=data.labels??[];
 const addPerson=(name:string)=>{
  if(!name.trim())return;
  const found=people.find(p=>p.name.toLowerCase()===name.trim().toLowerCase());
  const person=found??{id:newId(),name:name.trim()};
  const next={...data,people:found?people:[...people,person]};
  onChange(updateTask(next,record.id,{assigneeIds:[...new Set([...(record.assigneeIds??[]),person.id])]}));
 };
 const addLabel=(name:string)=>{
  if(!name.trim())return;
  const found=labels.find(p=>p.name.toLowerCase()===name.trim().toLowerCase());
  if(!found&&labels.length>=25)return;
  const label=found??{id:newId(),name:name.trim(),color:"#5B5FC7"};
  const next={...data,labels:found?labels:[...labels,label]};
  onChange(updateTask(next,record.id,{labelIds:[...new Set([...(record.labelIds??[]),label.id])]}));
 };
 return <section aria-label="Task properties" className="divide-y divide-[var(--planner-border)]">
  {bucket&&<label className={row}><Layers3 size={16} strokeWidth={1.75}/><span>Bucket</span>
   <select className={input} value={record.values[bucket.id]??""} disabled={readOnly}
    aria-label="Task bucket" onChange={e=>onChange(setRecordValue(data,record.id,bucket.id,e.target.value))}>
    <option value="">Choose bucket</option>{(bucket.options??[]).map(p=><option key={p} value={p}>{p}</option>)}</select></label>}
  <label className={row}>
   {record.progress==="completed"?<CheckCircle2 size={16}/>:record.progress==="in_progress"?<CircleDot size={16}/>:<Circle size={16}/>}
   <span>Progress</span>
   <select aria-label="Task progress" className={input} value={record.progress??"not_started"} disabled={readOnly}
    onChange={e=>onChange(setTaskProgress(data,record.id,e.target.value as TaskProgress))}>
    {PROGRESS.map(p=><option key={p.value} value={p.value}>{p.label}</option>)}</select></label>
  <label className={row}><Flag size={16} strokeWidth={1.75}/><span>Priority</span>
   <select aria-label="Task priority" className={input} disabled={readOnly} value={record.priority??"medium"}
    onChange={e=>patch({priority:e.target.value as TaskPriority})}>
    {PRIORITIES.map(p=><option key={p.value} value={p.value}>{p.label}</option>)}</select></label>
  {(["start","due"] as const).map(kind=><label key={kind} className={row}>
   <CalendarDays size={16} strokeWidth={1.75}/><span>{kind==="start"?"Start date":"Due date"}</span>
   <div className="min-w-0"><input className={input} type="date" disabled={readOnly} aria-label={"Task "+kind+" date"}
    value={taskDate(data,record,kind)}
    onChange={e=>onChange(setTaskDate(data,record.id,kind,e.target.value))}/>
    <span className="block text-xs text-[var(--planner-secondary)]" aria-label={kind+" formatted date"}>{displayPlannerDate(taskDate(data,record,kind))}</span></div></label>)}
  <label className={row}><Repeat size={16} strokeWidth={1.75}/><span>Repeat</span>
   <select aria-label="Task recurrence" className={input} disabled={readOnly} value={record.recurrence??"none"}
    onChange={e=>onChange(setRecurrence(data,record.id,e.target.value as TaskRecurrence))}>
    {["none","daily","weekly","monthly"].map(x=><option key={x} value={x}>{x==="none"?"Never":x}</option>)}</select></label>
  <div className={row}><UserRound size={16} strokeWidth={1.75}/><span>Assignees</span>
   <details className="relative min-w-0"><summary className={input+" flex cursor-pointer items-center"}>
    {people.filter(p=>record.assigneeIds?.includes(p.id)).map(p=>p.name).join(", ")||"Assign people"}</summary>
    <div className="absolute right-0 z-20 mt-1 w-full min-w-44 rounded border border-[var(--planner-border)] bg-[var(--planner-surface)] p-2 shadow-lg">
     {people.map(p=><label key={p.id} className="flex min-h-8 items-center gap-2 text-xs">
      <input type="checkbox" disabled={readOnly} checked={!!record.assigneeIds?.includes(p.id)}
       onChange={e=>patch({assigneeIds:e.target.checked?[...(record.assigneeIds??[]),p.id]:(record.assigneeIds??[]).filter(id=>id!==p.id)})}/>{p.name}</label>)}
     {!readOnly&&<form onSubmit={e=>{e.preventDefault();const x=e.currentTarget.elements.namedItem("person") as HTMLInputElement;
        addPerson(x.value);x.value="";}}>
       <input name="person" placeholder="Add a person" aria-label="New assignee" maxLength={80} className={input}/>
       <button type="submit" className="mt-1 min-h-8 text-xs text-[var(--planner-accent)]">Add person</button></form>}
    </div></details>
  </div>
  <div className={row}><Tag size={16} strokeWidth={1.75}/><span>Labels</span>
   <details className="relative min-w-0"><summary className={input+" flex cursor-pointer items-center"}>
     {labels.filter(x=>record.labelIds?.includes(x.id)).map(x=>x.name).join(", ")||"Choose labels"}</summary>
    <div className="absolute right-0 z-20 mt-1 w-full min-w-44 rounded border border-[var(--planner-border)] bg-[var(--planner-surface)] p-2 shadow-lg">
     {labels.map(x=><label key={x.id} className="flex min-h-8 items-center gap-2 text-xs">
      <input type="checkbox" disabled={readOnly} checked={!!record.labelIds?.includes(x.id)}
       onChange={e=>patch({labelIds:e.target.checked?[...(record.labelIds??[]),x.id]:(record.labelIds??[]).filter(id=>id!==x.id)})}/>
       <span className="h-3 w-3 rounded" style={{backgroundColor:x.color}}/>{x.name}</label>)}
     {!readOnly&&<form onSubmit={e=>{e.preventDefault();const x=e.currentTarget.elements.namedItem("label") as HTMLInputElement;
        addLabel(x.value);x.value="";}}>
      <input name="label" aria-label="New label" placeholder="Add a label" maxLength={80} className={input}/>
      <button type="submit" className="mt-1 min-h-8 text-xs text-[var(--planner-accent)]">Add label</button></form>}
    </div></details>
  </div>
 </section>;
}
