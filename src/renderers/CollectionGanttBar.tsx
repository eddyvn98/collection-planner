"use client";
import React,{useRef,useState} from "react";
import {Link2} from "lucide-react";
import {addUtcDays} from "./collectionTimelineDates";
type Mode="move"|"left"|"right"|"dependency";
interface Gesture{mode:Mode;startX:number;startY:number;pointerId:number}
interface Props{
 left:number;width:number;label:string;durationDays:number;disabled:boolean;
 pixelsPerDay?:number;highlighted?:boolean;startDate?:string;endDate?:string;recordId?:string;
 onMove:(days:number)=>void;onResize:(days:number,edge?:"left"|"right")=>void;
 onLinkDrop?:(targetId:string)=>void;onVerticalMove?:(targetId:string)=>void;
}
export const snapTimelineDays=(raw:number,weekly:boolean)=>weekly?Math.round(raw/7)*7:Math.round(raw);
export function CollectionGanttBar({left,width,label,durationDays,disabled,pixelsPerDay=28,
 highlighted,startDate,endDate,recordId,onMove,onResize,onLinkDrop,onVerticalMove}:Props){
 const root=useRef<HTMLDivElement>(null),gesture=useRef<Gesture|null>(null);
 const [preview,setPreview]=useState({days:0,mode:"move" as Mode,y:0});
 const begin=(event:React.PointerEvent,mode:Mode)=>{
  if(disabled||(event.pointerType==="mouse"&&event.button!==0))return;
  event.stopPropagation();event.preventDefault();
  gesture.current={mode,startX:event.clientX,startY:event.clientY,pointerId:event.pointerId};
  root.current?.setPointerCapture(event.pointerId);
  setPreview({days:0,mode,y:0});
 };
 const offset=(x:number,shiftKey:boolean)=>snapTimelineDays((x-(gesture.current?.startX??x))/pixelsPerDay,shiftKey);
 const move=(event:React.PointerEvent)=>{
  const current=gesture.current;
  if(!current)return;
  event.stopPropagation();
  setPreview({days:offset(event.clientX,event.shiftKey),mode:current.mode,
    y:event.clientY-current.startY});
 };
 const end=(event:React.PointerEvent)=>{
  const current=gesture.current;
  if(!current)return;
  event.stopPropagation();
  const amount=offset(event.clientX,event.shiftKey),dy=event.clientY-current.startY;
  gesture.current=null;
  setPreview({days:0,mode:"move",y:0});
  if(current.mode==="dependency"){
   const target=document.elementFromPoint(event.clientX,event.clientY)?.closest<HTMLElement>("[data-timeline-task-id]");
   const id=target?.dataset.timelineTaskId;
   if(id&&id!==recordId)onLinkDrop?.(id);
  }else if(current.mode==="move"&&Math.abs(dy)>28){
   const target=document.elementFromPoint(event.clientX,event.clientY)?.closest<HTMLElement>("[data-timeline-task-id]");
   const id=target?.dataset.timelineTaskId;
   if(id&&id!==recordId)onVerticalMove?.(id);
  }else if(amount){
   if(current.mode==="move")onMove(amount);
   else onResize(amount,current.mode);
  }
 };
 const shift=preview.mode==="move"?preview.days:preview.mode==="left"?preview.days:0;
 const w=Math.max(pixelsPerDay,width+
  (preview.mode==="right"?preview.days*pixelsPerDay:preview.mode==="left"?-preview.days*pixelsPerDay:0));
 const start=addUtcDays(startDate??"",shift)??startDate;
 const finish=addUtcDays(endDate??startDate??"",preview.mode==="move"?preview.days:
  preview.mode==="right"?preview.days:0)??endDate;
 const keyboard=(event:React.KeyboardEvent)=>{
  if(disabled||!["ArrowLeft","ArrowRight"].includes(event.key))return;
  event.preventDefault();event.stopPropagation();
  const delta=(event.key==="ArrowRight"?1:-1)*(event.altKey?7:1);
  if(event.shiftKey)onResize(delta,"right");else onMove(delta);
 };
 return <div ref={root} tabIndex={disabled?-1:0} role="button"
   aria-label={`Timeline bar ${label} ${durationDays} days`}
   title={`${label} · ${startDate??""} → ${endDate??startDate??""}`}
   data-testid="collection-gantt-bar"
   className={"absolute top-2 z-[2] flex h-7 items-center rounded-[3px] text-white outline-none focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)] focus-visible:ring-offset-2 "+
    (highlighted?"bg-amber-600":"bg-[var(--planner-accent)]")}
   style={{left:left+shift*pixelsPerDay,width:w,touchAction:disabled?undefined:"none",
    cursor:disabled?"default":"grab"}}
   onKeyDown={keyboard} onPointerDown={event=>begin(event,"move")}
   onPointerMove={move} onPointerUp={end}
   onPointerCancel={()=>{gesture.current=null;setPreview({days:0,mode:"move",y:0});}}>
   <span className="pointer-events-none block flex-1 truncate px-3 text-[10px]">{label}</span>
   {!disabled&&<>
    <span data-testid="gantt-left-handle" role="button" tabIndex={-1} aria-label={"Resize start "+label}
      onPointerDown={event=>begin(event,"left")}
      className="absolute inset-y-0 left-0 z-[4] w-[9px] cursor-ew-resize rounded-l border-r border-white/50"/>
    <span data-testid="gantt-right-handle" role="button" tabIndex={-1} aria-label={"Resize end "+label}
      onPointerDown={event=>begin(event,"right")}
      className="absolute inset-y-0 right-0 z-[4] w-[9px] cursor-ew-resize rounded-r border-l border-white/50"/>
    <button type="button" aria-label={"Link dependency from "+label} title="Drag to successor to create dependency"
      onPointerDown={event=>begin(event,"dependency")}
      className="absolute -right-7 top-0 z-[4] grid h-7 w-6 place-items-center rounded bg-[var(--planner-surface)] text-[var(--planner-accent)] hover:ring-2">
      <Link2 size={14}/></button>
   </>}
   {gesture.current&&<div role="status" data-testid="gantt-ghost-tooltip"
      className="pointer-events-none absolute -top-8 left-0 z-30 whitespace-nowrap rounded bg-[var(--planner-text)] px-2 py-1 text-[10px] text-[var(--planner-surface)] shadow">
     {start??startDate} → {finish??endDate} {preview.mode==="dependency"?"· Link":preview.days?(`${preview.days>0?"+":""}${preview.days}d`):""}
   </div>}
 </div>;
}
