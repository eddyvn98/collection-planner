import { useRef, useState } from "react";
import { CollectionFloatingPanel } from "./CollectionFloatingPanel";
import { Filter, X, Save } from "lucide-react";
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
  const trigger=useRef<HTMLButtonElement>(null);
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
  return <div className="relative">
    <button ref={trigger} type="button" style={{minWidth:44,minHeight:44}} aria-label="Filters" aria-haspopup="dialog" aria-expanded={expanded}
      onClick={()=>setExpanded(!expanded)}
      className="inline-flex h-11 min-h-11 w-11 min-w-11 items-center justify-center gap-1 rounded-md px-1 sm:w-auto sm:px-2 text-sm text-[var(--planner-secondary)] hover:bg-[var(--planner-hover)] focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)]">
      <Filter size={16} strokeWidth={1.75}/> <span className="hidden sm:inline">Filter</span>
      {count>0&&<span aria-label={count+" active filters"} className="rounded-full bg-[var(--planner-accent)] px-1.5 text-xs text-white">{count}</span>}
    </button>
    <CollectionFloatingPanel open={expanded} anchorRef={trigger} onClose={()=>setExpanded(false)}
      role="dialog" label="Task filters" className="w-[min(360px,calc(100vw-16px))] rounded-lg p-3">
      <div data-testid="planner-filter-panel">
      <div className="mb-3 flex items-center justify-between">
        <strong className="text-sm">Filter tasks</strong>
        <button aria-label="Close filters" type="button" onClick={()=>setExpanded(false)}
          className="rounded p-2 hover:bg-[var(--planner-hover)]"><X size={16}/></button>
      </div>
    <fieldset aria-label="Quick assignee filters" className="mb-2 border-b border-[var(--planner-border)] pb-2">
      <legend className="text-xs font-semibold">Filter by person · 2 clicks</legend>
      <div className="flex max-h-40 flex-wrap gap-1 overflow-y-auto pt-1">
       {([{id:"",name:"Everyone"},...(data.people??[])]).map(person=>
        <button type="button" key={person.id} aria-label={"Filter for "+person.name}
         aria-pressed={value.assignee===person.id} onClick={()=>{
          set("assignee",person.id);setExpanded(false);
         }}
         className="min-h-11 rounded-full border border-[var(--planner-border)] px-3 text-xs hover:bg-[var(--planner-hover)] aria-pressed:bg-[var(--planner-accent)] aria-pressed:text-white">
         {person.name}</button>)}
      </div>
    </fieldset>
    <div className="flex flex-col gap-2">
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
    <div className="mt-4 border-t border-[var(--planner-border)] pt-3 text-xs"><strong>Saved filters</strong><div className="mt-2 flex flex-wrap items-center gap-2">
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
            !presets.some(p=>p.name.toLowerCase()===presetName.trim().toLowerCase())}><Save size={16} strokeWidth={1.75} className="inline-block"/> Save filter</button>
      </form>}
    </div></div>
      </div>
    </CollectionFloatingPanel>
  </div>;
}
