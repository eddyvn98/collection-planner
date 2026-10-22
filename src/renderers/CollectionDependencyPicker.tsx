import { useMemo, useState } from "react";
import { Link2, Search, X } from "lucide-react";
import { recordTitle, type CollectionBlockPayload, type CollectionRecord } from "../collections/model";
import { availableCollectionDependencies, blockingCollectionDependencies,
 setCollectionDependencies } from "../collections/collectionDependencies";
import { plannerBucket } from "../collections/collectionPlannerFields";
import { formatPlannerCardDate } from "../collections/collectionDateDisplay";
import { localToday, taskDate } from "../collections/collectionTasks";

interface Props { data: CollectionBlockPayload; record: CollectionRecord; readOnly: boolean;
 onChange: (next: CollectionBlockPayload) => void; }
export function CollectionDependencyPicker({data,record,readOnly,onChange}: Props) {
 const [query,setQuery]=useState("");
 const bucket=plannerBucket(data);
 const index=useMemo(()=>new Map(data.records.map(item=>[item.id,item])),[data.records]);
 const selected=(record.dependsOn??[]).map(id=>index.get(id)).filter((row):row is CollectionRecord=>!!row);
 const candidates=useMemo(()=>availableCollectionDependencies(data,record),[data,record]);
 const details=(row:CollectionRecord)=>{
  const group=bucket ? row.values[bucket.id]||"No bucket" : "No bucket";
  const date=taskDate(data,row,"due");
  return group+(date?" · Due "+formatPlannerCardDate(date,localToday()):" · No due date");
 };
 const search=query.trim().toLocaleLowerCase();
 const results=candidates.filter(row=>(recordTitle(data,row)+" "+details(row)).toLocaleLowerCase().includes(search));
 const add=(id:string)=>onChange(setCollectionDependencies(data,record.id,[...(record.dependsOn??[]),id]));
 const remove=(id:string)=>onChange(setCollectionDependencies(data,record.id,(record.dependsOn??[]).filter(x=>x!==id)));
 const blockers=blockingCollectionDependencies(data,record);
 return <div data-testid="dependency-picker" className="mt-2 space-y-3 text-xs">
  {blockers.length>0 && <p role="status" className="rounded bg-amber-500/10 px-2 py-1.5 text-amber-700 dark:text-amber-300">
   Blocked by {blockers.map(row=>recordTitle(data,row)).join(", ")}
  </p>}
  {selected.length>0 && <div aria-label="Selected dependencies" className="space-y-1">
   {selected.map(row=><div key={row.id} className="flex items-center gap-2 rounded border border-[var(--planner-border)] p-2">
    <Link2 size={14} className="shrink-0 text-[var(--planner-accent)]"/>
    <div className="min-w-0 flex-1">
     <span className="block truncate font-medium">{recordTitle(data,row)}</span>
     <span className="text-[var(--planner-secondary)]">{details(row)}
      {row.progress==="completed"?" · Completed":""}</span>
    </div>
    <button type="button" disabled={readOnly} aria-label={"Remove dependency "+recordTitle(data,row)}
     title="Remove predecessor" onClick={()=>remove(row.id)}
     className="grid h-8 w-8 shrink-0 place-items-center rounded hover:bg-[var(--planner-hover)] focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)]">
     <X size={14}/></button>
   </div>)}
  </div>}
  <label className="relative block">
   <Search size={15} className="pointer-events-none absolute left-2.5 top-3 text-[var(--planner-secondary)]"/>
   <input type="search" aria-label="Search dependency tasks" placeholder="Find predecessor by name or bucket"
    className="min-h-10 w-full rounded-md border border-[var(--planner-border)] bg-[var(--planner-surface)] pl-9 pr-2 text-sm text-[var(--planner-text)] focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)]"
    value={query} onChange={event=>setQuery(event.target.value)}/>
  </label>
  <div className="max-h-52 space-y-1 overflow-y-auto" aria-label="Available dependencies">
   {results.slice(0,60).map(row=><label key={row.id}
     className="flex min-h-11 cursor-pointer items-center gap-2 rounded px-2 hover:bg-[var(--planner-hover)] focus-within:ring-2 focus-within:ring-[var(--planner-accent)]">
    <input type="checkbox" aria-label={"Add dependency "+recordTitle(data,row)} disabled={readOnly}
     checked={false} onChange={()=>add(row.id)}/>
    <span className="min-w-0">
     <span className="block truncate text-sm">{recordTitle(data,row)}</span>
     <span className="text-[var(--planner-secondary)]">{details(row)}</span>
    </span>
   </label>)}
   {!results.length&&<p role="status" className="px-2 py-3 text-[var(--planner-secondary)]">
    {selected.length>=20?"Limit: 20 predecessors. Remove one to add another.":
     "No eligible tasks. Completed tasks, duplicates and cycles are excluded."}
   </p>}
   {results.length>60&&<p className="px-2 text-[var(--planner-secondary)]">Showing 60 of {results.length}. Refine your search.</p>}
  </div>
  <p className="text-[var(--planner-secondary)]">{selected.length}/20 predecessors · Tasks already completed cannot be added</p>
 </div>;
}
