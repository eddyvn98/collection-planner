import {CollectionModalDialog} from "./CollectionModalDialog";
import type {CollectionBlockPayload} from "../collections/model";
export function CollectionImportPrompts({pending,error,onConfirm,onCancel,onErrorClose}:{
 pending:CollectionBlockPayload|null;error:string;
 onConfirm:()=>void;onCancel:()=>void;onErrorClose:()=>void;
}){
 return <>
  {pending&&<CollectionModalDialog label="Replace collection?" onClose={onCancel}>
   <h2 className="text-base font-semibold">Replace this collection with imported records?</h2>
   <p className="mt-2 text-sm text-[var(--planner-secondary)]">The current records will be replaced. Undo is available.</p>
   <div className="mt-4 flex justify-end gap-2">
    <button data-dialog-initial className="min-h-9 rounded px-3 hover:bg-[var(--planner-hover)]"
     onClick={onCancel}>Cancel</button>
    <button className="min-h-9 rounded bg-[var(--planner-accent)] px-3 text-white"
     onClick={onConfirm}>Replace collection</button>
   </div>
  </CollectionModalDialog>}
  {!!error&&<CollectionModalDialog label="Collection action failed" onClose={onErrorClose}>
   <h2 className="font-semibold">Unable to complete action</h2>
   <p role="alert" className="mt-2 text-sm">{error}</p>
   <div className="mt-4 flex justify-end"><button data-dialog-initial className="min-h-9 rounded px-3 hover:bg-[var(--planner-hover)]"
    onClick={onErrorClose}>Close</button></div>
  </CollectionModalDialog>}
 </>;
}
