"use client";
import {useMemo,useRef,useState} from "react";
import type {CollectionBlockPayload,CollectionField,CollectionRecord} from "../collections/model";
import {recordTitle} from "../collections/model";
import {FieldEditor,btnClass,hintClass} from "./CollectionFieldEditor";
import {addUtcDays,timelineLayout} from "./collectionTimelineDates";
import {CollectionTimelineCanvas} from "./CollectionTimelineCanvas";
import {CollectionInlineHistory,type CollectionInlineHistoryProps} from "./CollectionInlineHistory";
import {useTimelineGestures} from "./useTimelineGestures";
import {collectionTablePage} from "./collectionTablePaging";
import {availableCollectionDependencies,longestCollectionDependencyChain,
 scheduleCollectionDependencies,setCollectionDependencies} from "../collections/collectionDependencies";
import {dayNumber,TIMELINE_ZOOM,moveTimelineBranch,resizeTimelineTask,
 makeTimelineTask,reorderTimelineBranch,type TimelineZoom} from "./collectionTimelineActions";

interface Props{rows:CollectionRecord[];data:CollectionBlockPayload;start?:CollectionField;
 end?:CollectionField;readOnly:boolean;onChange:(next:CollectionBlockPayload)=>void;
 patch:(r:CollectionRecord,f:CollectionField,v:string)=>void;history?:CollectionInlineHistoryProps;}
