import {recordTitle,type CollectionBlockPayload,type CollectionRecord} from "./model";
export function matchesTaskSearch(data:CollectionBlockPayload,record:CollectionRecord,search:string):boolean {
 const query=search.trim().toLocaleLowerCase();
 if(!query)return true;
 const labels=(data.labels??[]).filter(x=>record.labelIds?.includes(x.id)).map(x=>x.name);
 const people=(data.people??[]).filter(x=>record.assigneeIds?.includes(x.id)).map(x=>x.name);
 return [recordTitle(data,record),record.body??"",...Object.values(record.values),
  ...labels,...people].some(value=>value.toLocaleLowerCase().includes(query));
}
