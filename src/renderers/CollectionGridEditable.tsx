import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { CollectionField } from "../collections/model";
import { formatPlannerCardDate } from "../collections/collectionDateDisplay";

export const gridEditClass = "w-full min-w-0 rounded border-2 border-[var(--planner-accent)] bg-[var(--planner-surface)] px-1.5 py-1 text-xs text-[var(--planner-text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)]";
const gridViewClass = "flex min-h-9 w-full min-w-0 items-center rounded border-2 border-transparent px-1.5 text-left text-xs hover:bg-[var(--planner-hover)] focus-visible:border-[var(--planner-accent)] focus-visible:outline-none";
export function CollectionGridEditable({label, value, readOnly, onSave, children, type="text", options}:{
 label:string;value:string;readOnly:boolean;onSave:(value:string)=>void;children?:ReactNode;
 type?:CollectionField["type"]|"priority"|"progress";options?:{value:string;label:string}[];
}){
 const [editing,setEditing]=useState(false);
 const [draft,setDraft]=useState(value);
 const editor=useRef<HTMLInputElement|HTMLSelectElement>(null);
 const draftRef=useRef(value); draftRef.current=draft;
 useEffect(()=>{if(!editing)setDraft(value);},[value,editing]);
 useEffect(()=>{if(editing)editor.current?.focus();},[editing]);
 const close=(save:boolean)=>{if(save&&draftRef.current!==value)onSave(draftRef.current);setEditing(false);};
 const keys=(event:React.KeyboardEvent)=>{
  if(event.key==="Escape"){event.preventDefault();event.stopPropagation();close(false);}
  if(event.key==="Enter"){event.preventDefault();close(true);}
 };
 const view=children ?? (type==="date" ? (value?formatPlannerCardDate(value,new Date().toISOString().slice(0,10)):"")
  : value);
 return editing&&!readOnly ?
  options ? <select ref={editor as React.RefObject<HTMLSelectElement>} aria-label={label}
    className={gridEditClass} value={draft} onChange={e=>{setDraft(e.target.value);onSave(e.target.value);setEditing(false);}}
    onBlur={()=>close(false)} onKeyDown={keys}>
    {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
   </select> :
   <input data-grid-input ref={editor as React.RefObject<HTMLInputElement>} aria-label={label}
     className={gridEditClass} type={type==="date"?"date":type==="number"?"number":"text"}
     value={draft} onChange={e=>setDraft(e.target.value)} onBlur={()=>close(true)} onKeyDown={keys}/> :
  <button data-grid-cell-editor type="button" disabled={readOnly} aria-label={label} title={label}
    className={gridViewClass} onClick={()=>{setDraft(value);setEditing(true);}}
    onKeyDown={e=>{if(e.key==="F2"){e.preventDefault();setDraft(value);setEditing(true);}}}>
    <span className="min-w-0 truncate">{view||<span className="text-[var(--planner-secondary)]"> </span>}</span>
  </button>;
}
