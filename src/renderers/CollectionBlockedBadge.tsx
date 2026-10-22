import { LockKeyhole } from "lucide-react";
import { blockingCollectionDependencies } from "../collections/collectionDependencies";
import { recordTitle, type CollectionBlockPayload, type CollectionRecord } from "../collections/model";
/** Shows only pending predecessors; completed dependencies remain saved, not blocking. */
export function CollectionBlockedBadge({data,record,compact=false}:{
 data:CollectionBlockPayload;record:CollectionRecord;compact?:boolean;
}) {
 const blockers=blockingCollectionDependencies(data,record);
 if(!blockers.length)return null;
 const names=blockers.map(item=>recordTitle(data,item)).join(", ");
 return <span data-testid="blocked-badge" role="img" tabIndex={0}
   aria-label={"Blocked by "+names} title={"Blocked by "+names}
   className="inline-flex max-w-full shrink-0 items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800 outline-none focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)] dark:text-amber-300">
   <LockKeyhole size={13} aria-hidden="true"/>{compact?"": "Blocked"}
  </span>;
}
