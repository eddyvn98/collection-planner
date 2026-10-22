import { buildTaskTree } from "../collections/collectionTaskTree";
import { deleteRecord,recordTitle,type CollectionBlockPayload } from "../collections/model";
import { CollectionModalDialog } from "./CollectionModalDialog";

export function CollectionDeleteBranchDialog({data,id,onClose,onChange}:{
 data:CollectionBlockPayload;id:string;onClose:()=>void;
 onChange:(next:CollectionBlockPayload)=>void;
}){
 const record=data.records.find(row=>row.id===id);
 if(!record)return null;
 const children=buildTaskTree(data.records).children.get(id)?.length??0;
 const done=(mode:"subtree"|"promote")=>{onChange(deleteRecord(data,id,mode));onClose();};
 return <CollectionModalDialog label={"Delete "+recordTitle(data,record)+" task?"} onClose={onClose}>
  <h2 className="font-semibold">Delete “{recordTitle(data,record)}”?</h2>
  <p className="mt-2 text-sm text-[var(--planner-secondary)]">
   {children?"This task has sub-tasks. Choose what happens to its descendants.":"This removes the task. You can undo this action."}
  </p>
  <div className="mt-4 flex flex-wrap justify-end gap-2">
   <button data-dialog-initial type="button" className="min-h-10 rounded px-3 hover:bg-[var(--planner-hover)]" onClick={onClose}>Cancel</button>
   {children>0&&<button type="button" onClick={()=>done("promote")}
    className="min-h-10 rounded border border-[var(--planner-border)] px-3 text-xs">Promote sub-tasks</button>}
   <button type="button" className="min-h-10 rounded bg-red-700 px-3 text-xs text-white"
    onClick={()=>done(children?"subtree":"promote")}>
    {children?"Delete entire branch":"Delete task"}</button>
  </div>
 </CollectionModalDialog>;
}
