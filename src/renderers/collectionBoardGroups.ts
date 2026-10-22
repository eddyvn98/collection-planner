import { buildTaskTree, taskBranch, reconcileTaskProgress } from "../collections/collectionTaskTree";
import { completeRecurringTask } from "../collections/collectionRecurrence";
import { setRecordValue, type CollectionBlockPayload, type CollectionField,
 type CollectionRecord, type CollectionView, type TaskPriority, type TaskProgress } from "../collections/model";
import { PRIORITIES, PROGRESS, createBoardTask, localToday, setTaskDate, taskDate, updateTask } from "../collections/collectionTasks";
import { bucketOptions, moveBoardCard, orderedCards } from "./collectionBoardActions";
export type BoardGroupBy = NonNullable<CollectionView["boardGroupBy"]>;
export interface BoardGroup { key: string; title: string; rows: CollectionRecord[] }
export function splitBucketCompletion(rows:CollectionRecord[]){
 return { active:rows.filter(row=>row.progress!=="completed"),
  completed:rows.filter(row=>row.progress==="completed") };
}
export const BOARD_MODES: { value: BoardGroupBy; label: string }[] = [
 {value:"bucket",label:"Bucket"},{value:"progress",label:"Progress"},{value:"priority",label:"Priority"},
 {value:"assignee",label:"Assignee"},{value:"label",label:"Label"},{value:"due",label:"Due date"},
];
const groupName = (record: CollectionRecord, field?: CollectionField) => record.values[field?.id ?? ""] ?? "";
const addDays = (date: string, count: number) => {
 const d = new Date(date+"T12:00:00Z"); d.setUTCDate(d.getUTCDate()+count);
 return d.toISOString().slice(0,10);
};
/** A missing bucket renders in the first configured bucket instead of an extra column. */
export function displayBucket(value:string, options:string[]):string {
 return value || options[0] || "";
}
export function taskGroupKeys(data: CollectionBlockPayload, record: CollectionRecord,
 mode: BoardGroupBy, field?: CollectionField, today = localToday()): string[] {
 if(mode==="bucket") return ["bucket:"+displayBucket(groupName(record,field),field?.options??[])];
 if(mode==="progress") return ["progress:"+(record.progress??"not_started")];
 if(mode==="priority") return ["priority:"+(record.priority??"medium")];
 if(mode==="assignee") return record.assigneeIds?.length ? record.assigneeIds.map(id=>"assignee:"+id) : ["assignee:"];
 if(mode==="label") return record.labelIds?.length ? record.labelIds.map(id=>"label:"+id) : ["label:"];
 const due=taskDate(data,record,"due");
 if(!due) return ["due:none"];
 if(due<today) return ["due:late"];
 if(due===today) return ["due:today"];
 return [due<=addDays(today,7)?"due:soon":"due:later"];
}
export function boardGroups(data: CollectionBlockPayload, rows: CollectionRecord[],
 mode: BoardGroupBy, field?: CollectionField, today=localToday()): BoardGroup[] {
 const definitions: {key:string;title:string}[] = mode==="bucket"
   ? (bucketOptions(data,field?.id??"").length ? bucketOptions(data,field?.id??"").map(name=>({key:"bucket:"+name,title:name})) : [{key:"bucket:",title:"To do"}])
 : mode==="progress" ? PROGRESS.map(p=>({key:"progress:"+p.value,title:p.label}))
 : mode==="priority" ? PRIORITIES.map(p=>({key:"priority:"+p.value,title:p.label}))
 : mode==="assignee" ? [{key:"assignee:",title:"Unassigned"},...(data.people??[]).map(p=>({key:"assignee:"+p.id,title:p.name}))]
 : mode==="label" ? [{key:"label:",title:"No label"},...(data.labels??[]).map(l=>({key:"label:"+l.id,title:l.name}))]
 : [{key:"due:late",title:"Overdue"},{key:"due:today",title:"Today"},
    {key:"due:soon",title:"Next 7 days"},{key:"due:later",title:"Later"},{key:"due:none",title:"No due date"}];
 const keys=new Map(rows.map(r=>[r.id,taskGroupKeys(data,r,mode,field,today)]));
 return definitions.map(({key,title})=>({key,title,
  rows:orderedCards(data,rows.filter(r=>keys.get(r.id)?.includes(key)))}));
}
export const cardDragId = (id: string, key: string) => "task:"+JSON.stringify([id,key]);
export function parseCardDragId(id: string): [string,string] | null {
 if(!id.startsWith("task:"))return null;
 try {const value:unknown=JSON.parse(id.slice(5));
  return Array.isArray(value)&&value.length===2&&value.every(x=>typeof x==="string") ? [value[0],value[1]] : null;
 }catch{return null;}
}
export function setTaskProgress(data:CollectionBlockPayload,recordId:string,progress:TaskProgress) {
 if(!PROGRESS.some(p=>p.value===progress))return data;
 const previous=data.records.find(row=>row.id===recordId);
 if(!previous)return data;
 const branch=taskBranch(buildTaskTree(data.records),recordId);
 const ids=new Set(branch.map(row=>row.id));
 const status=data.fields.find(f=>f.type==="select"&&/^(status|progress)$/i.test(f.name.trim()));
 const nextStatus=progress==="completed"?"Done":progress==="in_progress"?"In progress":"To do";
 // Explicitly changing a parent applies to its descendants; rolling up then ensures
 // no parent reports Completed with unfinished children.
 const records=reconcileTaskProgress(data.records.map(row=>{
  if(!ids.has(row.id))return row;
  return {...row,progress,...(status?.options?.includes(nextStatus)
   ?{values:{...row.values,[status.id]:nextStatus}}:{})};
 }));
 const next=records.every((row,i)=>row===data.records[i])?data:{...data,records};
 return progress==="completed" && previous.progress!=="completed"
  ? completeRecurringTask(next,previous):next;
}

