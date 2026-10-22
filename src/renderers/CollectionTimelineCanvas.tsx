import React,{useRef,useState} from "react";
import type {CollectionBlockPayload,CollectionRecord} from "../collections/model";
import {recordTitle} from "../collections/model";
import type {TimelineEntry} from "./collectionTimelineDates";
import {addUtcDays} from "./collectionTimelineDates";
import {dayNumber,type TimelineZoom,TIMELINE_ZOOM} from "./collectionTimelineActions";
import {CollectionGanttBar} from "./CollectionGanttBar";
import {CollectionBlockedBadge} from "./CollectionBlockedBadge";
import {CollectionTimelineWires} from "./CollectionTimelineWires";
interface Props{data:CollectionBlockPayload;entries:TimelineEntry[];from:string;days:number;
 zoom:TimelineZoom;readOnly:boolean;highlightedIds:Set<string>;
 startId:string;endId:string;
 onMove:(record:CollectionRecord,days:number)=>void;
 onResize:(record:CollectionRecord,edge:"left"|"right",days:number)=>void;
 onCreate:(from:string,to:string)=>void;
 onLink:(from:string,to:string)=>void;onRemove:(to:string,from:string)=>void;
 onReorder:(source:string,target:string)=>void}
const clamp=(n:number,min:number,max:number)=>Math.min(max,Math.max(min,n));
export function CollectionTimelineCanvas({data,entries,from,days,zoom,readOnly,highlightedIds,
 startId,endId,onMove,onResize,onCreate,onLink,onRemove,onReorder}:Props){
 const pixels=TIMELINE_ZOOM[zoom].pixels,span=days*pixels;
 const [blank,setBlank]=useState<{from:number;to:number}|null>(null);
 const drag=useRef<{id:number;from:number}|null>(null);
 const today=new Date().toISOString().slice(0,10),todayOffset=dayNumber(today)-dayNumber(from);
 const ticks=Array.from({length:days},(_,i)=>addUtcDays(from,i)!);
 const pointerDay=(event:React.PointerEvent<HTMLElement>)=>{
  const rect=event.currentTarget.getBoundingClientRect();
  return clamp(Math.floor((event.clientX-rect.left)/pixels),0,days-1);
 };
 const startBlank=(event:React.PointerEvent<HTMLDivElement>)=>{
  if(readOnly||(event.pointerType==="mouse"&&event.button!==0))return;
  const index=pointerDay(event);
  drag.current={id:event.pointerId,from:index};
  event.currentTarget.setPointerCapture(event.pointerId);
  setBlank({from:index,to:index});
 };
 const moveBlank=(event:React.PointerEvent<HTMLDivElement>)=>{
  if(drag.current?.id!==event.pointerId)return;
  setBlank({from:drag.current.from,to:pointerDay(event)});
 };
 const endBlank=(event:React.PointerEvent<HTMLDivElement>)=>{
  if(drag.current?.id!==event.pointerId)return;
  const a=drag.current.from,b=pointerDay(event);
  drag.current=null;setBlank(null);
  const min=Math.min(a,b),max=Math.max(a,b);
  onCreate(addUtcDays(from,min)!,addUtcDays(from,max)!);
 };
 return <div style={{minWidth:220+span}} data-testid="gantt-canvas">
  <div className="flex border-b border-[var(--planner-border)] bg-[var(--planner-hover)]">
   <div className="sticky left-0 z-[9] w-[220px] shrink-0 border-r border-[var(--planner-border)] bg-[var(--planner-hover)] p-2 font-semibold">Task</div>
   <div className="relative h-10" style={{width:span}}>
    {ticks.map((day,index)=>{
     const monday=new Date(day+"T12:00:00Z").getUTCDay()===1;
     const first=day.slice(8)==="01";
     const show=zoom==="day"?index%3===0:zoom==="week"?monday:first;
     return <div key={day} data-date={day} data-testid="collection-timeline-tick"
      className={"absolute top-0 h-full "+(monday||first?"border-l border-[var(--planner-border)]":"")}
      style={{left:index*pixels,width:pixels}}>
      {show&&<span className="block whitespace-nowrap text-[10px] tabular-nums" aria-label={"Ruler date "+day}>{zoom==="month"?day.slice(0,7):day.slice(5).replace("-","/")}</span>}
     </div>;
    })}
    {todayOffset>=0&&todayOffset<days&&<div aria-label="Today" title="Today"
     className="pointer-events-none absolute top-0 z-10 h-full border-l-2 border-rose-500"
     style={{left:todayOffset*pixels}}/>}
   </div>
  </div>
  <div className="relative" data-testid="timeline-task-lanes">
   {entries.map(({record,start,end,length})=>{
    const index=dayNumber(start)-dayNumber(from);
    const shownFrom=Math.max(0,index),shownTo=Math.min(days,index+length);
    const visible=shownFrom<shownTo;
    return <div key={record.id} data-testid="collection-timeline-row" data-record-id={record.id}
      data-timeline-task-id={record.id} className="flex h-12 items-center border-b border-[var(--planner-border)]">
     <div className="sticky left-0 z-[6] flex h-12 w-[220px] shrink-0 items-center gap-1 border-r border-[var(--planner-border)] bg-[var(--planner-surface)] px-2 text-xs"
       title={recordTitle(data,record)}>
      <span className="min-w-0 flex-1 truncate">{recordTitle(data,record)}</span>
      <CollectionBlockedBadge data={data} record={record} compact/>
     </div>
     <div className="relative h-11" style={{width:span}}>
      {visible&&<CollectionGanttBar left={shownFrom*pixels} width={(shownTo-shownFrom)*pixels}
       pixelsPerDay={pixels} durationDays={length} label={recordTitle(data,record)}
       recordId={record.id} startDate={start} endDate={end} disabled={readOnly}
       highlighted={highlightedIds.has(record.id)}
       onMove={amount=>onMove(record,amount)}
       onResize={(amount,edge)=>onResize(record,edge??"right",amount)}
       onLinkDrop={to=>onLink(record.id,to)}
       onVerticalMove={target=>onReorder(record.id,target)}/>}
     </div>
    </div>;
   })}
   <CollectionTimelineWires data={data} rows={entries.map(item=>item.record)} from={from}
      pixels={pixels} width={span} readOnly={readOnly} onRemove={onRemove}/>
  </div>
  {!readOnly&&<div className="flex h-12 items-stretch border-b border-[var(--planner-border)]" data-testid="timeline-blank-row">
   <div className="sticky left-0 z-[5] flex w-[220px] shrink-0 items-center border-r border-[var(--planner-border)] bg-[var(--planner-surface)] px-2 text-xs text-[var(--planner-secondary)]">+ Drag to create task</div>
   <div className="relative h-12 cursor-crosshair touch-none" aria-label="Drag empty timeline to create task"
    role="group" style={{width:span}}
    onPointerDown={startBlank} onPointerMove={moveBlank} onPointerUp={endBlank}
    onPointerCancel={()=>{drag.current=null;setBlank(null);}}>
    {blank&&<div data-testid="gantt-create-preview" className="pointer-events-none absolute top-2 h-7 rounded border-2 border-[var(--planner-accent)] bg-[var(--planner-accent)]/20"
      style={{left:Math.min(blank.from,blank.to)*pixels,width:(Math.abs(blank.to-blank.from)+1)*pixels}}>
      <span className="absolute -top-7 left-0 whitespace-nowrap rounded bg-[var(--planner-surface)] px-1 text-[10px]">{addUtcDays(from,Math.min(blank.from,blank.to))} → {addUtcDays(from,Math.max(blank.from,blank.to))}</span>
     </div>}
   </div>
  </div>}
 </div>;
}
