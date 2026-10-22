import {localToday,taskDate} from "./collectionTasks";
import type {CollectionBlockPayload,CollectionRecord} from "./model";
export interface TaskReminder {id:string;due:string;kind:"overdue"|"today";record:CollectionRecord}
export function activeTaskReminders(data:CollectionBlockPayload,today=localToday(),dismissed:string[]=[]):TaskReminder[]{
 const hidden=new Set(dismissed);
 return data.records.flatMap(record=>{
  if(record.progress==="completed")return [];
  const due=taskDate(data,record,"due");
  if(!due||due>today||hidden.has(record.id+":"+due))return [];
  return [{id:record.id+":"+due,due,kind:due<today?"overdue":"today",record} as TaskReminder];
 }).sort((a,b)=>a.due.localeCompare(b.due));
}
export function loadDismissedReminders():string[]{
 try{const v=JSON.parse(localStorage.getItem("planner:reminders:dismissed")??"[]");
  return Array.isArray(v)?v.filter((x):x is string=>typeof x==="string").slice(-500):[];}catch{return [];}
}
