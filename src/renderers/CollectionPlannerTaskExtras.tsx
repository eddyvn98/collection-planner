import { useState } from "react";
import { ChevronDown, FileText, Paperclip, MessageCircle, ListChecks, Link2, History, Plus } from "lucide-react";
import { newId, updateRecordBody, type CollectionBlockPayload, type CollectionRecord } from "../collections/model";
import { updateTask, addTaskComment } from "../collections/collectionTasks";
import { CollectionChecklist } from "./CollectionChecklist";
import { CollectionDependencyPicker } from "./CollectionDependencyPicker";
interface Props{data:CollectionBlockPayload;record:CollectionRecord;readOnly:boolean;
 onChange:(data:CollectionBlockPayload)=>void;}
const section="border-b border-[var(--planner-border)] py-3";
const summary="flex min-h-9 cursor-pointer items-center gap-2 text-sm font-semibold hover:text-[var(--planner-accent)]";
const input="min-h-9 w-full rounded border border-[var(--planner-border)] bg-[var(--planner-surface)] p-2 text-sm text-[var(--planner-text)] focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)]";
export function CollectionPlannerTaskExtras({data,record,readOnly,onChange}:Props){
 const [url,setUrl]=useState(""),[comment,setComment]=useState("");
 const patch=(changes:Partial<CollectionRecord>)=>onChange(updateTask(data,record.id,changes,"Updated task"));
 const completed=record.checklist?.filter(x=>x.done).length??0, total=record.checklist?.length??0;
 return <div className="space-y-1" aria-label="Task sections">
  <details open className={section} id="task-notes"><summary className={summary}>
    <FileText size={16} strokeWidth={1.75}/>Notes<ChevronDown size={14} className="ml-auto"/></summary>
    <textarea aria-label="Task notes" className={input+" mt-2 min-h-28 resize-y"} maxLength={20000}
      readOnly={readOnly} value={record.body??""} placeholder="Add notes"
      onChange={e=>onChange(updateRecordBody(data,record.id,e.target.value))}/>
  </details>
  <details open className={section} id="task-checklist"><summary className={summary}>
   <ListChecks size={16} strokeWidth={1.75}/>Checklist
   <span className="ml-auto text-xs font-normal text-[var(--planner-secondary)]">{completed}/{total}</span>
   <ChevronDown size={14}/></summary>
   <div role="progressbar" aria-label="Checklist progress" aria-valuenow={completed} aria-valuemin={0}
      aria-valuemax={total||1} className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--planner-border)]">
     <div className="h-full rounded-full bg-[var(--planner-accent)]" style={{width:total?100*completed/total+"%":"0%"}}/>
   </div>
   <CollectionChecklist items={record.checklist} readOnly={readOnly} onChange={checklist=>patch({checklist})}/>
  </details>
  <details className={section} id="task-attachments"><summary className={summary}>
    <Paperclip size={16} strokeWidth={1.75}/>Attachments
    <span className="ml-auto text-xs font-normal">{record.attachments?.length??0}</span><ChevronDown size={14}/></summary>
    <div className="mt-2 space-y-2">{(record.attachments??[]).map(a=><div key={a.id} className="flex gap-2 text-xs">
      <Link2 size={15}/><a className="min-w-0 flex-1 truncate text-[var(--planner-accent)] underline"
        href={a.url} target="_blank" rel="noopener noreferrer">{a.name}</a>
      {!readOnly&&<button onClick={()=>patch({attachments:record.attachments?.filter(x=>x.id!==a.id)})}
        className="rounded px-2 hover:bg-[var(--planner-hover)]">Remove</button>}
    </div>)}
    {!readOnly&&<form className="flex gap-1" onSubmit={e=>{e.preventDefault();try{
      const link=new URL(url);if(!["https:","http:"].includes(link.protocol))return;
      patch({attachments:[...(record.attachments??[]),{id:newId(),name:link.hostname,url:link.href}]});setUrl("");
     }catch{/* invalid URL */}}}>
      <input aria-label="Attachment URL" type="url" required value={url} placeholder="https://..."
        onChange={e=>setUrl(e.target.value)} className={input+" min-w-0 flex-1"}/>
      <button type="submit" className="rounded px-2 text-[var(--planner-accent)] hover:bg-[var(--planner-hover)]"
        aria-label="Attach link"><Plus size={16}/></button></form>}</div>
  </details>
  <details className={section} id="task-dependencies"><summary className={summary}>
    <Link2 size={16}/>Dependencies
    <span className="ml-auto text-xs font-normal text-[var(--planner-secondary)]">{record.dependsOn?.length??0}</span>
    <ChevronDown size={14}/></summary>
    <CollectionDependencyPicker data={data} record={record} readOnly={readOnly} onChange={onChange}/>
  </details>
  <details open className={section} id="task-comments"><summary className={summary}>
    <MessageCircle size={16} strokeWidth={1.75}/>Comments
    <span className="ml-auto text-xs font-normal">{record.comments?.length??0}</span>
    <ChevronDown size={14}/></summary>
    <div className="mt-2 space-y-2">{(record.comments??[]).map(c=><div key={c.id}
      className="rounded bg-[var(--planner-hover)] p-2 text-xs">
      <strong>{c.author}</strong> · {new Date(c.at).toLocaleString()}
      <p className="whitespace-pre-wrap">{c.text}</p></div>)}
    {!readOnly&&<form onSubmit={e=>{e.preventDefault();onChange(addTaskComment(data,record.id,comment));setComment("");}}>
      <textarea aria-label="New comment" maxLength={5000} value={comment}
        onChange={e=>setComment(e.target.value)} className={input+" min-h-16"} placeholder="Write a comment"/>
      <button type="submit" disabled={!comment.trim()}
        className="mt-1 min-h-9 rounded bg-[var(--planner-accent)] px-3 text-xs text-white disabled:opacity-40">Post comment</button>
    </form>}</div>
  </details>
  <details className={section} id="task-activity"><summary className={summary}>
    <History size={16}/>Activity<ChevronDown size={14} className="ml-auto"/></summary>
    {(record.activity??[]).slice().reverse().map(a=><p key={a.id} className="py-1 text-xs text-[var(--planner-secondary)]">
      {new Date(a.at).toLocaleString()} · {a.summary}</p>)}
  </details>
 </div>;
}
