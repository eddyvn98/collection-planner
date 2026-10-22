import {useState} from "react";
import {Plus} from "lucide-react";
import {CollectionTaskFilterBar} from "./CollectionTaskFilterBar";
import {CollectionQuickAddInput} from "./CollectionQuickAddInput";
import {CollectionViewToolbarMenus} from "./CollectionViewToolbarMenus";
import {CollectionSharePlan} from "./CollectionSharePlan";
import {createQuickTask} from "../collections/collectionInputParser";
import {plannerBucket} from "../collections/collectionPlannerFields";
import type {CollectionBlockPayload,CollectionView} from "../collections/model";
import type {TaskFilterState} from "../collections/collectionPlannerFilters";
interface Props{data:CollectionBlockPayload;view:CollectionView;filters:TaskFilterState;
 onFilters:(next:TaskFilterState)=>void;readOnly:boolean;
 onChange:(next:CollectionBlockPayload)=>void;}
export function CollectionUnifiedToolbar({data,view,filters,onFilters,readOnly,onChange}:Props){
 const [draft,setDraft]=useState("");
 const [feedback,setFeedback]=useState("");
 const create=()=>{
  if(readOnly||!draft.trim())return;
  const bucket=plannerBucket(data);
  const first=view.kind==="kanban"?bucket?.options?.[0]??"":undefined;
  const next=createQuickTask(data,draft,first!==undefined?bucket?.id:undefined,first);
  if(next===data){setFeedback("Enter a task title.");return;}
  onChange(next);setDraft("");setFeedback("Task added");
 };
 return <section data-testid="planner-unified-toolbar" aria-label="View toolbar"
  className="flex shrink-0 flex-wrap items-center gap-1 border-b border-[var(--planner-border)] bg-[var(--planner-surface)] px-2 py-1 sm:px-3">
  <CollectionTaskFilterBar data={data} value={filters} readOnly={readOnly}
   onChange={onFilters} onDataChange={onChange}/>
  <CollectionViewToolbarMenus data={data} view={view} readOnly={readOnly} onChange={onChange}/>
  <form data-testid="planner-create-in-place" className="order-last flex w-full min-w-0 items-start gap-1 sm:order-none sm:ml-auto sm:w-auto sm:max-w-[390px]"
   onSubmit={e=>{e.preventDefault();create();}}>
   <CollectionQuickAddInput data={data} label="Quick create task" value={draft}
    onChange={value=>{setDraft(value);setFeedback("");}} disabled={readOnly}
    placeholder="Task · mai @người #nhãn !urgent"
    className="h-11 min-h-11 w-full min-w-[120px] rounded-lg border border-[var(--planner-border)] bg-[var(--planner-surface)] px-2 text-xs"/>
   <button type="submit" aria-label="Create task in place" disabled={readOnly||!draft.trim()}
    className="inline-flex h-11 min-h-11 min-w-11 items-center justify-center gap-1 rounded-lg bg-[var(--planner-accent)] px-3 text-xs text-white disabled:opacity-40">
    <Plus size={16}/> <span className="hidden lg:inline">Add</span>
   </button>
  </form>
  <CollectionSharePlan/>
  {feedback&&<span role="status" aria-live="polite" className="text-xs text-emerald-600">{feedback}</span>}
 </section>;
}
