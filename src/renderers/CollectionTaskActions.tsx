import type { CollectionBlockPayload, CollectionRecord } from "../collections/model";
import { copyTask, moveTaskToBucket, setRecurrence, type TaskRecurrence } from "../collections/collectionRecurrence";
import { plannerBucket } from "../collections/collectionPlannerFields";
export function CollectionTaskActions({data,record,readOnly,onChange}: {
  data:CollectionBlockPayload; record:CollectionRecord; readOnly:boolean;
  onChange:(next:CollectionBlockPayload)=>void;
}) {
  const bucket=plannerBucket(data);
  return <section aria-label="Task actions" className="space-y-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
    <h3 className="text-sm font-semibold">Task actions</h3>
    <div className="flex flex-wrap items-center gap-3">
      <label className="text-xs">Repeat
        <select aria-label="Task recurrence" value={record.recurrence??"none"} disabled={readOnly}
          className="ml-2 rounded-md border border-slate-300 bg-white p-1.5 text-slate-900 focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          onChange={e=>onChange(setRecurrence(data,record.id,e.target.value as TaskRecurrence))}>
          <option value="none">None</option><option value="daily">Daily</option>
          <option value="weekly">Weekly</option><option value="monthly">Monthly</option>
        </select>
      </label>
      <button type="button" disabled={readOnly} onClick={()=>onChange(copyTask(data,record.id))}
        className="rounded-md border px-3 py-1.5 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50">
        Copy task
      </button>
      {bucket&&<label className="text-xs">Move to bucket
        <select aria-label="Move task to bucket" value={record.values[bucket.id]??""} disabled={readOnly}
          className="ml-2 rounded-md border border-slate-300 bg-white p-1.5 text-slate-900 focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          onChange={e=>onChange(moveTaskToBucket(data,record.id,e.target.value))}>
          <option value="">Unassigned</option>
          {(bucket.options??[]).map(name=><option key={name} value={name}>{name}</option>)}
        </select></label>}
    </div>
    <p className="text-xs text-slate-500 dark:text-slate-400">
      Recurring tasks create their next occurrence when marked Completed. Copy creates a separate task.</p>
  </section>;
}