const zooms:TimelineZoom[]=["day","week","month"];
export function TimelineView({rows,data,start,end,readOnly,onChange,patch,history}:Props){
 const [scale,setScale]=useState<TimelineZoom>("day");
 const [requestedPage,setRequestedPage]=useState(0);
 const [highlightChain,setHighlightChain]=useState(false);
 const [feedback,setFeedback]=useState("");
 const timelineScroll=useRef<HTMLDivElement>(null);
 const view=useMemo(()=>timelineLayout(rows,start?.id,end?.id),[rows,start?.id,end?.id]);
 // The axis anchor is deliberately independent of task dates. Date mutations
 // never re-anchor the viewport; Today and range arrows explicitly do.
 const [anchor,setAnchor]=useState(()=>timelineLayout(rows,start?.id,end?.id).from);
 const config=TIMELINE_ZOOM[scale],windowStart=anchor;
 const windowEnd=addUtcDays(anchor,config.days-1)??anchor;
 const page=useMemo(()=>collectionTablePage(view.entries,requestedPage,100),
  [view.entries,requestedPage]);
 const today=new Date().toISOString().slice(0,10);
 const longest=useMemo(()=>longestCollectionDependencyChain(data,start?.id,end?.id),
  [data,start?.id,end?.id]);
 const highlightedIds=new Set(highlightChain?longest.ids:[]);
 const shiftRange=(days:number)=>{const next=addUtcDays(anchor,days);if(next)setAnchor(next);};
 const jumpToday=()=>{setAnchor(addUtcDays(today,-Math.floor(config.days/2))??today);};
 const selectZoom=(next:TimelineZoom)=>{
  if(next===scale)return;
  const center=addUtcDays(anchor,Math.floor(config.days/2))??anchor;
  setAnchor(addUtcDays(center,-Math.floor(TIMELINE_ZOOM[next].days/2))??anchor);
  setScale(next);
 };
 const changeZoom=(step:-1|1)=>selectZoom(zooms[Math.min(2,Math.max(0,zooms.indexOf(scale)+step))]);
 useTimelineGestures(timelineScroll,changeZoom);
 const changeDates=(record:CollectionRecord,amount:number)=>{
  if(!start||readOnly)return;
  const next=moveTimelineBranch(data,record.id,amount,start.id,end?.id);
  if(next!==data){setFeedback("");onChange(next);}
 };
 const resize=(record:CollectionRecord,edge:"left"|"right",amount:number)=>{
  if(readOnly||!start||!end)return;
  const next=resizeTimelineTask(data,record.id,edge,amount,start.id,end.id);
  if(next!==data){setFeedback("");onChange(next);}
 };
 const link=(from:string,to:string)=>{
  if(readOnly)return;
  const target=data.records.find(row=>row.id===to);
  if(!target)return;
  const next=setCollectionDependencies(data,to,[...(target.dependsOn??[]),from]);
  if(next===data)setFeedback("Cannot link tasks: duplicate, cycle or ancestor/descendant dependency.");
  else{setFeedback("");onChange(next);}
 };
 const unlink=(to:string,from:string)=>{
  const row=data.records.find(item=>item.id===to);
  if(!row||readOnly)return;
  const next=setCollectionDependencies(data,to,(row.dependsOn??[]).filter(id=>id!==from));
  if(next!==data)onChange(next);
 };
 const outside=view.entries.filter(item=>dayNumber(item.end)<dayNumber(anchor)||
   dayNumber(item.start)>dayNumber(windowEnd)).length;
 return <div className="space-y-3 text-xs" data-testid="collection-timeline">
  {!start&&<p className="text-amber-600">Add a date field for Timeline.</p>}
  <div className="flex flex-wrap items-center gap-2 rounded-md bg-[var(--planner-surface)] px-2 py-1.5">
   <strong className="tabular-nums text-[var(--planner-text)]">{windowStart} – {windowEnd}</strong>
   {history&&<CollectionInlineHistory {...history}/>}
   <button className={btnClass} type="button" onClick={jumpToday}>Today</button>
   <button className={btnClass} type="button" aria-label="Show previous 30 days"
    onClick={()=>shiftRange(-30)}>← 30d</button>
   <button className={btnClass} type="button" aria-label="Show next 30 days"
    onClick={()=>shiftRange(30)}>30d →</button>
   <label>Ruler <select className="rounded border border-[var(--planner-border)] bg-[var(--planner-surface)] p-1.5"
    aria-label="Timeline ruler" value={scale}
    onChange={event=>selectZoom(event.target.value as TimelineZoom)}>
    <option value="day">Days</option><option value="week">Weeks</option><option value="month">Months</option>
   </select></label>
   <button type="button" className={btnClass} aria-label="Zoom in timeline"
    disabled={scale==="day"} onClick={()=>changeZoom(-1)}>＋</button>
   <button type="button" className={btnClass} aria-label="Zoom out timeline"
    disabled={scale==="month"} onClick={()=>changeZoom(1)}>－</button>
   <button className={btnClass} type="button" disabled={readOnly||!start}
    onClick={()=>onChange(scheduleCollectionDependencies(data,start?.id,end?.id))}>Schedule dependencies</button>
   <label className="flex items-center gap-1"><input type="checkbox" checked={highlightChain}
    onChange={event=>setHighlightChain(event.target.checked)}/>
    Longest chain ({longest.days} task-days)</label>
   {view.undated>0&&<span className={hintClass}>{view.undated} undated tasks</span>}
   {outside>0&&<span className={hintClass}>{outside} outside range</span>}
  </div>
  <p className="text-[11px] text-[var(--planner-secondary)]">Drag to move · drag left/right edges to resize · Shift+drag snaps by week ·
    drag a link icon to another task · Ctrl+wheel/pinch to zoom · arrows to move, Shift+arrows to resize</p>
  {feedback&&<p role="alert" className="text-amber-600">{feedback}</p>}
  <nav aria-label="Collection Timeline pagination" className="flex items-center gap-2">
   <span data-testid="collection-timeline-page-summary">
    {page.total?page.start+1:0}–{page.end} of {page.total} scheduled records</span>
   <button type="button" className={btnClass} aria-label="Previous timeline page"
    disabled={page.pageIndex===0} onClick={()=>setRequestedPage(page.pageIndex-1)}>Previous</button>
   <span data-testid="collection-timeline-page-number">Page {page.pageIndex+1} of {page.pageCount}</span>
   <button type="button" className={btnClass} aria-label="Next timeline page"
    disabled={page.pageIndex>=page.pageCount-1} onClick={()=>setRequestedPage(page.pageIndex+1)}>Next</button>
  </nav>
  {page.total===0&&<p role="status" className="rounded border border-dashed border-[var(--planner-border)] p-3">
   Nothing scheduled in this timeline. Drag in the empty lane below to create your first task.
  </p>}
  <div ref={timelineScroll} data-testid="collection-timeline-scroll"
   className="max-w-full overflow-x-auto rounded-md border border-[var(--planner-border)] bg-[var(--planner-surface)]">
   <CollectionTimelineCanvas data={data} entries={page.rows} from={anchor} days={config.days}
    zoom={scale} readOnly={readOnly} highlightedIds={highlightedIds}
    startId={start?.id??""} endId={end?.id??start?.id??""}
    onMove={changeDates} onResize={resize}
    onCreate={(from,to)=>{if(start&&!readOnly)onChange(makeTimelineTask(data,start.id,end?.id??start.id,from,to));}}
    onLink={link} onRemove={unlink}
    onReorder={(source,target)=>{const next=reorderTimelineBranch(data,source,target);if(next!==data)onChange(next);}}/>
  </div>
    <div className="space-y-2">
      {page.rows.map(({ record }) => <details key={record.id}
        className="group rounded-lg border border-[var(--planner-border)] bg-[var(--planner-surface)] dark:border-[var(--planner-border)] dark:bg-[var(--planner-surface)]" data-testid="collection-timeline-edit">
        <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 px-3 py-2 text-xs hover:bg-[var(--planner-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-[var(--planner-surface)]">
          <strong className="min-w-0 flex-1 truncate">{recordTitle(data, record)}</strong>
          <span className="tabular-nums text-[var(--planner-secondary)]">{record.values[start?.id ?? ""] || "No start"}{end && end.id !== start?.id && record.values[end.id] ? ` → ${record.values[end.id]}` : ""}</span>
          <span className="text-[var(--planner-secondary)] group-open:hidden">Edit schedule</span>
          <span className="hidden text-[var(--planner-secondary)] group-open:inline">Close</span>
        </summary>
        <div className="flex flex-wrap items-center gap-2 border-t border-[var(--planner-border)] px-3 py-2 dark:border-[var(--planner-border)]">
        {start && <FieldEditor field={start} value={record.values[start.id] ?? ""}
          readOnly={readOnly} onSet={value => patch(record, start, value)} />}
        {end && end.id !== start?.id && <FieldEditor field={end} value={record.values[end.id] ?? ""}
          readOnly={readOnly} onSet={value => patch(record, end, value)} />}
        <label>Depends on
          <select className="ml-1 max-w-44 rounded border bg-transparent p-1"
            aria-label={"Add dependency for " + recordTitle(data, record)}
            value="" disabled={readOnly || (record.dependsOn ?? []).length >= 20}
            onChange={event => {
              const dependency = event.target.value;
              if (!dependency) return;
              const next = setCollectionDependencies(data, record.id,
                [...(record.dependsOn ?? []), dependency]);
              if (next === data) window.alert("That dependency would create a cycle or is invalid.");
              else onChange(next);
            }}>
            <option value="">+ Predecessor</option>
            {availableCollectionDependencies(data,record)
              .map(item => <option key={item.id} value={item.id}>{recordTitle(data, item)}</option>)}
          </select>
        </label>
        {(record.dependsOn ?? []).map(id => <button key={id} type="button" className={btnClass}
          disabled={readOnly} title="Remove dependency"
          aria-label={"Remove dependency " + (data.records.find(item => item.id === id)
            ? recordTitle(data, data.records.find(item => item.id === id)!) : id)}
          onClick={() => onChange(setCollectionDependencies(data, record.id,
            (record.dependsOn ?? []).filter(item => item !== id)))}>
          {data.records.find(item => item.id === id)
            ? recordTitle(data, data.records.find(item => item.id === id)!) : "Missing task"} ×
        </button>)}
        <button className={btnClass} disabled={readOnly || !start}
          aria-label={"Move " + recordTitle(data, record) + " backward one day"}
          onClick={() => changeDates(record, -1)}>← 1d</button>
        <button className={btnClass} disabled={readOnly || !start}
          aria-label={"Move " + recordTitle(data, record) + " forward one day"}
          onClick={() => changeDates(record, 1)}>1d →</button>
        <button className={btnClass} disabled={readOnly || !end || end.id === start?.id}
          aria-label={"Extend " + recordTitle(data, record) + " by one day"}
          onClick={() => resize(record, "right", 1)}>+ Duration</button>
        <button className={btnClass} disabled={readOnly || !end || end.id === start?.id}
          aria-label={"Shorten " + recordTitle(data, record) + " by one day"}
          onClick={() => resize(record, "right", -1)}>− Duration</button>
        </div>
      </details>)}
    </div>
  </div>;
}
