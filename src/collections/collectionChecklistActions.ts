import type { CollectionRecord } from "./model";
export type ChecklistEntry = NonNullable<CollectionRecord["checklist"]>[number];
export function checklistTotals(items:ChecklistEntry[]){
 const completed=items.filter(item=>item.done).length;
 return {completed,total:items.length,percentage:items.length?100*completed/items.length:0};
}
export function checklistToggle(items:ChecklistEntry[],id:string,done:boolean){
 if(!items.some(item=>item.id===id&&item.done!==done))return items;
 return items.map(item=>item.id===id?{...item,done}:item);
}
export function checklistReorder(items:ChecklistEntry[],fromId:string,toId:string){
 const from=items.findIndex(item=>item.id===fromId),to=items.findIndex(item=>item.id===toId);
 if(from<0||to<0||from===to)return items;
 const result=[...items];
 result.splice(to,0,result.splice(from,1)[0]);
 return result;
}
