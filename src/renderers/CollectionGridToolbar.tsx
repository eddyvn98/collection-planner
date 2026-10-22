import { useRef, useState } from "react";
import { CollectionModalDialog } from "./CollectionModalDialog";
import { CollectionFloatingPanel } from "./CollectionFloatingPanel";
import { gridFields, toggleGridField } from "../collections/collectionPlannerFilters";
import { bulkUpdateGrid, type GridBulkAction } from "../collections/collectionGridActions";
import { visiblePlannerFields } from "../collections/collectionPlannerFields";
import { primaryField, type CollectionBlockPayload, type CollectionView } from "../collections/model";
interface Props { data: CollectionBlockPayload; view: CollectionView; visibleCount: number; selectedIds: string[];
 readOnly: boolean; onChange: (next: CollectionBlockPayload) => void; onClear: () => void; }
export function CollectionGridToolbar({data,view,visibleCount,selectedIds,readOnly,onChange,onClear}:Props){
 const [action,setAction]=useState("progress:completed");
 const [columnsOpen,setColumnsOpen]=useState(false);
 const [confirmDelete,setConfirmDelete]=useState(false);
 const bulkRef=useRef<HTMLButtonElement>(null);
 const columnsRef=useRef<HTMLButtonElement>(null);
 const shown=gridFields(data,view);
 const apply=()=>{
  const [kind,value]=action.split(":");
  if(kind==="delete"){setConfirmDelete(true);return; }
  onChange(bulkUpdateGrid(data,selectedIds,kind==="delete"?{kind:"delete"}:
    {kind,value} as GridBulkAction,readOnly));onClear();
 };
 return <div data-testid="planner-grid-toolbar" className="flex flex-wrap items-center gap-3 rounded-lg bg-[var(--planner-surface)] p-2 text-[var(--planner-text)] text-xs ">
  <strong className="text-[var(--planner-secondary)]">Grid · {visibleCount} of {data.records.length} {data.records.length===1?"task":"tasks"}</strong>
  <div className="relative">
   <button ref={columnsRef} type="button" aria-label="Grid column visibility" aria-expanded={columnsOpen}
    className="min-h-9 rounded-lg border border-[var(--planner-border)] px-3 py-2 font-medium hover:bg-[var(--planner-hover)] focus-visible:ring-2"
    onClick={()=>setColumnsOpen(!columnsOpen)}>
     Columns ({shown.length + 4}/{visiblePlannerFields(data).length + 4})
   </button>
   <CollectionFloatingPanel open={columnsOpen} anchorRef={columnsRef} onClose={()=>setColumnsOpen(false)}
    role="dialog" label="Grid column visibility" className="w-64 rounded-lg p-2">
    {visiblePlannerFields(data).map(field=><label key={field.id}
      className="flex min-h-9 items-center gap-2 px-2 py-1.5 text-sm">
     <input type="checkbox" aria-label={"Show column "+field.name}
      checked={shown.some(v=>v.id===field.id)} disabled={readOnly||field.id===primaryField(data)?.id}
      onChange={()=>onChange(toggleGridField(data,view.id,field.id))}/>{field.name}
    </label>)}
   </CollectionFloatingPanel>
  </div>
  <span role="status" className="text-[var(--planner-secondary)]">{selectedIds.length} selected</span>
  {!!selectedIds.length&&<>
   <select aria-label="Bulk task action" className="rounded-lg border border-[var(--planner-border)] bg-[var(--planner-surface)] px-2 py-2 text-xs "
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
   <button ref={bulkRef} type="button" disabled={readOnly} onClick={apply}
    className="rounded-lg bg-[var(--planner-accent)] px-3 py-2 font-semibold text-white disabled:opacity-50">Apply to selected</button>
   <button type="button" onClick={onClear} className="text-[var(--planner-secondary)] underline">Clear selection</button>
  </>}
  {confirmDelete&&<CollectionModalDialog label="Delete selected tasks?"
   trigger={bulkRef.current} onClose={()=>setConfirmDelete(false)}>
    <h2 className="text-sm font-semibold">Delete {selectedIds.length} selected tasks?</h2>
    <p className="mt-2 text-sm text-[var(--planner-secondary)]">This removes the selected records.</p>
    <div className="mt-4 flex justify-end gap-2">
     <button data-dialog-initial className="min-h-9 rounded px-3 hover:bg-[var(--planner-hover)]"
       onClick={()=>setConfirmDelete(false)}>Cancel</button>
     <button className="min-h-9 rounded bg-red-700 px-3 text-white"
       onClick={()=>{onChange(bulkUpdateGrid(data,selectedIds,{kind:"delete"},readOnly));
        onClear();setConfirmDelete(false);}}>Delete tasks</button>
    </div>
   </CollectionModalDialog>}
 </div>;
}
