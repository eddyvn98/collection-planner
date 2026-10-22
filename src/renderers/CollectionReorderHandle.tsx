import {useRef,useState,type PointerEvent} from "react";
import {GripVertical} from "lucide-react";
interface Props{kind:"gallery"|"form";itemId:string;label:string;items:string[];
 disabled:boolean;onMove:(source:string,target:string)=>void;}
export function CollectionReorderHandle({kind,itemId,label,items,disabled,onMove}:Props){
 const start=useRef<{id:number;x:number;y:number}|null>(null);
 const [dragging,setDragging]=useState(false);
 const down=(event:PointerEvent<HTMLButtonElement>)=>{
  if(disabled)return;
  start.current={id:event.pointerId,x:event.clientX,y:event.clientY};
  event.currentTarget.setPointerCapture(event.pointerId);
 };
 const up=(event:PointerEvent<HTMLButtonElement>)=>{
  const origin=start.current;start.current=null;setDragging(false);
  if(!origin||origin.id!==event.pointerId||disabled)return;
  if(Math.hypot(event.clientX-origin.x,event.clientY-origin.y)<8)return;
  const element=document.elementFromPoint(event.clientX,event.clientY);
  const dest=element?.closest<HTMLElement>('[data-reorder-kind="'+kind+'"]')
   ?.dataset.reorderId;
  if(dest&&dest!==itemId)onMove(itemId,dest);
 };
 return <button type="button" aria-label={"Reorder "+kind+" "+label} title="Drag to reorder; arrow keys also work"
  disabled={disabled} onPointerDown={down} onPointerUp={up}
  onPointerMove={event=>{
   if(start.current?.id===event.pointerId&&
    Math.hypot(event.clientX-start.current.x,event.clientY-start.current.y)>=8)
    setDragging(true);
  }}
  onPointerCancel={()=>{start.current=null;setDragging(false);}}
  onKeyDown={event=>{
   const delta=event.key==="ArrowUp"||event.key==="ArrowLeft"?-1:
    event.key==="ArrowDown"||event.key==="ArrowRight"?1:0;
   if(!delta||disabled)return;
   event.preventDefault();
   const next=items[items.indexOf(itemId)+delta];
   if(next)onMove(itemId,next);
  }}
  className={"grid h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 touch-none place-items-center rounded text-[var(--planner-secondary)] hover:bg-[var(--planner-hover)] focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)] "+
   (dragging?"ring-2 ring-[var(--planner-accent)] bg-[var(--planner-hover)]":"")}>
   <GripVertical size={18} strokeWidth={1.75}/>
  </button>;
}
