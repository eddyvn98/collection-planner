import {addRecord,recordTitle,type CollectionBlockPayload,type CollectionRecord} from "../collections/model";
import {buildTaskTree,taskBranch} from "../collections/collectionTaskTree";
import {addUtcDays} from "./collectionTimelineDates";
import {parseCalendarDay} from "./collectionCalendarDates";

export const DAY_MS=86_400_000;
export const dayNumber=(iso:string)=>{const day=parseCalendarDay(iso);return day?Math.floor(day.getTime()/DAY_MS):NaN;};
export type TimelineZoom="day"|"week"|"month";
export const TIMELINE_ZOOM:Record<TimelineZoom,{pixels:number,days:number}>={
 day:{pixels:28,days:60},week:{pixels:12,days:90},month:{pixels:5,days:180}
};
export function timelineWindow(anchor:string,zoom:TimelineZoom){
 const config=TIMELINE_ZOOM[zoom];
 return {from:anchor,days:config.days,to:addUtcDays(anchor,config.days-1)!,pixels:config.pixels};
}
/** Dates are always ISO civil days in UTC. A single commit updates a subtree.
 * External date fields and out-of-range end dates are preserved. */
export function moveTimelineBranch(data:CollectionBlockPayload,id:string,days:number,startId:string,endId?:string){
 if(!Number.isInteger(days)||!days)return data;
 const branch=new Set(taskBranch(buildTaskTree(data.records),id).map(row=>row.id));
 if(!branch.size)return data;
 let changed=false;
 const records=data.records.map(row=>{
  if(!branch.has(row.id))return row;
  const values={...row.values};
  for(const field of new Set([startId,endId].filter(Boolean))){
   const current=values[field!];if(!current)continue;
   const next=addUtcDays(current,days);
   if(next && next!==current){values[field!]=next;changed=true;}
  }
  return {...row,values};
 });
 return changed?{...data,records}:data;
}
export function resizeTimelineTask(data:CollectionBlockPayload,id:string,edge:"left"|"right",
 days:number,startId:string,endId:string){
 if(!Number.isInteger(days)||!days||startId===endId)return data;
 const target=data.records.find(row=>row.id===id);
 if(!target)return data;
 const start=target.values[startId],end=target.values[endId]||start;
 if(!start||!end)return data;
 const date=addUtcDays(edge==="left"?start:end,days);
 if(!date||(edge==="left"?date>end:date<start))return data;
 const field=edge==="left"?startId:endId;
 return {...data,records:data.records.map(row=>row.id===id
  ?{...row,values:{...row.values,[field]:date}}:row)};
}
export function makeTimelineTask(data:CollectionBlockPayload,startId:string,endId:string,
 start:string,end:string,title="New task"){
 if(!parseCalendarDay(start)||!parseCalendarDay(end)||end<start)return data;
 const name=data.fields.find(field=>field.type==="text")?.id;
 const values:Record<string,string>={[startId]:start};
 if(name)values[name]=title;
 if(endId!==startId)values[endId]=end;
 return addRecord(data,values);
}
/** Ordering uses boardOrder so other views can retain the same task order.
 * Moves the entire branch, with no mutation or loss of descendants. */
export function reorderTimelineBranch(data:CollectionBlockPayload,id:string,targetId:string){
 const tree=buildTaskTree(data.records),branch=taskBranch(tree,id);
 if(!branch.length||branch.some(row=>row.id===targetId))return data;
 const ids=new Set(branch.map(row=>row.id));
 const without=data.records.filter(row=>!ids.has(row.id));
 const index=without.findIndex(row=>row.id===targetId);
 if(index<0)return data;
 const ordered=[...without.slice(0,index),...branch,...without.slice(index)];
 return {...data,records:ordered.map((row,i)=>({...row,boardOrder:i}))};
}
export function timelineTooltip(data:CollectionBlockPayload,record:CollectionRecord,
 startId:string,endId:string,offset:number,right=0,left=0){
 const start=addUtcDays(record.values[startId],offset+left)??record.values[startId];
 const end=addUtcDays(record.values[endId]||record.values[startId],offset+right)??"";
 return recordTitle(data,record)+" · "+start+" → "+end;
}
