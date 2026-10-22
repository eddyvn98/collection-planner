import type { CollectionBlockPayload } from "./model";
import type { TaskFilterState } from "./collectionPlannerFilters";
export type PlannerFilterKey = keyof TaskFilterState;
export interface PlannerChip { key: PlannerFilterKey; label: string }
export function activePlannerChips(data: CollectionBlockPayload, filters: TaskFilterState): PlannerChip[] {
 const lookup = (name: "people"|"labels", id: string) =>
   (data[name] ?? []).find(item=>item.id===id)?.name ?? id;
 return ([
  ["keyword", filters.keyword.trim(), filters.keyword.trim() ? 'Search: "'+filters.keyword.trim()+'"' : ""],
  ["due", filters.due==="all"?"":filters.due, "Due: "+filters.due],
  ["bucket", filters.bucket, "Bucket: "+(filters.bucket==="__unassigned__"?"Unassigned":filters.bucket)],
  ["label", filters.label, "Label: "+lookup("labels",filters.label)],
  ["assignee", filters.assignee, "Assigned: "+(filters.assignee==="__unassigned__"?"Unassigned":lookup("people",filters.assignee))],
  ["progress", filters.progress??"", "Progress: "+(filters.progress??"").replaceAll("_"," ")],
  ["priority", filters.priority, "Priority: "+(filters.priority?filters.priority[0].toUpperCase()+filters.priority.slice(1):"")],
 ] as const).filter((entry)=>!!entry[1]).map(([key,,label])=>({key,label}));
}
export function clearPlannerChip(filters:TaskFilterState,key:PlannerFilterKey): TaskFilterState {
 return {...filters,[key]:key==="due"?"all":""};
}
export function resolveMyTasksId(data:CollectionBlockPayload, stored:string|null): string {
 if(stored && data.people?.some(p=>p.id===stored)) return stored;
 return data.people?.find(p=>/^(me|you)$/i.test(p.name.trim()))?.id??"";
}
