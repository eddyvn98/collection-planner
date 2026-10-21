import { Copy, CalendarDays, Layers3 } from "lucide-react";
import type { CollectionBlockPayload, CollectionRecord } from "../collections/model";
import { copyTask, moveTaskToBucket } from "../collections/collectionRecurrence";
import { rescheduleTask } from "../collections/collectionSchedule";
import { taskDate } from "../collections/collectionTasks";
import { plannerBucket } from "../collections/collectionPlannerFields";
export function CollectionTaskActions({data,record,readOnly,onChange}: {
  data:CollectionBlockPayload; record:CollectionRecord; readOnly:boolean;
  onChange:(next:CollectionBlockPayload)=>void;
}) {
  const bucket=plannerBucket(data);
  return <section aria-label="Task actions" className="space-y-2 rounded-lg border border-[var(--planner-border)] p-3 dark:border-[var(--planner-border)]">
    <h3 className="text-sm font-semibold">Task actions</h3>
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" disabled={readOnly} onClick={()=>onChange(copyTask(data,record.id))}
        className="rounded-md border px-3 py-1.5 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50">
        <Copy size={16} strokeWidth={1.75} className="inline-block"/> Copy task
      </button>
      <label className="text-xs"><CalendarDays size={16} className="inline-block"/> Move to date
        <input type="date" aria-label="Move task to date" disabled={readOnly}
          value={taskDate(data,record,"due")}
          className="ml-2 rounded-md border border-[var(--planner-border)] bg-[var(--planner-surface)] p-1.5 text-[var(--planner-text)] focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-[var(--planner-border)] dark:bg-[var(--planner-surface)] dark:text-white"
          onChange={e=>{
            const calendar=data.views.find(item=>item.kind==="calendar");
            if(calendar&&e.target.value)onChange(rescheduleTask(data,calendar,record.id,e.target.value));
          }}/>
      </label>
      {bucket&&<label className="text-xs"><Layers3 size={16} className="inline-block"/> Move to bucket
        <select aria-label="Move task to bucket" value={record.values[bucket.id]??""} disabled={readOnly}
          className="ml-2 rounded-md border border-[var(--planner-border)] bg-[var(--planner-surface)] p-1.5 text-[var(--planner-text)] focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-[var(--planner-border)] dark:bg-[var(--planner-surface)] dark:text-white"
          onChange={e=>onChange(moveTaskToBucket(data,record.id,e.target.value))}>
          <option value="">Unassigned</option>
          {(bucket.options??[]).map(name=><option key={name} value={name}>{name}</option>)}
        </select></label>}
    </div>
    <p className="text-xs text-[var(--planner-secondary)] dark:text-[var(--planner-secondary)]">
      Recurring tasks create their next occurrence when marked Completed. Copy creates a separate task.</p>
  </section>;
}
