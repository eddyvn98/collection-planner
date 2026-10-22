import {useState} from "react";
import {applyPlanTemplate,PLAN_TEMPLATES,type PlannerTemplate} from "../collections/collectionPlanTemplates";
import type {CollectionBlockPayload} from "../collections/model";
export function CollectionPlanTemplates({data,readOnly,onChange}:{
 data:CollectionBlockPayload;readOnly:boolean;onChange:(next:CollectionBlockPayload)=>void;
}){
 const [choice,setChoice]=useState<PlannerTemplate>("blank");
 return <section className="space-y-2 rounded-lg border border-[var(--planner-border)] p-3">
  <h3 className="text-sm font-semibold">Plan template</h3>
  <p className="text-xs text-[var(--planner-secondary)]">Available for an empty plan. Templates set buckets, fields and labels, not assignees.</p>
  <select aria-label="Plan template" value={choice} disabled={readOnly||data.records.length>0}
   className="min-h-10 w-full rounded border border-[var(--planner-border)] bg-[var(--planner-surface)] p-2"
   onChange={e=>setChoice(e.target.value as PlannerTemplate)}>
   {PLAN_TEMPLATES.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
  </select>
  <button type="button" disabled={readOnly||data.records.length>0}
   className="min-h-10 rounded bg-[var(--planner-accent)] px-3 text-white disabled:opacity-40"
   onClick={()=>onChange(applyPlanTemplate(data,choice))}>Apply template</button>
 </section>;
}
