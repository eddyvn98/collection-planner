"use client";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { primaryField, recordTitle, selectField, setRecordValue, updateRecordBody,
 type CollectionBlockPayload, type CollectionField, type CollectionSources } from "../collections/model";
import { FieldEditor, hintClass, inputClass } from "./CollectionFieldEditor";
import { isLegacyStatusField, plannerBucket } from "../collections/collectionPlannerFields";
import { taskDateFields } from "../collections/collectionTasks";
import { CollectionTaskActions } from "./CollectionTaskActions";
import { CollectionTaskProperties } from "./CollectionTaskProperties";
interface Props {
 data: CollectionBlockPayload; sources?: CollectionSources; recordId: string; group?: CollectionField;
 readOnly: boolean; onChange: (next: CollectionBlockPayload) => void; onClose: () => void;
 returnFocusTo?: HTMLElement | null;
}
/** Every view edits the same stable record. Parent onChange persists edits. */
export function CollectionRecordDetails({data,sources,recordId,group,readOnly,onChange,onClose,returnFocusTo}:Props){
 const dialog=useRef<HTMLElement>(null),titleInput=useRef<HTMLInputElement>(null);
 const closeRef=useRef(onClose);
 closeRef.current=onClose;
 const record=data.records.find(r=>r.id===recordId);
 useEffect(()=>{
  const prior=returnFocusTo ?? (document.activeElement instanceof HTMLElement?document.activeElement:null);
  titleInput.current?.focus();
  const keydown=(event:KeyboardEvent)=>{
   if(event.key==="Escape"){
    event.preventDefault();event.stopPropagation();closeRef.current();return;
   }
   if(event.key!=="Tab"||!dialog.current)return;
   const focusable=[...dialog.current.querySelectorAll<HTMLElement>(
    'button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],summary,[tabindex]:not([tabindex="-1"])'
   )].filter(node=>node.getClientRects().length>0);
   const first=focusable[0],last=focusable[focusable.length-1];
   if(!first)return;
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  };
  window.addEventListener("keydown",keydown,true);
  return ()=>{window.removeEventListener("keydown",keydown,true);requestAnimationFrame(() => { if (prior?.isConnected) prior.focus(); });};
 },[]);
 if(!record||typeof document==="undefined")return null;
 const title=primaryField(data);
 const bucket=group && !isLegacyStatusField(group) ? group : plannerBucket(data);
 const {start,due}=taskDateFields(data);
 const hidden=new Set([title?.id,bucket?.id,start?.id,due?.id,...data.fields.filter(isLegacyStatusField).map(f=>f.id)]);
 return createPortal(<div className="fixed inset-0 z-[10020] flex justify-end bg-black/50"
  role="presentation" onPointerDown={event=>event.stopPropagation()}>
  <button type="button" className="absolute inset-0 cursor-default" aria-label="Close task details"
   onClick={onClose}/>
  <section ref={dialog} role="dialog" aria-modal="true" aria-label={"Task "+recordTitle(data,record)}
   className="relative z-10 flex h-full w-full max-w-2xl flex-col bg-white text-slate-900 shadow-xl dark:bg-slate-950 dark:text-slate-100">
   <header className="flex shrink-0 items-center justify-between gap-3 border-b p-4 dark:border-slate-800">
    <h2 className="truncate text-lg font-semibold">Task details</h2>
    <button type="button" className="rounded-lg border px-3 py-1.5 text-sm focus-visible:ring-2 focus-visible:ring-blue-500"
     onClick={onClose} aria-label="Close task details">Close</button>
   </header>
   <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
    {title&&<label className="block space-y-1 text-xs font-semibold">
     Task name<input ref={titleInput} className={inputClass+" w-full text-lg font-semibold"} maxLength={300}
      value={record.values[title.id]??""} disabled={readOnly}
      onChange={e=>onChange(setRecordValue(data,record.id,title.id,e.target.value))}/>
    </label>}
    {bucket&&<label className="block space-y-1 text-xs font-medium">
     Bucket<FieldEditor field={bucket} value={record.values[bucket.id]??""} readOnly={readOnly}
      data={data} recordId={record.id} sources={sources}
      onSet={value=>onChange(setRecordValue(data,record.id,bucket.id,value))}/>
    </label>}
    <nav aria-label="Task details sections" className="flex flex-wrap gap-2 text-xs text-blue-700 dark:text-blue-300">
     <a href="#task-notes" className="rounded-md bg-blue-50 px-2 py-1 dark:bg-slate-800">Notes</a>
     <a href="#task-attachments" className="rounded-md bg-blue-50 px-2 py-1 dark:bg-slate-800">Attachments</a>
     <a href="#task-comments" className="rounded-md bg-blue-50 px-2 py-1 dark:bg-slate-800">Comments</a>
     <a href="#task-activity" className="rounded-md bg-blue-50 px-2 py-1 dark:bg-slate-800">Activity</a>
    </nav>
    <label id="task-notes" className="block space-y-1 text-sm">
     <span className="font-semibold">Notes</span>
     <textarea aria-label="Task notes" className={inputClass+" min-h-36 w-full resize-y"}
      maxLength={20000} readOnly={readOnly} value={record.body??""}
      placeholder="Describe the work, links and important decisions..."
      onChange={e=>onChange(updateRecordBody(data,record.id,e.target.value))}/>
    </label>
    <CollectionTaskProperties data={data} record={record} readOnly={readOnly} onChange={onChange}/>
    <CollectionTaskActions data={data} record={record} readOnly={readOnly} onChange={onChange}/>
    {data.fields.some(field=>!hidden.has(field.id))&&<details className="rounded-lg border p-3 dark:border-slate-700">
     <summary className="cursor-pointer text-sm font-semibold">Other fields</summary>
     <div className="mt-3 space-y-3">
      {data.fields.filter(field=>!hidden.has(field.id)).map(field=><label key={field.id} className="block space-y-1 text-sm">
       <span className="text-xs">{field.name}</span>
       <FieldEditor field={field} value={record.values[field.id]??""} readOnly={readOnly}
        data={data} sources={sources} recordId={record.id}
        onSet={value=>onChange(setRecordValue(data,record.id,field.id,value))}/>
      </label>)}
     </div>
    </details>}
    <p className={hintClass}>Changes save automatically · Task ID: {record.id}</p>
   </div>
  </section>
 </div>,document.body);
}
