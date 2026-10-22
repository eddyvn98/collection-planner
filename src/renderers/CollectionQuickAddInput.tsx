import {useMemo,type CSSProperties,type ChangeEvent,type KeyboardEvent} from "react";
import {parseQuickAdd,type QuickAddParse} from "../collections/collectionInputParser";
import type {CollectionBlockPayload} from "../collections/model";
interface Props{data:CollectionBlockPayload;value:string;onChange:(text:string)=>void;
 label:string;placeholder?:string;autoFocus?:boolean;disabled:boolean;className:string;
 maxLength?:number;onEscape?:()=>void;inputStyle?:CSSProperties;}
export function CollectionQuickAddInput({data,value,onChange,label,placeholder,
 autoFocus,disabled,className,maxLength=300,onEscape,inputStyle}:Props){
 const parsed=useMemo(()=>parseQuickAdd(value,data),[value,data]);
 const tokensOn=typeof localStorage==="undefined"||localStorage.getItem("planner:input:tokens")!=="off";
 const preview=tokensOn?parsed:{...parsed,tokens:[]};
 return <div className="min-w-0 flex-1">
  <input autoFocus={autoFocus} aria-label={label} value={value} disabled={disabled} style={inputStyle}
   maxLength={maxLength} className={className} placeholder={placeholder}
   autoComplete="off" onChange={(event:ChangeEvent<HTMLInputElement>)=>onChange(event.target.value)}
   onFocus={event=>{
    const input=event.currentTarget;
    requestAnimationFrame(()=>{if(input.isConnected)input.scrollIntoView({block:"nearest",behavior:"auto"});});
   }}
   onKeyDown={(event:KeyboardEvent<HTMLInputElement>)=>{
    if(event.key==="Escape"){event.stopPropagation();onEscape?.();}
    if(event.key==="Enter"&&event.nativeEvent.isComposing)event.preventDefault();
   }}/>
  {!!preview.tokens.length&&<div data-testid="quick-add-preview" role="status" aria-live="polite"
   className="flex flex-wrap gap-1.5 pt-1.5">
   {preview.tokens.map((token,index)=><span key={token.kind+index}
    data-token-kind={token.kind} className="rounded-full bg-[var(--planner-hover)] px-2 py-1 text-[11px] text-[var(--planner-accent)]">
    {token.kind==="date"?"Date":token.kind==="assignee"?"Person":token.kind==="label"?"Label":"Priority"}: {token.label}
   </span>)}
   {preview.title&&<span className="sr-only">Title: {preview.title}</span>}
  </div>}
 </div>;
}
export function parsedQuickTitle(data:CollectionBlockPayload,text:string):QuickAddParse{
 return localStorage.getItem("planner:input:tokens")==="off"?
  {title:text.trim(),due:"",assigneeIds:[],labelIds:[],tokens:[]}:parseQuickAdd(text,data);
}
