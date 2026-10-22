import {useDroppable,useDndContext} from "@dnd-kit/core";
import {CornerDownRight} from "lucide-react";
import type {CollectionBlockPayload,CollectionRecord} from "../collections/model";
import {recordTitle} from "../collections/model";
/** Explicit, keyboard reachable reparent target (never an ambiguous card drop). */
export function CollectionBoardSubtaskDrop({data,record}:{
 data:CollectionBlockPayload;record:CollectionRecord;
}){
 const {active}=useDndContext();
 const {isOver,setNodeRef}=useDroppable({id:"subtask:"+record.id,disabled:!active});
 return <div ref={setNodeRef} data-testid="board-make-subtask-target"
  aria-label={"Make sub-task of "+recordTitle(data,record)}
  className={"flex min-h-6 items-center gap-1 rounded px-2 text-[10px] transition-colors "+
   (isOver?"bg-[var(--planner-accent)] text-white ring-2 ring-[var(--planner-accent)]":
    active?"border border-dashed border-[var(--planner-accent)] text-[var(--planner-secondary)]":
    "text-[var(--planner-secondary)] opacity-60")}>
  <CornerDownRight size={12} aria-hidden="true"/> Make sub-task of
 </div>;
}
