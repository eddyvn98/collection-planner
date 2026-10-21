import { useState } from "react";
import type { CollectionBlockPayload } from "../collections/model";
import { EMPTY_TASK_FILTERS, countActiveTaskFilters, deleteTaskFilterPreset, saveTaskFilterPreset,
  type TaskDueFilter, type TaskFilterState } from "../collections/collectionPlannerFilters";
import { inputClass, btnClass } from "./CollectionFieldEditor";
interface Props {
  data: CollectionBlockPayload; value: TaskFilterState; readOnly: boolean;
  onChange: (value: TaskFilterState) => void;
  onDataChange: (next: CollectionBlockPayload) => void;
}
export function CollectionTaskFilterBar({data,value,readOnly,onChange,onDataChange}:Props) {
  const [presetName,setPresetName]=useState("");
  const [selected,setSelected]=useState("");
  const [expanded,setExpanded]=useState(false);
  const count=countActiveTaskFilters(value);
  const set=<K extends keyof TaskFilterState>(key:K, val:TaskFilterState[K]) =>
    onChange({...value,[key]:val});
  const bucket=data.fields.find(f=>f.type==="select" && /^bucket$/i.test(f.name.trim()));
  const buckets=[...new Set([...(bucket?.options??[]),
    ...data.records.map(r=>r.values[bucket?.id??""]??"")].filter(Boolean))];
  const presets=data.savedTaskFilters??[];
  const control=inputClass+" min-w-0 max-w-full text-xs";
  const save=()=>{
    const name=presetName.trim();if(!name)return;
    onDataChange(saveTaskFilterPreset(data,name,value));
    setPresetName("");
  };
  return <section aria-label="Task filters" data-testid="planner-filter-bar"
    className="shrink-0 border-b border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
    <button type="button" aria-label="Toggle task filters" aria-expanded={expanded}
      aria-controls="planner-task-filter-fields" onClick={()=>setExpanded(open=>!open)}
      className="flex min-h-9 items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-800 focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 sm:hidden">
      Filters {count>0&&<span aria-label={count+" active filters"} className="rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">{count}</span>}
      <span aria-hidden="true">{expanded?"▴":"▾"}</span>
    </button>
    <div id="planner-task-filter-fields" className={(expanded?"mt-2 block":"hidden")+" space-y-2 sm:mt-0 sm:block"}>
    <div className="flex flex-wrap items-center gap-2">
      <label className="min-w-44 flex-1 text-xs">Search tasks
        <input aria-label="Filter task keyword" className={control+" mt-1 w-full"} placeholder="Search title, notes, fields…"
          value={value.keyword} onChange={e=>set("keyword",e.target.value)}/></label>
      <label className="text-xs">Due
        <select aria-label="Filter due date" className={control+" mt-1 block"} value={value.due}
          onChange={e=>set("due",e.target.value as TaskDueFilter)}>
          <option value="all">Any date</option><option value="overdue">Overdue</option>
          <option value="today">Today</option><option value="next7">Next 7 days</option>
          <option value="no_due">No due date</option>
        </select></label>
      <label className="text-xs">Bucket
        <select aria-label="Filter bucket" className={control+" mt-1 block"} value={value.bucket}
          onChange={e=>set("bucket",e.target.value)}>
          <option value="">All buckets</option><option value="__unassigned__">Unassigned</option>
          {buckets.map(name=><option key={name} value={name}>{name}</option>)}
        </select></label>
      <label className="text-xs">Label
        <select aria-label="Filter label" className={control+" mt-1 block"} value={value.label}
          onChange={e=>set("label",e.target.value)}>
          <option value="">All labels</option>{(data.labels??[]).map(p=><option value={p.id} key={p.id}>{p.name}</option>)}
        </select></label>
      <label className="text-xs">Assignee
        <select aria-label="Filter assignee" className={control+" mt-1 block"} value={value.assignee}
          onChange={e=>set("assignee",e.target.value)}>
          <option value="">All people</option><option value="__unassigned__">Unassigned</option>{(data.people??[]).map(p=><option value={p.id} key={p.id}>{p.name}</option>)}
        </select></label>
      <label className="text-xs">Progress
        <select aria-label="Filter progress" className={control+" mt-1 block"} value={value.progress??""}
          onChange={e=>set("progress",e.target.value)}>
          <option value="">All progress</option><option value="not_started">Not started</option>
          <option value="in_progress">In progress</option><option value="completed">Completed</option>
        </select></label>
      <label className="text-xs">Priority
        <select aria-label="Filter priority" className={control+" mt-1 block"} value={value.priority}
          onChange={e=>set("priority",e.target.value)}>
          <option value="">All priorities</option><option value="urgent">Urgent</option>
          <option value="important">Important</option><option value="medium">Medium</option><option value="low">Low</option>
        </select></label>
      <button className={btnClass+" self-end"} type="button" onClick={()=>onChange({...EMPTY_TASK_FILTERS})}>Clear filters</button>
    </div>
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <label className="flex items-center gap-2">Saved filter
        <select aria-label="Saved task filter" className={control} value={selected}
          onChange={e=>{const id=e.target.value;setSelected(id);
            const preset=presets.find(item=>item.id===id);
            if(preset)onChange({...EMPTY_TASK_FILTERS,...preset.filters});}}>
          <option value="">Choose preset…</option>
          {presets.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
        </select></label>
      {!readOnly&&selected&&<button className="text-red-600 underline" type="button"
        onClick={()=>{onDataChange(deleteTaskFilterPreset(data,selected));setSelected("");}}>Delete preset</button>}
      {!readOnly&&<form className="flex flex-wrap items-center gap-2" onSubmit={e=>{e.preventDefault();save();}}>
        <input aria-label="New filter preset name" className={control} value={presetName}
          onChange={e=>setPresetName(e.target.value)} placeholder="Preset name" maxLength={80}/>
        <button className="rounded-md bg-blue-600 px-3 py-2 font-semibold text-white disabled:opacity-50"
          type="submit" disabled={!presetName.trim()||presets.length>=20 &&
            !presets.some(p=>p.name.toLowerCase()===presetName.trim().toLowerCase())}>Save filter</button>
      </form>}
    </div>
    </div>
  </section>;
}
