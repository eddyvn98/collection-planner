import {updateView,type CollectionBlockPayload,type CollectionRecord,type CollectionView} from "./model";
import {formFields} from "./collectionForm";
/** Reordering is per view and never changes task identity or unrelated sort. */
export function orderedGalleryRows(rows:CollectionRecord[],view:CollectionView){
 if(!view.galleryOrderIds?.length)return rows;
 const positions=new Map(view.galleryOrderIds.map((id,index)=>[id,index]));
 return [...rows].sort((a,b)=>{
  const pa=positions.get(a.id),pb=positions.get(b.id);
  if(pa===undefined&&pb===undefined)return 0;
  if(pa===undefined)return 1;
  if(pb===undefined)return -1;
  return pa-pb;
 });
}
export function reorderGallery(data:CollectionBlockPayload,viewId:string,
 source:string,target:string){
 const view=data.views.find(v=>v.id===viewId&&v.kind==="gallery");
 if(!view||source===target)return data;
 const rows=orderedGalleryRows(data.records,view);
 const ids=rows.map(r=>r.id),from=ids.indexOf(source),to=ids.indexOf(target);
 if(from<0||to<0)return data;
 ids.splice(to,0,ids.splice(from,1)[0]);
 return updateView(data,viewId,{galleryOrderIds:ids});
}
export function reorderFormField(data:CollectionBlockPayload,viewId:string,
 source:string,target:string){
 const view=data.views.find(v=>v.id===viewId&&v.kind==="form");
 if(!view||source===target)return data;
 const ids=formFields(data,view).map(field=>field.id);
 const from=ids.indexOf(source),to=ids.indexOf(target);
 if(from<0||to<0)return data;
 ids.splice(to,0,ids.splice(from,1)[0]);
 return updateView(data,viewId,{formFieldIds:ids});
}
