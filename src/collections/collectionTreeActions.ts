import {newId,primaryField,recordTitle,type CollectionBlockPayload,
 type CollectionRecord} from "./model";
import {buildTaskTree,taskBranch,setTaskParent,reconcileTaskProgress,
 MAX_VISIBLE_TREE_NODES,MAX_TASK_DEPTH} from "./collectionTaskTree";
import {plannerBucket} from "./collectionPlannerFields";

export type TreeDropMode="before"|"after"|"child";
export function addSubtask(data:CollectionBlockPayload,parentId:string,name:string):CollectionBlockPayload{
 const title=name.trim(),parent=data.records.find(row=>row.id===parentId);
 const field=primaryField(data),tree=buildTaskTree(data.records);
 if(!title||!field||!parent||(tree.depth.get(parentId)??MAX_TASK_DEPTH)>=MAX_TASK_DEPTH)return data;
 const values={...parent.values,[field.id]:title};
 const child:CollectionRecord={id:newId(),parentId,values,progress:"not_started",
  priority:parent.priority??"medium",assigneeIds:[...(parent.assigneeIds??[])],
  labelIds:[...(parent.labelIds??[])]};
 const tail=taskBranch(tree,parentId),last=tail[tail.length-1];
 const at=data.records.findIndex(row=>row.id===last.id);
 return {...data,records:reconcileTaskProgress([...data.records.slice(0,at+1),child,...data.records.slice(at+1)])};
}
export function taskBreadcrumb(data:CollectionBlockPayload,id:string):CollectionRecord[]{
 const tree=buildTaskTree(data.records),path:CollectionRecord[]=[],seen=new Set<string>();
 let current=tree.byId.get(id);
 while(current&&!seen.has(current.id)){
  path.unshift(current);seen.add(current.id);
  current=current.parentId?tree.byId.get(current.parentId):undefined;
 }
 return path;
}
/** Move a whole DFS subtree. Moving onto a row makes it the new parent;
 * before/after moves to target's level. Cycle/depth/dependency checks are
 * delegated to the canonical model. Empty bucket means detach as a root. */
export function moveTaskTree(data:CollectionBlockPayload,id:string,targetId:string|null,
 mode:TreeDropMode="after",targetBucket?:string):CollectionBlockPayload{
 const tree=buildTaskTree(data.records),source=tree.byId.get(id);
 const target=targetId?tree.byId.get(targetId):undefined;
 if(!source||(targetId&&!target)||id===targetId)return data;
 const parentId=mode==="child"?targetId:target?.parentId??null;
 if(parentId===id)return data;
 const reparent=setTaskParent(data,id,parentId);
 if((source.parentId??null)!==parentId&&reparent===data)return data;
 const branch=taskBranch(tree,id),ids=new Set(branch.map(row=>row.id));
 if(targetId&&ids.has(targetId))return data;
 const rows=reparent.records.filter(row=>!ids.has(row.id));
 const moved=reparent.records.filter(row=>ids.has(row.id));
 const afterTree=buildTaskTree(rows);
 let at=rows.length;
 if(targetId){
  if(mode==="child"){
   const descendants=taskBranch(afterTree,targetId);
   at=rows.findIndex(row=>row.id===descendants.at(-1)?.id)+1;
  }else{
   const position=mode==="before"?targetId:taskBranch(afterTree,targetId).at(-1)?.id;
   at=rows.findIndex(row=>row.id===position)+(mode==="before"?0:1);
  }
 }
 if(at<0)at=rows.length;
 const bucket=plannerBucket(data),value=targetBucket??(target?target.values[bucket?.id??""]:undefined);
 const relocated=moved.map(row=>bucket&&value!==undefined
  ?{...row,values:{...row.values,[bucket.id]:value}}:row);
 const reordered=[...rows.slice(0,at),...relocated,...rows.slice(at)];
 const normalized=reordered.map((row,index)=>row.boardOrder===index?row:{...row,boardOrder:index});
 return {...reparent,records:reconcileTaskProgress(normalized)};
}
export function shiftTreeSibling(data:CollectionBlockPayload,id:string,direction:-1|1){
 const tree=buildTaskTree(data.records),row=tree.byId.get(id);
 if(!row)return data;
 const siblings=tree.children.get(row.parentId??null)??[];
 const index=siblings.findIndex(item=>item.id===id),next=siblings[index+direction];
 return next?moveTaskTree(data,id,next.id,direction===1?"after":"before"):data;
}
export function indentTreeTask(data:CollectionBlockPayload,id:string){
 const tree=buildTaskTree(data.records),row=tree.byId.get(id);
 if(!row)return data;
 const siblings=tree.children.get(row.parentId??null)??[];
 const index=siblings.findIndex(item=>item.id===id);
 return index>0?moveTaskTree(data,id,siblings[index-1].id,"child"):data;
}
export function outdentTreeTask(data:CollectionBlockPayload,id:string){
 const tree=buildTaskTree(data.records),row=tree.byId.get(id);
 if(!row?.parentId)return data;
 return moveTaskTree(data,id,row.parentId,"after");
}
export function visibleTaskTree(data:CollectionBlockPayload,rows:CollectionRecord[],
 collapsed:Set<string>,limit=MAX_VISIBLE_TREE_NODES){
 const tree=buildTaskTree(data.records),ids=new Set(rows.map(row=>row.id)),result:CollectionRecord[]=[];
 const visible=(row:CollectionRecord)=>{
  if(!ids.has(row.id))return;
  let cursor=row.parentId;const seen=new Set<string>();
  while(cursor){if(collapsed.has(cursor))return;if(seen.has(cursor))return;
   seen.add(cursor);cursor=tree.byId.get(cursor)?.parentId??null;}
  result.push(row);
 };
 for(const row of tree.order){if(result.length>=limit)break;visible(row);}
 return {rows:result,total:rows.length,truncated:rows.length>result.length};
}
export function branchSummary(data:CollectionBlockPayload,id:string){
 const branch=taskBranch(buildTaskTree(data.records),id);
 return branch.length?recordTitle(data,branch[0])+" · "+(branch.length-1)+" sub-tasks":"";
}
