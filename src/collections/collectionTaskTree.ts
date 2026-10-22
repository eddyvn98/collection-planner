import type { CollectionBlockPayload, CollectionRecord, TaskProgress } from "./model";
import { relationIds, encodeRelationIds } from "./collectionRelations";

export const MAX_TASK_DEPTH = 6;
export const MAX_VISIBLE_TREE_NODES = 500;
export type TreeIndex = {
 byId: Map<string, CollectionRecord>;
 children: Map<string | null, CollectionRecord[]>;
 depth: Map<string, number>;
 order: CollectionRecord[];
};
/** O(n) build; invalid/orphan/cyclic links are treated as roots, never dropped. */
export function buildTaskTree(records: CollectionRecord[]): TreeIndex {
 const byId=new Map(records.map(record=>[record.id,record]));
 const children=new Map<string|null,CollectionRecord[]>();
 for(const record of records){
  const parent=record.parentId && byId.has(record.parentId) && record.parentId!==record.id
   ? record.parentId : null;
  const list=children.get(parent)??[];
  list.push(record);children.set(parent,list);
 }
 const depth=new Map<string,number>(),order:CollectionRecord[]=[];
 const walk=(root:CollectionRecord)=>{
  const stack=[{record:root,depth:1}];
  while(stack.length){
   const item=stack.pop()!;
   if(depth.has(item.record.id))continue;
   depth.set(item.record.id,item.depth);
   order.push(item.record);
   const kids=children.get(item.record.id)??[];
   for(let i=kids.length-1;i>=0;i--)stack.push({record:kids[i],depth:item.depth+1});
  }
 };
 for(const root of children.get(null)??[])walk(root);
 for(const row of records)if(!depth.has(row.id))walk(row);
 return {byId,children,depth,order};
}
export function taskBranch(tree:TreeIndex,id:string):CollectionRecord[] {
 const root=tree.byId.get(id);
 if(!root)return [];
 const result:CollectionRecord[]=[],seen=new Set<string>(),stack=[root];
 while(stack.length){
  const row=stack.pop()!;
  if(seen.has(row.id))continue;
  seen.add(row.id);result.push(row);
  const children=tree.children.get(row.id)??[];
  for(let i=children.length-1;i>=0;i--)stack.push(children[i]);
 }
 return result;
}
export function isTreeAncestor(tree:TreeIndex,ancestorId:string,recordId:string):boolean {
 const seen=new Set<string>();let id=tree.byId.get(recordId)?.parentId;
 while(id && !seen.has(id)){
  if(id===ancestorId)return true;
  seen.add(id);id=tree.byId.get(id)?.parentId;
 }
 return false;
}
/** A child may move only when its entire branch still fits under MAX_TASK_DEPTH. */
export function canSetTaskParent(records:CollectionRecord[],recordId:string,parentId:string|null):boolean {
 const tree=buildTaskTree(records),record=tree.byId.get(recordId);
 if(!record || parentId===recordId || (parentId&&!tree.byId.has(parentId)))return false;
 if(parentId && isTreeAncestor(tree,recordId,parentId))return false;
 const visited=new Set<string>();let cursor=parentId;
 while(cursor){
  if(visited.has(cursor)||!tree.byId.has(cursor))return false;
  visited.add(cursor);cursor=tree.byId.get(cursor)?.parentId??null;
 }
 const branch=taskBranch(tree,recordId), ids=new Set(branch.map(row=>row.id));
 const deepest=Math.max(1,...branch.map(row=>(tree.depth.get(row.id)??1)-(tree.depth.get(recordId)??1)+1));
 const destinationDepth=parentId ? tree.depth.get(parentId)??0 : 0;
 return ids.size>0 && destinationDepth+deepest<=MAX_TASK_DEPTH;
}
/** Repair legacy storage conservatively: keep every task; detach only invalid links. */
export function sanitizeTaskParents(records:CollectionRecord[]):CollectionRecord[] {
 const ids=new Set(records.map(row=>row.id));
 const links=new Map(records.map(row=>[row.id,row.parentId]));
 let changed=false;
 const next=records.map(row=>{
  const original=row.parentId;
  let cursor=original,depth=1,valid=true;
  const seen=new Set([row.id]);
  while(cursor){
   if(!ids.has(cursor)||seen.has(cursor)||++depth>MAX_TASK_DEPTH){valid=false;break;}
   seen.add(cursor);cursor=links.get(cursor);
  }
  if(!valid){changed=true;return {...row,parentId:null};}
  return row;
 });
 return changed?next:records;
}
/** Derived rule: leaf retains explicit progress; parent Completed iff ALL direct
 * children (recursively) complete, otherwise In progress. Reopening propagates up. */
