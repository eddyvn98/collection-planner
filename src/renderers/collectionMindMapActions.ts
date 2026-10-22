import {addRecord,newId,primaryField,recordTitle,setRecordValue,
 type CollectionBlockPayload,type CollectionRecord} from "../collections/model";
import {addSubtask} from "../collections/collectionTreeActions";
import {buildTaskTree,canSetTaskParent,descendantCounts} from "../collections/collectionTaskTree";

export function addMindMapRelative(data:CollectionBlockPayload,id:string,
 mode:"child"|"sibling",title="New sub-task"):CollectionBlockPayload{
 const parent=data.records.find(row=>row.id===id);
 if(!parent||!title.trim())return data;
 if(mode==="child")return addSubtask(data,id,title);
 if(parent.parentId)return addSubtask(data,parent.parentId,title);
 const field=primaryField(data);if(!field)return data;
 const values={...parent.values,[field.id]:title};
 const next=addRecord(data,values);
 return {...next,records:next.records.map(row=>row.id===next.records.at(-1)?.id
  ?{...row,progress:"not_started",parentId:null}:row)};
}
export function renameMindMapTask(data:CollectionBlockPayload,id:string,title:string){
 const field=primaryField(data);
 return field&&title.trim()?setRecordValue(data,id,field.id,title.trim()):data;
}
export function visibleMindMapRecords(data:CollectionBlockPayload,
 rows:CollectionRecord[],collapsed:Set<string>){
 const tree=buildTaskTree(data.records),visible:CollectionRecord[]=[];
 const allowed=new Set(rows.map(row=>row.id));
 for(const row of tree.order){
  if(!allowed.has(row.id))continue;
  let parent=row.parentId,hidden=false;const seen=new Set<string>();
  while(parent&&!seen.has(parent)){
   if(collapsed.has(parent)){hidden=true;break;}
   seen.add(parent);parent=tree.byId.get(parent)?.parentId??null;
  }
  if(!hidden)visible.push(row);
 }
 return visible;
}
export function candidateMindMapParent(data:CollectionBlockPayload,moving:string,
 positioned:{id:string;x:number;y:number}[],x:number,y:number){
 const options=positioned.filter(item=>item.id!==moving)
  .map(item=>({...item,distance:Math.hypot(item.x-x,item.y-y)}))
  .filter(item=>item.distance<150).sort((a,b)=>a.distance-b.distance);
 return options.find(item=>canSetTaskParent(data.records,moving,item.id))?.id??null;
}
export function mindMapBadges(data:CollectionBlockPayload,id:string){
 const row=data.records.find(item=>item.id===id);
 const counts=descendantCounts(data.records).get(id)??{done:0,total:0};
 return {progress:row?.progress??"not_started",priority:row?.priority??"medium",
  due:row?.values[data.fields.find(f=>f.type==="date"&&/due|end/i.test(f.name))?.id??""]??"",
  assignees:(row?.assigneeIds??[]).flatMap(personId=>{
   const person=data.people?.find(p=>p.id===personId);return person?[person.name]:[];
  }),counts,hasChildren:counts.total>0};
}
