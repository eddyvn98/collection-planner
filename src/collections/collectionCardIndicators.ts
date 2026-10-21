import type { CollectionBlockPayload, CollectionRecord } from "./model";
import { taskAssignees, taskDate, isTaskOverdue } from "./collectionTasks";
export interface CardIndicators {
 labels:number; priority:boolean; checklist:string|null;
 attachments:number; notes:boolean; comments:number; due:string; overdue:boolean; avatars:number;
}
export function cardIndicators(data:CollectionBlockPayload, record:CollectionRecord,
 today?:string):CardIndicators {
 const list=record.checklist??[];
 return {
  labels:(data.labels??[]).filter(l=>record.labelIds?.includes(l.id)).length,
  priority:["urgent","important"].includes(record.priority??""),
  checklist:list.length ? list.filter(x=>x.done).length+"/"+list.length : null,
  attachments:record.attachments?.length??0,
  notes:!!record.body?.trim(),
  comments:record.comments?.length??0,
  due:taskDate(data,record,"due"),
  overdue:isTaskOverdue(data,record,today),
  avatars:taskAssignees(data,record).length,
 };
}
