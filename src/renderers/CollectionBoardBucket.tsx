import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Plus, ChevronLeft, ChevronRight, Trash2, Pencil } from "lucide-react";
import { createGroupedTask, type BoardGroup, type BoardGroupBy } from "./collectionBoardGroups";
import { deleteBucket, moveBucket, renameBucket } from "./collectionBoardActions";
import { CollectionTaskCard } from "./CollectionTaskCard";
import type { CollectionBlockPayload, CollectionField } from "../collections/model";
interface Props { data: CollectionBlockPayload; group: BoardGroup; mode: BoardGroupBy; field?: CollectionField;
 readOnly: boolean; onChange: (next: CollectionBlockPayload) => void; onOpen: (id: string) => void; }
export function CollectionBoardBucket({data,group,mode,field,readOnly,onChange,onOpen}: Props) {
 const drop = useDroppable({id:"bucket:"+group.key,disabled:readOnly});
 const [title,setTitle] = useState("");
 const [adding,setAdding] = useState(false);
 const [renaming,setRenaming] = useState(false);
 const [name,setName] = useState(group.title);
 const bucket=group.key.slice(7);
 const canEdit=mode==="bucket"&&!!field&&!!bucket;
 const save=()=>{const next=createGroupedTask(data,title,group.key,mode,field);
  if(next===data)return;onChange(next);setTitle("");setAdding(false);};
 return <section ref={drop.setNodeRef} data-testid="collection-kanban-column" data-status={group.key}
  className={"w-72 shrink-0 self-start rounded-xl bg-slate-100 p-2 dark:bg-slate-900 " +
    (drop.isOver?"ring-2 ring-blue-500":"")}>
  <header className="mb-2 flex items-center gap-1 px-1">
   {renaming&&canEdit?<input autoFocus aria-label="Bucket name" className="min-w-0 flex-1 rounded border p-1 text-sm"
    value={name} onChange={e=>setName(e.target.value)}
    onKeyDown={e=>{if(e.key==="Escape"){setName(bucket);setRenaming(false);}if(e.key==="Enter")e.currentTarget.blur();}}
    onBlur={()=>{if(name!==bucket&&field)onChange(renameBucket(data,field.id,bucket,name));setRenaming(false);}} />
   : <button type="button" disabled={readOnly||!canEdit} onClick={()=>{setName(bucket);setRenaming(true);}}
     className="min-w-0 flex-1 truncate text-left text-sm font-semibold" aria-label={"Rename bucket "+bucket}>{group.title}</button>}
   {canEdit&&!readOnly&&!renaming&&<Pencil className="h-3 w-3 text-slate-400" aria-hidden="true"/>}
  <span className="rounded-full bg-white px-2 py-0.5 text-xs dark:bg-slate-700">{group.rows.length} {group.rows.length === 1 ? "task" : "tasks"}</span>
   {!readOnly&&canEdit&&field&&<div className="flex">
    <button className="rounded p-1 hover:bg-white focus-visible:ring-2 focus-visible:ring-blue-500" title="Move bucket left" aria-label={"Move "+bucket+" left"} onClick={()=>onChange(moveBucket(data,field.id,bucket,-1))}>
      <ChevronLeft className="h-4 w-4"/></button>
    <button className="rounded p-1 hover:bg-white focus-visible:ring-2 focus-visible:ring-blue-500" title="Move bucket right" aria-label={"Move "+bucket+" right"} onClick={()=>onChange(moveBucket(data,field.id,bucket,1))}>
      <ChevronRight className="h-4 w-4"/></button>
    <button className="rounded p-1 text-red-600 hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-500" title="Delete bucket" aria-label={"Delete "+bucket}
      onClick={()=>{if(window.confirm("Move tasks to Unassigned and delete this bucket?"))onChange(deleteBucket(data,field.id,bucket));}}>
      <Trash2 className="h-4 w-4"/></button>
   </div>}
  </header>
  {!readOnly&&(adding?<form className="mb-3 space-y-1" onSubmit={e=>{e.preventDefault();save();}}>
   <input autoFocus aria-label={"New task in "+group.title} className="w-full rounded-lg border p-2 text-sm text-slate-900"
     placeholder="Task name" value={title} onChange={e=>setTitle(e.target.value)} maxLength={300}
     onKeyDown={e=>{if(e.key==="Escape")setAdding(false);}}/>
   <div className="flex gap-2">
    <button type="submit" className="rounded bg-blue-600 px-3 py-1 text-xs text-white">Add task</button>
    <button type="button" className="text-xs" onClick={()=>setAdding(false)}>Cancel</button>
   </div>
  </form>:<button type="button" onClick={()=>setAdding(true)}
    className="mb-3 flex w-full items-center gap-1 rounded-lg border border-blue-100 bg-white p-2 text-left text-sm font-medium text-blue-700 shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-blue-300">
     <Plus className="h-4 w-4"/> Add task</button>)}
  <div aria-label={group.title+" tasks"} className="min-h-10">
   {group.rows.map(record=><CollectionTaskCard key={record.id} groupKey={group.key} data={data} record={record}
    readOnly={readOnly} onOpen={()=>onOpen(record.id)}/>)}
   {!group.rows.length&&<p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-slate-400">Drop a task here</p>}
  </div>
 </section>;
}
