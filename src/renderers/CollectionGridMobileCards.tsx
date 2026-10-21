import { PROGRESS, PRIORITIES, taskAssignees, updateTask } from "../collections/collectionTasks";
import { setTaskProgress } from "./collectionBoardGroups";
import { recordTitle, type CollectionBlockPayload, type CollectionRecord, type TaskPriority, type TaskProgress } from "../collections/model";
interface Props {
  data:CollectionBlockPayload; rows:CollectionRecord[]; selected:string[]; readOnly:boolean;
  onSelect:(id:string,checked:boolean)=>void; onOpen:(id:string)=>void;
  onChange:(next:CollectionBlockPayload)=>void;
}
export function CollectionGridMobileCards({data,rows,selected,readOnly,onSelect,onOpen,onChange}:Props) {
  return <div data-testid="collection-mobile-grid" className="space-y-2 p-2 sm:hidden">
    {rows.map(record=>{
      const people=taskAssignees(data,record);
      const labels=(data.labels??[]).filter(label=>record.labelIds?.includes(label.id));
      return <article key={record.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <header className="flex items-start gap-2">
          <input aria-label={"Select task "+recordTitle(data,record)} type="checkbox" checked={selected.includes(record.id)}
            disabled={readOnly} onChange={e=>onSelect(record.id,e.target.checked)} className="mt-1"/>
          <button type="button" aria-label={"Open "+recordTitle(data,record)}
            onClick={()=>onOpen(record.id)} className="min-w-0 flex-1 text-left text-sm font-semibold focus-visible:ring-2 focus-visible:ring-blue-500">
            {recordTitle(data,record)}</button>
        </header>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="text-xs">Progress
            <select aria-label={"Progress for "+record.id} value={record.progress??"not_started"} disabled={readOnly}
              className="mt-1 w-full rounded-md border bg-white p-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              onChange={e=>onChange(setTaskProgress(data,record.id,e.target.value as TaskProgress))}>
              {PROGRESS.map(p=><option key={p.value} value={p.value}>{p.label}</option>)}
            </select></label>
          <label className="text-xs">Priority
            <select aria-label={"Priority for "+record.id} value={record.priority??"medium"} disabled={readOnly}
              className="mt-1 w-full rounded-md border bg-white p-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              onChange={e=>onChange(updateTask(data,record.id,{priority:e.target.value as TaskPriority},"Changed priority"))}>
              {PRIORITIES.map(p=><option key={p.value} value={p.value}>{p.label}</option>)}
            </select></label>
          <div className="min-w-0 text-xs"><strong>Assignees</strong>
            <div className="mt-1 flex flex-wrap gap-1">{people.length ? people.map(p=>
              <span key={p.id} className="rounded bg-blue-100 px-1.5 py-1 text-blue-900">{p.name}</span>)
              : <span className="text-slate-500">Unassigned</span>}</div></div>
          <div className="min-w-0 text-xs"><strong>Labels</strong>
            <div className="mt-1 flex flex-wrap gap-1">{labels.length ? labels.map(p=>
              <span key={p.id} className="rounded px-1.5 py-1 text-white"
                style={{backgroundColor:/^#[0-9a-f]{6}$/i.test(p.color)?p.color:"#475569"}}>{p.name}</span>)
              : <span className="text-slate-500">No labels</span>}</div></div>
        </div>
      </article>;
    })}
    {!rows.length&&<p role="status" className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-500">
      No matching tasks. Change your filters or add a task.</p>}
  </div>;
}
