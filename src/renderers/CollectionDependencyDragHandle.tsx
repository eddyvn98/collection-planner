import {useRef,useState,type PointerEvent} from "react";
import {Link2} from "lucide-react";
interface Props{title:string;sourceId:string;disabled:boolean;
 onDrop:(source:string,target:string)=>void;onKeyboard:(source:string)=>void;}
export function CollectionDependencyDragHandle({title,sourceId,disabled,onDrop,onKeyboard}:Props){
 const pointer=useRef<{id:number;x:number;y:number}|null>(null);
 const [moving,setMoving]=useState(false);
 const down=(event:PointerEvent<HTMLButtonElement>)=>{
  if(disabled)return;
  event.stopPropagation();
  pointer.current={id:event.pointerId,x:event.clientX,y:event.clientY};
  event.currentTarget.setPointerCapture(event.pointerId);
 };
 const finish=(event:PointerEvent<HTMLButtonElement>)=>{
  event.stopPropagation();
  const start=pointer.current;pointer.current=null;setMoving(false);
  if(!start||start.id!==event.pointerId)return;
  if(Math.hypot(start.x-event.clientX,start.y-event.clientY)<8)return;
  const target=document.elementFromPoint(event.clientX,event.clientY)
   ?.closest<HTMLElement>('[data-testid="collection-kanban-card"][data-record-id]')
   ?.dataset.recordId;
  if(target&&target!==sourceId)onDrop(sourceId,target);
 };
 return <button type="button" data-testid="planner-dependency-drag"
  aria-label={"Drag dependency from "+title}
  title="Drag to another card to make this task its predecessor. Enter for keyboard mode."
  disabled={disabled} onPointerDown={down} onPointerUp={finish}
  onPointerMove={event=>{const start=pointer.current;if(start&&start.id===event.pointerId
   &&Math.hypot(start.x-event.clientX,start.y-event.clientY)>=8)setMoving(true);}}
  onPointerCancel={()=>{pointer.current=null;setMoving(false);}}
  onKeyDown={event=>{if(event.key==="Enter"||event.key===" "){
   event.preventDefault();event.stopPropagation();onKeyboard(sourceId);
  }}}
  className={"grid h-11 w-11 min-h-11 min-w-11 shrink-0 touch-none place-items-center rounded hover:bg-[var(--planner-hover)] focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)] "+
   (moving?"bg-[var(--planner-hover)] ring-2 ring-[var(--planner-accent)]":"")}>
   <Link2 size={16}/>
  </button>;
}
