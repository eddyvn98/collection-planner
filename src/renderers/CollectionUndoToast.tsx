import {useCallback,useEffect,useRef,useState} from "react";
import type {CollectionBlockPayload} from "../collections/model";
import type {useCollectionHistory} from "../collections/collectionHistory";
type History=ReturnType<typeof useCollectionHistory>;
export function isPlannerMove(before:CollectionBlockPayload,after:CollectionBlockPayload){
 const oldRows=new Map(before.records.map(row=>[row.id,row]));
 if(after.records.some(row=>{
  const previous=oldRows.get(row.id);
  return previous&&(previous.parentId!==row.parentId||previous.boardOrder!==row.boardOrder);
 }))return true;
 return before.fields.some(field=>{
  const changed=after.fields.find(next=>next.id===field.id);
  if(field.type!=="select"||!changed||!field.options||!changed.options)return false;
  return field.options.length===changed.options.length&&
   new Set(field.options).size===new Set(changed.options).size&&
   field.options.some((option,index)=>changed.options?.[index]!==option)&&
   field.options.every(option=>changed.options?.includes(option));
 });
}
export function usePlannerUndoToast(data:CollectionBlockPayload,history:History,readOnly:boolean){
 const [toast,setToast]=useState("");
 const latest=useRef(data);latest.current=data;
 const change=useCallback((next:CollectionBlockPayload)=>{
  if(readOnly||next===latest.current)return;
  if(isPlannerMove(latest.current,next))setToast("Đã di chuyển");
  latest.current=next;
  history.onChange(next);
 },[history.onChange,readOnly]);
 const undo=useCallback(()=>{
  if(!history.canUndo||readOnly)return;
  history.undo();setToast("Đã hoàn tác");
 },[history.undo,history.canUndo,readOnly]);
 const redo=useCallback(()=>{
  if(!history.canRedo||readOnly)return;
  history.redo();setToast("Đã làm lại");
 },[history.redo,history.canRedo,readOnly]);
 useEffect(()=>{
  if(!toast)return;
  const timeout=setTimeout(()=>setToast(""),5000);
  return()=>clearTimeout(timeout);
 },[toast]);
 return {onChange:change,undo,redo,toast,dismiss:()=>setToast(""),
  canUndo:history.canUndo,canRedo:history.canRedo};
}
export function CollectionUndoToast({message,onUndo,onClose,canUndo}:{
 message:string;onUndo:()=>void;onClose:()=>void;canUndo:boolean;
}){
 if(!message)return null;
 return <div role="status" aria-live="polite" aria-atomic="true" data-testid="planner-undo-toast"
   className="fixed bottom-4 left-1/2 z-[12000] flex -translate-x-1/2 items-center gap-2 rounded-lg border border-[var(--planner-border)] bg-[var(--planner-surface)] px-3 py-2 text-sm text-[var(--planner-text)] shadow-xl">
   <span>{message} ·</span>
   <button type="button" disabled={!canUndo} onClick={onUndo} className="min-h-11 rounded px-3 font-semibold text-[var(--planner-accent)] disabled:opacity-50">Hoàn tác</button>
   <button type="button" aria-label="Đóng thông báo" onClick={onClose} className="min-h-11 min-w-11 rounded hover:bg-[var(--planner-hover)]">×</button>
 </div>;
}
