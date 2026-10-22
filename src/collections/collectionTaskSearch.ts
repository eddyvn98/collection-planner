import {recordTitle,type CollectionBlockPayload,type CollectionRecord} from "./model";
import { buildTaskTree, taskBranch } from "./collectionTaskTree";
export function matchesTaskSearch(data:CollectionBlockPayload,record:CollectionRecord,search:string):boolean {
 const query=search.trim().toLocaleLowerCase();
 if(!query)return true;
 const labels=(data.labels??[]).filter(x=>record.labelIds?.includes(x.id)).map(x=>x.name);
 const people=(data.people??[]).filter(x=>record.assigneeIds?.includes(x.id)).map(x=>x.name);
 return [recordTitle(data,record),record.body??"",...Object.values(record.values),
  ...labels,...people].some(value=>value.toLocaleLowerCase().includes(query));
}

/** Include the ancestor path when a descendant matches; data rows remain unchanged. */
export function searchTaskTree(data:CollectionBlockPayload,search:string):Set<string> {
 const tree=buildTaskTree(data.records),found=new Set<string>();
 for(const row of data.records){
  if(!matchesTaskSearch(data,row,search))continue;
  found.add(row.id);
  let parent=row.parentId;
  while(parent&&!found.has(parent)){
   found.add(parent);parent=tree.byId.get(parent)?.parentId;
  }
 }
 return found;
}
