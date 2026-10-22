import {useRef,useState} from "react";
import {ListFilter,ArrowDownAZ,Columns3} from "lucide-react";
import {CollectionFloatingPanel} from "./CollectionFloatingPanel";
import {BOARD_MODES} from "./collectionBoardGroups";
import {GRID_TASK_COLUMNS,gridFields,initialGridHiddenFields,toggleGridField} from "../collections/collectionPlannerFilters";
import {primaryField,updateView,viewSorts,type CollectionBlockPayload,type CollectionView} from "../collections/model";
import {isLegacyStatusField} from "../collections/collectionPlannerFields";
type Menu="group"|"sort"|"fields";
interface Props{data:CollectionBlockPayload;view:CollectionView;readOnly:boolean;
 onChange:(next:CollectionBlockPayload)=>void;}
const touch="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg px-3 text-xs hover:bg-[var(--planner-hover)] focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)]";
export function CollectionViewToolbarMenus({data,view,readOnly,onChange}:Props){
 const [open,setOpen]=useState<Menu|null>(null);
 const group=useRef<HTMLButtonElement>(null),sort=useRef<HTMLButtonElement>(null),
  fields=useRef<HTMLButtonElement>(null);
 const anchors={group,sort,fields};
 const eligible=data.fields.filter(f=>!isLegacyStatusField(f));
 const sortable=eligible.filter(f=>!["image","relation","lookup","rollup"].includes(f.type));
 const currentSort=viewSorts(view)[0];
 const title=primaryField(data)?.id;
 const gallery=eligible.filter(f=>f.id!==title&&f.type!=="image");
 const galleryShown=view.galleryFieldIds??gallery.slice(0,3).map(f=>f.id);
 const form=eligible.filter(f=>!["formula","lookup","rollup"].includes(f.type));
 const formShown=view.formFieldIds??form.map(f=>f.id);
 const gridShown=gridFields(data,view).map(f=>f.id);
 const fieldsShown=(view.gridHiddenFieldIds??initialGridHiddenFields(data));
 const setView=(change:Partial<CollectionView>)=>onChange(updateView(data,view.id,change));
 const toggleField=(id:string)=>{
  if(view.kind==="table"){onChange(toggleGridField(data,view.id,id));return;}
  const key=view.kind==="gallery"?"galleryFieldIds":"formFieldIds";
  const active=view.kind==="gallery"?galleryShown:formShown;
  setView({[key]:active.includes(id)?active.filter(v=>v!==id):[...active,id]});
 };
 const supported=view.kind==="table"||view.kind==="gallery"||view.kind==="form";
 return <div data-testid="planner-view-toolbar-menus" className="flex shrink-0 flex-wrap items-center gap-1">
  {(["group","sort","fields"] as const).map(menu=><span key={menu} className="relative">
   <button ref={anchors[menu]} type="button" aria-label={menu==="group"?"Group by":"View "+menu}
    aria-expanded={open===menu} aria-haspopup="dialog"
    className={touch} onClick={()=>setOpen(current=>current===menu?null:menu)}>
    {menu==="group"?<ListFilter size={16}/>:menu==="sort"?<ArrowDownAZ size={16}/>:<Columns3 size={16}/>}
    <span className="hidden sm:inline">{menu==="group"?"Group":menu==="sort"?"Sort":"Fields"}</span>
   </button>
   <CollectionFloatingPanel open={open===menu} anchorRef={anchors[menu]} onClose={()=>setOpen(null)}
    role={menu==="group"&&view.kind==="kanban"?"menu":"dialog"}
    label={menu==="group"&&view.kind==="kanban"?"Group by":"View "+menu} align="start"
    className="w-[min(300px,calc(100vw-16px))] rounded-lg p-3">
    <strong className="block pb-2 text-sm">{menu==="group"?"Group tasks":menu==="sort"?"Sort tasks":"Visible fields"}</strong>
    {menu==="group"&&(view.kind==="kanban"?
     <div className="grid gap-1">{BOARD_MODES.map(mode=><button key={mode.value} type="button" role="menuitem"
      disabled={readOnly} aria-pressed={(view.boardGroupBy??"bucket")===mode.value}
      onClick={()=>{setView({boardGroupBy:mode.value});setOpen(null);}}
      className="min-h-11 rounded px-3 text-left text-sm hover:bg-[var(--planner-hover)] aria-pressed:bg-[var(--planner-hover)]">
      {mode.label}</button>)}</div>
     :view.kind==="table"||view.kind==="gallery"?
     <div className="grid gap-1">
      <button type="button" disabled={readOnly} className={touch}
       onClick={()=>{setView({groupFieldId:undefined});setOpen(null);}}>No grouping</button>
      {eligible.filter(field=>field.type==="select").map(field=><button type="button"
       key={field.id} disabled={readOnly} aria-pressed={view.groupFieldId===field.id}
       className="min-h-11 rounded px-3 text-left text-sm hover:bg-[var(--planner-hover)] aria-pressed:bg-[var(--planner-hover)]"
       onClick={()=>{setView({groupFieldId:field.id});setOpen(null);}}>{field.name}</button>)}
     </div>
     :<p className="text-xs text-[var(--planner-secondary)]">
      Group by is available in Board, Grid and Gallery. Other views keep their native layout.
     </p>)}
    {menu==="sort"&&<div className="grid gap-2">
     <button className={touch} disabled={readOnly} onClick={()=>{setView({sorts:[],sort:undefined});setOpen(null);}}>No sort</button>
     <label className="text-xs">Sort field
      <select aria-label="Sort field in view" disabled={readOnly} value={currentSort?.fieldId??""}
       onChange={event=>{setView({sorts:event.target.value?[{fieldId:event.target.value,direction:currentSort?.direction??"asc"}]:[],sort:undefined});}}
       className="mt-1 min-h-11 w-full rounded border border-[var(--planner-border)] bg-[var(--planner-surface)] px-2">
       <option value="">No sort</option>{sortable.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
      </select>
     </label>
     <button type="button" aria-label="Toggle sort direction" disabled={!currentSort||readOnly}
      className={touch+" border border-[var(--planner-border)]"}
      onClick={()=>setView({sorts:[{fieldId:currentSort!.fieldId,direction:currentSort!.direction==="asc"?"desc":"asc"}],sort:undefined})}>
      {currentSort?.direction==="desc"?"Descending":"Ascending"} ↕</button>
    </div>}
    {menu==="fields"&&(supported?
     <div className="max-h-72 overflow-y-auto">
      {(view.kind==="table"?[...eligible,...GRID_TASK_COLUMNS]:view.kind==="gallery"?gallery:form)
       .map(f=><label key={f.id} className="flex min-h-11 items-center gap-2 text-xs">
        <input type="checkbox" aria-label={"Show "+f.name} disabled={readOnly||f.id===title}
         checked={view.kind==="table"?(f.id.startsWith("__")?!fieldsShown.includes(f.id):gridShown.includes(f.id)):
          view.kind==="gallery"?galleryShown.includes(f.id):formShown.includes(f.id)}
         onChange={()=>toggleField(f.id)}/>{f.name}</label>)}
     </div>:<p className="text-xs text-[var(--planner-secondary)]">
      Field visibility is configurable in Grid, Gallery and Form.
     </p>)}
   </CollectionFloatingPanel>
  </span>)}
 </div>;
}
