import { X, XCircle } from "lucide-react";
import { EMPTY_TASK_FILTERS } from "../collections/collectionPlannerFilters";
import { activePlannerChips, clearPlannerChip } from "../collections/collectionFilterChips";
import type { CollectionBlockPayload } from "../collections/model";
import type { TaskFilterState } from "../collections/collectionPlannerFilters";
export function CollectionFilterChips({data,value,onChange}:{
 data:CollectionBlockPayload;value:TaskFilterState;onChange:(filters:TaskFilterState)=>void;
}){
 const chips=activePlannerChips(data,value);
 if(!chips.length)return null;
 return <div data-testid="planner-active-filter-chips" className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-[var(--planner-border)] bg-[var(--planner-surface)] px-3 py-1.5">
  {chips.map(chip=><button key={chip.key} type="button" aria-label={"Remove "+chip.label}
    className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-[var(--planner-border)] bg-[var(--planner-hover)] px-2.5 text-xs text-[var(--planner-text)] hover:border-[var(--planner-accent)] focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)]"
    onClick={()=>onChange(clearPlannerChip(value,chip.key))}>{chip.label}<X size={13}/></button>)}
 </div>;
}