export function reconcileTaskProgress(records:CollectionRecord[]):CollectionRecord[] {
 const tree=buildTaskTree(records);
 const progress=new Map<string,TaskProgress>();
 const updates=new Map<string,CollectionRecord>();
 for(let i=tree.order.length-1;i>=0;i--){
  const row=tree.order[i],kids=tree.children.get(row.id)??[];
  const value:TaskProgress=kids.length ?
   kids.every(child=>progress.get(child.id)==="completed")?"completed":"in_progress" :
   row.progress??"not_started";
  progress.set(row.id,value);
  if(kids.length && row.progress!==value)updates.set(row.id,{...row,progress:value});
 }
 return updates.size?records.map(row=>updates.get(row.id)??row):records;
}
/** O(n) rollup for badges and dashboards (includes every descendant, excludes self). */
export function descendantCounts(records:CollectionRecord[]):Map<string,{done:number;total:number}> {
 const tree=buildTaskTree(records),counts=new Map<string,{done:number;total:number}>();
 for(let i=tree.order.length-1;i>=0;i--){
  const row=tree.order[i];let done=0,total=0;
  for(const child of tree.children.get(row.id)??[]){
   const count=counts.get(child.id)??{done:0,total:0};
   done+=count.done+Number(child.progress==="completed");total+=count.total+1;
  }
  counts.set(row.id,{done,total});
 }
 return counts;
}
export function setTaskParent(data:CollectionBlockPayload,id:string,parentId:string|null):CollectionBlockPayload {
 const current=data.records.find(row=>row.id===id);
 if(!current || (current.parentId??null)===parentId || !canSetTaskParent(data.records,id,parentId))return data;
 return {...data,records:reconcileTaskProgress(data.records.map(row=>
  row.id===id?{...row,parentId}:row))};
}
/** Delete subtree or promote direct children to the deleted parent's level. */
export function removeTaskBranch(data:CollectionBlockPayload,id:string,mode:"subtree"|"promote"):CollectionBlockPayload {
 const tree=buildTaskTree(data.records),parent=tree.byId.get(id);
 if(!parent)return data;
 const deleted=new Set(mode==="subtree"?taskBranch(tree,id).map(row=>row.id):[id]);
 const relations=data.fields.filter(field=>field.type==="relation"&&!field.relationTargetBlockId);
 const records=data.records.filter(row=>!deleted.has(row.id)).map(row=>{
  const values={...row.values};
  for(const field of relations){
   const existing=relationIds(values[field.id]);
   if(existing.some(other=>deleted.has(other)))values[field.id]=encodeRelationIds(
    existing.filter(other=>!deleted.has(other)),!!field.relationMultiple);
  }
  return {...row,values,...(mode==="promote"&&row.parentId===id?{parentId:parent.parentId??null}:{})};
 });
 return {...data,records:reconcileTaskProgress(records.map(row=>{
  const dependsOn=row.dependsOn?.filter(dep=>!deleted.has(dep));
  return row.dependsOn?.length!==dependsOn?.length?{...row,dependsOn}:row;
 }))};
}
