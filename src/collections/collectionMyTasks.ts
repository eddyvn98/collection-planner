import {taskDate,localToday} from "./collectionTasks";
import type {CollectionBlockPayload,CollectionRecord} from "./model";
export type MyTaskGroup="Overdue"|"Today"|"This week"|"Later"|"No date";
export const MY_TASK_GROUPS:MyTaskGroup[]=["Overdue","Today","This week","Later","No date"];
function weekEnd(date:string){
 const d=new Date(date+"T12:00:00Z");const weekday=d.getUTCDay();
 d.setUTCDate(d.getUTCDate()+((7-weekday)%7));return d.toISOString().slice(0,10);
}
export function groupAssignedTasks(data:CollectionBlockPayload,personId:string,today=localToday()):
 Record<MyTaskGroup,CollectionRecord[]> {
 const grouped:Record<MyTaskGroup,CollectionRecord[]>={Overdue:[],Today:[],"This week":[],Later:[],"No date":[]};
 for(const record of data.records){
  if(!record.assigneeIds?.includes(personId)||record.progress==="completed")continue;
  const due=taskDate(data,record,"due");
  const key:MyTaskGroup=!due?"No date":due<today?"Overdue":due===today?"Today":
   due<=weekEnd(today)?"This week":"Later";
  grouped[key].push(record);
 }
 for(const list of Object.values(grouped))list.sort((a,b)=>taskDate(data,a,"due").localeCompare(taskDate(data,b,"due")));
 return grouped;
}
