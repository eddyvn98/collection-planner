import {useRef,useState,type PointerEvent} from "react";
import {format,addDays,parseISO} from "date-fns";
import {dateField,endDateField,type CollectionBlockPayload,type CollectionRecord,type CollectionView} from "../collections/model";
import {scheduledTaskDay,parseScheduleDay} from "../collections/collectionSchedule";
interface Props{data:CollectionBlockPayload;view:CollectionView;record:CollectionRecord;
 edge:"start"|"end";disabled:boolean;
 onResize:(id:string,edge:"start"|"end",day:string)=>void;}
export function CollectionScheduleResizeHandle({data,view,record,edge,disabled,onResize}:Props){
 const start=useRef<{id:number;x:number;y:number}|null>(null);
 const [dragging,setDragging]=useState(false);
 const field=(edge==="start"?dateField:endDateField)(data,view);
 const date=record.values[field?.id??""]||scheduledTaskDay(data,view,record);
 const down=(event:PointerEvent<HTMLButtonElement>)=>{
  start.current={id:event.pointerId,x:event.clientX,y:event.clientY};
  event.currentTarget.setPointerCapture(event.pointerId);
 };
 const up=(event:PointerEvent<HTMLButtonElement>)=>{
  const origin=start.current;start.current=null;setDragging(false);
  if(disabled||!origin||origin.id!==event.pointerId)return;
  if(Math.hypot(event.clientX-origin.x,event.clientY-origin.y)<8)return;
  const day=document.elementFromPoint(event.clientX,event.clientY)
   ?.closest<HTMLElement>('[data-testid="collection-calendar-day"][data-date]')
   ?.dataset.date;
  if(day&&day!==date)onResize(record.id,edge,day);
 };
 return <button type="button" data-testid={"schedule-resize-"+edge}
  disabled={disabled} aria-label={"Resize "+edge+" date of "+(record.values[data.fields[0]?.id??""]??record.id)}
  title={"Drag to change "+edge+" date; Arrow Left/Right also works"}
  onPointerDown={down} onPointerUp={up}
  onPointerMove={event=>{
   if(start.current?.id===event.pointerId&&
    Math.hypot(event.clientX-start.current.x,event.clientY-start.current.y)>=8)
    setDragging(true);
  }}
  onPointerCancel={()=>{start.current=null;setDragging(false);}}
  onKeyDown={event=>{
   if(!["ArrowLeft","ArrowRight"].includes(event.key)||!parseScheduleDay(date))return;
   event.preventDefault();
   const next=addDays(parseISO(date),event.key==="ArrowRight"?1:-1);
   onResize(record.id,edge,format(next,"yyyy-MM-dd"));
  }}
  className={"grid h-11 min-h-[44px] min-w-[44px] touch-none place-items-center rounded px-1 text-[10px] text-[var(--planner-accent)] hover:bg-[var(--planner-hover)] focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)] "+
   (dragging?"ring-2 ring-[var(--planner-accent)]":"")}>
  {edge==="start"?"◀ Start":"End ▶"}
 </button>;
}
