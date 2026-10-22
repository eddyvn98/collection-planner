import type {CollectionBlockPayload,CollectionRecord} from "../collections/model";
import {recordTitle} from "../collections/model";
import {dayNumber} from "./collectionTimelineActions";
interface Props{data:CollectionBlockPayload;rows:CollectionRecord[];from:string;pixels:number;
 width:number;startId:string;dueId:string;readOnly:boolean;onRemove:(taskId:string,predecessorId:string)=>void}
export function CollectionTimelineWires({data,rows,from,pixels,width,startId,dueId,readOnly,onRemove}:Props){
 const rowPositions=new Map(rows.map((record,index)=>[record.id,index*48+24]));
 const records=new Map(data.records.map(record=>[record.id,record]));
 const links=rows.flatMap(record=>(record.dependsOn??[]).flatMap(dep=>{
  const predecessor=records.get(dep),y1=rowPositions.get(dep),y2=rowPositions.get(record.id);
  if(!predecessor||y1===undefined||y2===undefined)return [];
  const predecessorEnd=predecessor.values[dueId??""]||predecessor.values[startId??""]||"";
  const successorStart=record.values[startId??""]||"";
  const a=dayNumber(predecessorEnd),b=dayNumber(successorStart),baseline=dayNumber(from);
  if(!Number.isFinite(a)||!Number.isFinite(b))return [];
  return [{dep,taskId:record.id,y1,y2,x1:Math.max(0,Math.min(width,(a-baseline+1)*pixels)),
   x2:Math.max(0,Math.min(width,(b-baseline)*pixels))}];
 }));
 return <svg data-testid="timeline-dependency-wires" aria-label="Task dependencies"
  className="pointer-events-none absolute left-[220px] top-0 z-[4] overflow-visible"
  width={width} height={rows.length*48} viewBox={`0 0 ${width} ${rows.length*48}`}>
  <defs><marker id="planner-timeline-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5"
    orient="auto"><path d="M0 0 L7 3.5 L0 7" fill="var(--planner-accent)"/></marker></defs>
  {links.map(link=>{
   const mid=link.x1+Math.max(14,(link.x2-link.x1)/2);
   const d=`M ${link.x1} ${link.y1} H ${mid} V ${link.y2} H ${link.x2}`;
   const predecessor=records.get(link.dep)!,successor=records.get(link.taskId)!;
   const label=recordTitle(data,predecessor)+" → "+recordTitle(data,successor);
   return <path key={link.taskId+":"+link.dep} d={d} fill="none" stroke="var(--planner-accent)"
     strokeWidth={2} strokeDasharray="4 2" markerEnd="url(#planner-timeline-arrow)"
     role="button" tabIndex={readOnly?-1:0} aria-label={"Remove timeline dependency "+label}
     style={{pointerEvents:readOnly?"none":"stroke",cursor:"pointer"}}
     onClick={()=>!readOnly&&onRemove(link.taskId,link.dep)}
     onKeyDown={event=>{if(!readOnly&&(event.key==="Enter"||event.key===" ")){
      event.preventDefault();onRemove(link.taskId,link.dep);
     }}}>
    <title>{label} · Click to remove dependency</title>
   </path>;
  })}
 </svg>;
}
