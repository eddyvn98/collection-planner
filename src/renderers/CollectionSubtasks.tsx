import {useMemo,useState} from "react";
import {ChevronDown, Circle, CheckCircle2, Plus} from "lucide-react";
import {buildTaskTree,descendantCounts,MAX_TASK_DEPTH} from "../collections/collectionTaskTree";
import {addSubtask} from "../collections/collectionTreeActions";
import {primaryField,setRecordValue,recordTitle,type CollectionBlockPayload,
 type CollectionRecord} from "../collections/model";
import {setTaskProgress} from "./collectionBoardGroups";
import {setTaskDate,taskDate} from "../collections/collectionTasks";
import {formatPlannerCardDate} from "../collections/collectionDateDisplay";
interface Props{data:CollectionBlockPayload;record:CollectionRecord;readOnly:boolean;
 onChange:(next:CollectionBlockPayload)=>void;onOpen:(id:string)=>void}
export function CollectionSubtasks({data,record,readOnly,onChange,onOpen}:Props){
 const [name,setName]=useState(""),[editing,setEditing]=useState<string|null>(null);
 const tree=useMemo(()=>buildTaskTree(data.records),[data.records]);
 const children=tree.children.get(record.id)??[];
 const count=useMemo(()=>descendantCounts(data.records).get(record.id),[data.records,record.id]);
 const limit=(tree.depth.get(record.id)??MAX_TASK_DEPTH)>=MAX_TASK_DEPTH;
 const title=primaryField(data);
 const save=(child:CollectionRecord,value:string)=>{
  if(title&&value.trim())onChange(setRecordValue(data,child.id,title.id,value.trim()));
  setEditing(null);
 };
 return <details open id="task-subtasks" className="border-b border-[var(--planner-border)] py-3">
  <summary className="flex min-h-10 cursor-pointer items-center gap-2 text-sm font-semibold">
   <ChevronDown size={15}/>Sub-tasks
   <span className="ml-auto text-xs font-normal text-[var(--planner-secondary)]">
    {count?.done??0}/{count?.total??0}</span>
  </summary>
  {!!count?.total&&<div role="progressbar" aria-label="Sub-task completion"
   aria-valuemin={0} aria-valuemax={count.total} aria-valuenow={count.done}
   className="mt-2 h-1.5 rounded bg-[var(--planner-border)]">
   <div className="h-full rounded bg-[var(--planner-accent)]" style={{width:100*count.done/count.total+"%"}}/>
  </div>}
  <div className="mt-2 space-y-1" data-testid="subtask-list">
   {children.map(child=><div key={child.id} data-subtask-id={child.id}
    className="flex flex-wrap items-center gap-1 rounded px-1 py-1 hover:bg-[var(--planner-hover)]">
    <button type="button" disabled={readOnly} aria-label={(child.progress==="completed"?"Reopen ":"Complete ")+recordTitle(data,child)}
     className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[var(--planner-accent)]"
     onClick={()=>onChange(setTaskProgress(data,child.id,child.progress==="completed"?"not_started":"completed"))}>
     {child.progress==="completed"?<CheckCircle2 size={18}/>:<Circle size={18}/>}</button>
    {editing===child.id&&title?<input autoFocus aria-label={"Edit sub-task "+recordTitle(data,child)}
     defaultValue={recordTitle(data,child)} maxLength={300}
     onKeyDown={event=>{if(event.key==="Enter")save(child,event.currentTarget.value);
      if(event.key==="Escape")setEditing(null);}}
     onBlur={event=>save(child,event.target.value)}
     className="min-h-10 min-w-0 flex-1 rounded border-2 border-[var(--planner-accent)] bg-transparent px-2 text-sm"/>:
    <button type="button" onClick={()=>onOpen(child.id)} onDoubleClick={()=>setEditing(child.id)}
      className="min-h-10 min-w-0 flex-1 truncate text-left text-sm hover:text-[var(--planner-accent)]"
      title="Open sub-task (double-click to rename)">{recordTitle(data,child)}</button>}
    {!readOnly&&<button type="button" aria-label={"Rename "+recordTitle(data,child)}
      onClick={()=>setEditing(child.id)} className="rounded p-1 text-xs hover:bg-[var(--planner-border)]">Edit</button>}
    <select aria-label={"Assign "+recordTitle(data,child)} disabled={readOnly} title="Assignee"
      value={child.assigneeIds?.[0]??""} className="max-w-24 bg-transparent text-[11px]"
      onChange={event=>onChange({...data,records:data.records.map(row=>row.id===child.id
       ?{...row,assigneeIds:event.target.value?[event.target.value]:[]}:row)})}>
      <option value="">Unassigned</option>{(data.people??[]).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
    </select>
    <label className="text-[11px] text-[var(--planner-secondary)]">
     <span className="sr-only">Due {recordTitle(data,child)}</span>
     <input type="date" aria-label={"Due "+recordTitle(data,child)}
      disabled={readOnly} value={taskDate(data,child,"due")}
      title={taskDate(data,child,"due")?formatPlannerCardDate(taskDate(data,child,"due")):"Set due date"}
      onChange={event=>onChange(setTaskDate(data,child.id,"due",event.target.value))}
      className="w-[100px] max-w-full rounded bg-transparent text-[11px]"/>
    </label>
   </div>)}
  </div>
  {!readOnly&&<form className="mt-2 flex items-center gap-1" onSubmit={event=>{
   event.preventDefault();const next=addSubtask(data,record.id,name);
   if(next!==data){onChange(next);setName("");}
  }}>
   <input aria-label="New sub-task title" value={name} maxLength={300}
    onChange={e=>setName(e.target.value)} disabled={limit}
    placeholder={limit?"Maximum 6 levels":"Add sub-task · Enter to continue"}
    className="min-h-11 min-w-0 flex-1 rounded-md border border-[var(--planner-border)] bg-transparent px-3 text-sm focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)]"/>
   <button type="submit" disabled={!name.trim()||limit} aria-label="Add sub-task"
    className="grid h-11 w-11 place-items-center rounded bg-[var(--planner-accent)] text-white disabled:opacity-40">
    <Plus size={18}/></button>
  </form>}
  {limit&&<p role="status" className="mt-1 text-xs text-amber-600">Maximum depth: {MAX_TASK_DEPTH} levels.</p>}
 </details>;
}
