"use client";
import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { pointerWithin, rectIntersection } from "@dnd-kit/core";
import { useCompactSchedule } from "./useCompactSchedule";
import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { CollectionScheduleDay } from "./CollectionScheduleDay";
import { CollectionRecordDetails } from "./CollectionRecordDetails";
import { createScheduledTask, moveSchedulePeriod, rescheduleTask, resizeScheduleRange, scheduleDays,
  scheduledTaskDay, type ScheduleMode } from "../collections/collectionSchedule";
import { localToday } from "../collections/collectionTasks";
import type { CollectionBlockPayload, CollectionRecord, CollectionView } from "../collections/model";
import { btnClass, inputClass } from "./CollectionFieldEditor";
interface Props { data: CollectionBlockPayload; view: CollectionView; rows: CollectionRecord[];
  month: string; setMonth: (value: string) => void; readOnly: boolean;
  onChange: (next: CollectionBlockPayload) => void; }
export function CollectionScheduleView({data,view,rows,month,setMonth,readOnly,onChange}:Props){
 const [mode,setMode]=useState<ScheduleMode>("month");
 const compact=useCompactSchedule();
 const [anchor,setAnchor]=useState(month+"-01");
 const [openId,setOpenId]=useState<string|null>(null);
 const today=localToday();
 const days=useMemo(()=>scheduleDays(anchor,mode),[anchor,mode]);
 const byDay=useMemo(()=>{
  const map=new Map<string,CollectionRecord[]>();
  for(const row of rows){const day=scheduledTaskDay(data,view,row);
   if(day)map.set(day,[...(map.get(day)??[]),row]);}
  return map;
 },[data,view,rows]);
 const sensors=useSensors(
  useSensor(PointerSensor,{activationConstraint:{distance:6}}),
  useSensor(TouchSensor,{activationConstraint:{delay:180,tolerance:6}}),
  useSensor(KeyboardSensor));
 const navigate=(value:string)=>{setAnchor(value);setMonth(value.slice(0,7));};
 const drop=({active,over}:DragEndEvent)=>{
  const task=String(active.id),target=String(over?.id??"");
  if(readOnly||!task.startsWith("schedule-task:")||!target.startsWith("schedule-day:"))return;
  const id=task.slice(14),day=target.slice(13);
  if(!rows.some(row=>row.id===id))return;
  const next=rescheduleTask(data,view,id,day);
  if(next!==data)onChange(next);
 };
 const resize=(id:string,edge:"start"|"end",day:string)=>{
  if(readOnly)return;
  const next=resizeScheduleRange(data,view,id,edge,day);
  if(next!==data)onChange(next);
 };
 const create=(day:string,title:string)=>{
  if(readOnly)return;const next=createScheduledTask(data,view,day,title);
  if(next!==data)onChange(next);
 };
 const count=days.reduce((total,day)=>total+(byDay.get(day)?.length??0),0);
 return <div data-testid="collection-calendar" className="flex h-full min-w-0 flex-col gap-2 bg-[var(--planner-canvas)] text-[var(--planner-text)]">
  <header className="flex flex-wrap items-center gap-2 text-sm">
   <h2 className="mr-2 font-semibold">Schedule</h2>
   <button type="button" className={btnClass} aria-label="Previous calendar period"
     onClick={()=>navigate(moveSchedulePeriod(anchor,mode,-1))}>←</button>
   <strong data-testid="collection-calendar-period" className="min-w-32 text-center">
    {mode==="month"?anchor.slice(0,7):days[0]+" – "+days[days.length-1]}</strong>
   <button type="button" className={btnClass} aria-label="Next calendar period"
     onClick={()=>navigate(moveSchedulePeriod(anchor,mode,1))}>→</button>
   <button type="button" className={btnClass} onClick={()=>navigate(today)}>Today</button>
   <label className="ml-auto flex items-center gap-2">View
    <select aria-label="Schedule mode" className={inputClass} value={mode}
     onChange={e=>setMode(e.target.value as ScheduleMode)}>
     <option value="month">Month</option><option value="week">Week</option>
    </select></label>
   <input type="date" aria-label="Schedule selected day" className={inputClass}
    value={anchor} onChange={e=>e.target.value&&navigate(e.target.value)}/>
  </header>
  {!count&&<p role="status" className="rounded-lg border border-dashed border-[var(--planner-border)] p-4 text-sm text-[var(--planner-secondary)]">
   No tasks scheduled in this period. Click a day to add one.</p>}
  <div className="min-h-0 flex-1 overflow-auto pb-3">
   <DndContext sensors={sensors} collisionDetection={args => {
    const pointer=pointerWithin(args); return pointer.length ? pointer : rectIntersection(args);
   }} onDragEnd={drop}>
    {compact ? <div data-testid="collection-calendar-agenda" role="list"
       aria-label="Schedule agenda" className="flex min-w-0 flex-col gap-2">
       {days.filter(day => mode === "week" || day.startsWith(anchor.slice(0,7))).map(day =>
        <div role="listitem" key={day} className="min-w-0">
         <h3 className="mb-1 px-1 text-xs font-semibold text-[var(--planner-secondary)]">
           {format(parseISO(day),"EEE, d MMM yyyy")}
         </h3>
         <CollectionScheduleDay data={data} view={view} day={day} today={today} outside={false}
           rows={byDay.get(day)??[]} readOnly={readOnly} onCreate={create} onOpen={setOpenId} onResize={resize}/>
        </div>)}
      </div> : <div className="grid min-w-[700px] grid-cols-7 gap-1.5 text-xs" role="grid" aria-label="Task schedule">
       {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(name=>
         <strong key={name} className="pb-1 text-center text-[var(--planner-secondary)]">{name}</strong>)}
       {days.map(day=><CollectionScheduleDay key={day} data={data} view={view} day={day}
         today={today} outside={mode==="month"&&!day.startsWith(anchor.slice(0,7))}
         rows={byDay.get(day)??[]} readOnly={readOnly} onCreate={create} onOpen={setOpenId} onResize={resize}/>)}
      </div>}
   </DndContext>
  </div>
  <p className="text-xs text-[var(--planner-secondary)]">Drag a task to reschedule; drag Start/End handles to resize its range. Double-click a day to create.</p>
  {openId&&<CollectionRecordDetails data={data} recordId={openId} readOnly={readOnly}
    onChange={onChange} onClose={()=>setOpenId(null)}/>}
 </div>;
}