export function moveGroupedTask(data: CollectionBlockPayload, id: string, from: string, to: string,
 mode: BoardGroupBy, field?: CollectionField, beforeId?: string, readOnly=false,
 today=localToday()): CollectionBlockPayload {
 if(readOnly||!data.records.some(r=>r.id===id))return data;
 const valid=boardGroups(data,data.records,mode,field,today).some(g=>g.key===to);
 if(!valid||!to.startsWith(mode+":"))return data;
 if(mode==="bucket")return moveBoardCard(data,id,field?.id,to.slice(7),beforeId,readOnly);
 const r=data.records.find(row=>row.id===id)!;
 const target=to.slice(mode.length+1),source=from.startsWith(mode+":")?from.slice(mode.length+1):"";
 let next=data;
 if(mode==="progress")next=setTaskProgress(next,id,target as TaskProgress);
 if(mode==="priority")next=updateTask(next,id,{priority:target as TaskPriority},"Changed priority");
 if(mode==="assignee"||mode==="label"){
  const prop=mode==="assignee"?"assigneeIds":"labelIds";
  const ids=(r[prop]??[]).filter(value=>value!==source&&value!==target);
  next=updateTask(next,id,{[prop]:target?[...ids,target]:[]},"Changed "+mode);
 }
 if(mode==="due"){
  const date=target==="none"?"":target==="late"?addDays(today,-1):target==="today"?today:
   target==="soon"?addDays(today,3):addDays(today,14);
  next=setTaskDate(next,id,"due",date);
 }
 // Reindex only destination cards. Unrelated records keep their existing order.
 const group=boardGroups(next,next.records,mode,field,today).find(g=>g.key===to);
 if(!group)return next;
 const destination=group.rows.filter(row=>row.id!==id);
 const at=destination.findIndex(row=>row.id===beforeId);
 destination.splice(at<0?destination.length:at,0,next.records.find(row=>row.id===id)!);
 if(from===to&&group.rows.map(row=>row.id).join()===destination.map(row=>row.id).join())return data;
 for(let i=0;i<destination.length;i++)next=updateTask(next,destination[i].id,{boardOrder:i});
 return next;
}
export function createGroupedTask(data:CollectionBlockPayload,title:string,key:string,
 mode:BoardGroupBy,field?:CollectionField,today=localToday()):CollectionBlockPayload{
 let next=createBoardTask(data,title,mode==="bucket"?field?.id:undefined,mode==="bucket"?displayBucket(key.slice(7),field?.options??[]):"");
 if(next===data)return data;
 const record=next.records[next.records.length-1];
 if(mode!=="bucket")next=moveGroupedTask(next,record.id,"",key,mode,field,undefined,false,today);
 return next;
}
