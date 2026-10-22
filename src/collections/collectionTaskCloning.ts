import { buildTaskTree, taskBranch, reconcileTaskProgress } from "./collectionTaskTree";
import type { CollectionBlockPayload, CollectionRecord } from "./model";
import { newId } from "./model";

export type CloneBranchOptions = {
 rootValues?: Record<string,string>;
 rootTitle?: string;
 resetProgress?: boolean;
 /** Return shifted values, including dates, for a fresh occurrence. */
 mapValues?: (row:CollectionRecord)=>Record<string,string>;
};
/** Duplicate a branch with fresh stable IDs; remap internal dependencies.
 * External dependencies are dropped (legacy copy semantics). */
export function cloneTaskBranch(data:CollectionBlockPayload,id:string,
 options:CloneBranchOptions={}): CollectionBlockPayload {
 const branch=taskBranch(buildTaskTree(data.records),id);
 if(!branch.length)return data;
 const ids=new Map(branch.map(row=>[row.id,newId()]));
 const titleField=data.fields.find(field=>field.type==="text")?.id;
 const copies=branch.map((row,index):CollectionRecord=>{
  const values=options.mapValues?.(row)??{...row.values};
  if(index===0){
   Object.assign(values,options.rootValues??{});
   if(titleField&&options.rootTitle)values[titleField]=options.rootTitle;
  }
  return {...row,id:ids.get(row.id)!,values,parentId:index===0?(row.parentId??null):ids.get(row.parentId??"")??null,
   progress:options.resetProgress?"not_started":row.progress,
   boardOrder:(row.boardOrder??0)+(index===0?0.1:0),
   checklist:row.checklist?.map(item=>({...item,id:newId(),done:options.resetProgress?false:item.done})),
   attachments:row.attachments?.map(item=>({...item,id:newId()})),
   dependsOn:(row.dependsOn??[]).flatMap(dep=>ids.has(dep)?[ids.get(dep)!]:[]),
   comments:[],activity:[],...(options.resetProgress&&index>0?{recurrence:"none" as const}:{})};
 });
 const branchIds=new Set(branch.map(row=>row.id));
 const index=data.records.reduce((max,row,i)=>branchIds.has(row.id)?i>max?i:max:max,-1);
 // Original and clone trees are adjacent, preserving ordered traversal.
 return {...data,records:reconcileTaskProgress([...data.records.slice(0,index+1),...copies,
  ...data.records.slice(index+1)])};
}
