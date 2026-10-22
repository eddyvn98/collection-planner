"use client";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { CollectionDrawerActions } from "./CollectionDrawerActions";
import { deleteRecord } from "../collections/model";
import { CheckCircle2, Circle, X } from "lucide-react";
import { primaryField, recordTitle, setRecordValue, type CollectionBlockPayload,
 type CollectionField, type CollectionSources } from "../collections/model";
import { isLegacyStatusField, plannerBucket } from "../collections/collectionPlannerFields";
import { setTaskProgress } from "./collectionBoardGroups";
import { FieldEditor, hintClass, inputClass } from "./CollectionFieldEditor";
import { taskDateFields } from "../collections/collectionTasks";
import { CollectionPlannerTaskFields } from "./CollectionPlannerTaskFields";
import { CollectionPlannerTaskExtras } from "./CollectionPlannerTaskExtras";
import { CollectionTaskActions } from "./CollectionTaskActions";
interface Props{data:CollectionBlockPayload;sources?:CollectionSources;recordId:string;group?:CollectionField;
 readOnly:boolean;onChange:(next:CollectionBlockPayload)=>void;onClose:()=>void;returnFocusTo?:HTMLElement|null;}
/** Non-modal side pane: the Board stays clickable while task details are open. */
export function CollectionRecordDetails({data,sources,recordId,readOnly,onChange,onClose,returnFocusTo}:Props){
 const titleInput=useRef<HTMLInputElement>(null),closeRef=useRef(onClose);
 closeRef.current=onClose;
 const record=data.records.find(row=>row.id===recordId);
 useEffect(()=>{
  const prior=returnFocusTo??(document.activeElement instanceof HTMLElement?document.activeElement:null);
  titleInput.current?.focus();
  const keydown=(event:KeyboardEvent)=>{if(event.key==="Escape"){
    // Child popovers consume Escape first. Keep the pane mounted until they close.
    if(document.querySelector("[data-planner-floating]"))return;
    event.preventDefault();event.stopPropagation();closeRef.current();
  }};
  window.addEventListener("keydown",keydown,true);
  return ()=>{window.removeEventListener("keydown",keydown,true);
    requestAnimationFrame(()=>{if(prior?.isConnected)prior.focus();});};
 },[]);
 if(!record||typeof document==="undefined")return null;
 const title=primaryField(data),bucket=plannerBucket(data);
 const dates=taskDateFields(data);
 const hidden=new Set([title?.id,bucket?.id,dates.start?.id,dates.due?.id,
   ...data.fields.filter(isLegacyStatusField).map(f=>f.id)]);
 const complete=record.progress==="completed";
 return createPortal(<div className="pointer-events-none fixed inset-0 z-[10020] flex justify-end"
  onPointerDown={e=>e.stopPropagation()}>
  <section role="dialog" aria-modal="false" aria-label={"Task "+recordTitle(data,record)}
   className="planner-motion-drawer pointer-events-auto flex h-full w-full max-w-[420px] flex-col border-l border-[var(--planner-border)] bg-[var(--planner-surface)] text-[var(--planner-text)] shadow-[-8px_0_24px_#00000018]">
   <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--planner-border)] px-4 py-3">
     <h2 className="text-sm font-semibold">Task details</h2>
     <div className="flex items-center gap-1"><CollectionDrawerActions data={data} record={record}
       readOnly={readOnly} onChange={onChange} onDelete={()=>{onChange(deleteRecord(data,record.id));onClose();}}/>
     <button type="button" aria-label="Close task details" title="Close task details" onClick={onClose}
       className="flex min-h-9 min-w-9 items-center justify-center rounded hover:bg-[var(--planner-hover)] focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)]">
       <X size={16} strokeWidth={1.75}/></button></div>
   </header>
   <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
    <div className="flex items-center gap-2">
      <button type="button" disabled={readOnly} aria-label={complete?"Reopen task":"Complete task"}
       onClick={()=>onChange(setTaskProgress(data,record.id,complete?"not_started":"completed"))}
       className="flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded-full text-[var(--planner-accent)] hover:bg-[var(--planner-hover)] focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)]">
       {complete?<CheckCircle2 size={22} strokeWidth={1.75}/>:<Circle size={22} strokeWidth={1.75}/>}
      </button>
      {title&&<input ref={titleInput} aria-label="Task name" maxLength={300} disabled={readOnly}
        value={record.values[title.id]??""} onChange={e=>onChange(setRecordValue(data,record.id,title.id,e.target.value))}
        className={"min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 py-2 text-base font-semibold outline-none focus-visible:border-[var(--planner-accent)] "+
          (complete?"line-through text-[var(--planner-secondary)]":"")}/>}
    </div>
    <CollectionPlannerTaskFields data={data} record={record} readOnly={readOnly} onChange={onChange}/>
    <CollectionPlannerTaskExtras data={data} record={record} readOnly={readOnly} onChange={onChange}/>
    <details className="rounded border border-[var(--planner-border)] p-2">
      <summary className="min-h-8 cursor-pointer text-sm font-medium">More task actions</summary>
      <CollectionTaskActions data={data} record={record} readOnly={readOnly} onChange={onChange}/>
    </details>
    {data.fields.some(field=>!hidden.has(field.id))&&<details className="rounded border border-[var(--planner-border)] p-3">
      <summary className="cursor-pointer text-sm font-semibold">Other fields</summary>
      <div className="mt-2 space-y-3">{data.fields.filter(field=>!hidden.has(field.id)).map(field=>
        <label className="block space-y-1 text-sm" key={field.id}>{field.name}
         <FieldEditor field={field} value={record.values[field.id]??""} readOnly={readOnly}
          data={data} sources={sources} recordId={record.id}
          onSet={value=>onChange(setRecordValue(data,record.id,field.id,value))}/></label>)}</div>
    </details>}
    <p className={hintClass}>Changes save automatically · Task ID: {record.id}</p>
   </div>
  </section>
 </div>,document.body);
}
