import { useState } from "react";
import { gridFields, toggleGridField } from "../collections/collectionPlannerFilters";
import { bulkUpdateGrid, type GridBulkAction } from "../collections/collectionGridActions";
import { visiblePlannerFields } from "../collections/collectionPlannerFields";
import { primaryField, type CollectionBlockPayload, type CollectionView } from "../collections/model";
interface Props { data: CollectionBlockPayload; view: CollectionView; visibleCount: number; selectedIds: string[];
 readOnly: boolean; onChange: (next: CollectionBlockPayload) => void; onClear: () => void; }
export function CollectionGridToolbar({data,view,visibleCount,selectedIds,readOnly,onChange,onClear}:Props){
 const [action,setAction]=useState("progress:completed");
 const shown=gridFields(data,view);
 const apply=()=>{
  const [kind,value]=action.split(":");
  if(kind==="delete" && !window.confirm("Delete "+selectedIds.length+" selected tasks?"))return;
  onChange(bulkUpdateGrid(data,selectedIds,kind==="delete"?{kind:"delete"}:
    {kind,value} as GridBulkAction,readOnly));onClear();
 };
 return <div data-testid="planner-grid-toolbar" className="flex flex-wrap items-center gap-3 rounded-lg bg-white p-2 text-xs dark:bg-slate-900">
  <strong className="text-slate-600 dark:text-slate-200">Grid · {visibleCount} of {data.records.length} {data.records.length===1?"task":"tasks"}</strong>
  <details className="relative">
   <summary className="cursor-pointer rounded-lg border border-slate-200 px-3 py-2 font-medium dark:border-slate-700">
     Columns ({shown.length + 4}/{visiblePlannerFields(data).length + 4})
   </summary>
   <div className="absolute left-0 top-full z-40 mt-1 max-h-60 min-w-48 overflow-auto rounded-lg border bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900"
     aria-label="Grid column visibility">
    {visiblePlannerFields(data).map(field=><label key={field.id} className="flex items-center gap-2 px-2 py-1.5">
     <input type="checkbox" aria-label={"Show column "+field.name}
      checked={shown.some(v=>v.id===field.id)} disabled={readOnly||field.id===primaryField(data)?.id}
      onChange={()=>onChange(toggleGridField(data,view.id,field.id))}/>{field.name}
    </label>)}
   </div>
  </details>
  <span role="status" className="text-slate-600 dark:text-slate-200">{selectedIds.length} selected</span>
  {!!selectedIds.length&&<>
   <select aria-label="Bulk task action" className="rounded-lg border bg-white px-2 py-2 text-xs dark:bg-slate-800"
     value={action} onChange={e=>setAction(e.target.value)} disabled={readOnly}>
    <optgroup label="Progress">
     <option value="progress:not_started">Not started</option>
     <option value="progress:in_progress">In progress</option>
     <option value="progress:completed">Completed</option>
    </optgroup>
    <optgroup label="Priority">
     <option value="priority:urgent">Urgent</option>
     <option value="priority:important">Important</option>
     <option value="priority:medium">Medium</option>
     <option value="priority:low">Low</option>
    </optgroup>
    <option value="delete:">Delete selected</option>
   </select>
   <button type="button" disabled={readOnly} onClick={apply}
    className="rounded-lg bg-blue-600 px-3 py-2 font-semibold text-white disabled:opacity-50">Apply to selected</button>
   <button type="button" onClick={onClear} className="text-slate-600 underline dark:text-slate-300">Clear selection</button>
  </>}
 </div>;
}
