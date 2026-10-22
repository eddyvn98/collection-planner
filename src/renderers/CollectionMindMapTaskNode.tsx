import {memo,useState} from "react";
import {Handle,Position,type Node,type NodeProps} from "@xyflow/react";
import {ChevronDown,ChevronRight,Flag,Plus,CornerDownRight,CalendarDays,CheckCircle2} from "lucide-react";

export interface MindCardData extends Record<string,unknown>{
 label:string;id:string;bucket:string;priority:string;progress:string;
 due:string;assignees:string[];done:number;total:number;isCollapsed:boolean;
 isDropTarget:boolean;readOnly:boolean;isEditing:boolean;
 onAdd:(id:string)=>void;onToggle:(id:string)=>void;
 onSave:(id:string,value:string)=>void;onCancel:()=>void;
}
export type MindCardNode=Node<MindCardData,"plannerTask">;
function MindMapTaskNodeComponent({data,selected}:NodeProps<MindCardNode>){
 const [draft,setDraft]=useState(data.label);
 const commit=()=>data.onSave(data.id,draft);
 const status=data.progress==="completed"?"Completed":data.progress==="in_progress"?"In progress":"Not started";
 return <div data-testid="mindmap-task-node" data-task-id={data.id}
  className={"relative min-w-[205px] max-w-[260px] rounded-lg border-2 bg-[var(--planner-surface)] p-2 text-[var(--planner-text)] shadow-sm transition "+
   (data.isDropTarget?"border-[var(--planner-accent)] ring-4 ring-[var(--planner-accent)]/25":
    selected?"border-[var(--planner-accent)] shadow-md":"border-[var(--planner-border)]")}>
  <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5 !border-[var(--planner-accent)] !bg-[var(--planner-surface)]"/>
  <div className="flex min-h-8 items-start gap-1">
   <span className="mt-0.5 h-5 w-1 shrink-0 rounded-full" style={{backgroundColor:data.progress==="completed"?"#238636":
    data.priority==="urgent"?"#d13438":data.priority==="important"?"#ff8c00":"var(--planner-accent)"}}/>
   {data.isEditing?<input autoFocus aria-label={"Rename "+data.label} defaultValue={data.label}
     onFocus={event=>{event.currentTarget.select();setDraft(event.currentTarget.value);}}
     onChange={event=>setDraft(event.target.value)}
     onKeyDown={event=>{event.stopPropagation();if(event.key==="Enter")commit();
      else if(event.key==="Escape")data.onCancel();}}
     onBlur={commit}
     className="nodrag nopan min-w-0 flex-1 rounded border-2 border-[var(--planner-accent)] bg-transparent px-1 text-xs"/>:
    <strong className="min-w-0 flex-1 break-words text-left text-xs" title={data.label}>{data.label}</strong>}
   {!data.readOnly&&<button type="button" className="nodrag nopan grid h-7 w-7 shrink-0 place-items-center rounded hover:bg-[var(--planner-hover)] focus-visible:ring-2"
     aria-label={"Add child to "+data.label} onClick={event=>{event.stopPropagation();data.onAdd(data.id);}}>
     <Plus size={15}/></button>}
  </div>
  <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px] text-[var(--planner-secondary)]">
   {data.bucket&&<span className="rounded bg-[var(--planner-hover)] px-1.5 py-0.5">{data.bucket}</span>}
   {data.priority!=="medium"&&<span className="inline-flex items-center gap-0.5"><Flag size={11}/>{data.priority}</span>}
   {data.due&&<span className="inline-flex items-center gap-0.5"><CalendarDays size={11}/>{data.due.slice(8)}/{data.due.slice(5,7)}</span>}
   {data.progress==="completed"&&<span className="inline-flex items-center gap-0.5 text-green-600"><CheckCircle2 size={12}/>{status}</span>}
   {data.total>0&&<span data-testid="mindmap-children-badge" className="rounded bg-[var(--planner-hover)] px-1">{data.done}/{data.total}</span>}
   {data.assignees.map((person,i)=><span key={i} title={person} aria-label={"Assigned to "+person}
      className="grid h-5 min-w-5 place-items-center rounded-full bg-[var(--planner-accent)] px-1 text-[9px] text-white">
      {person.slice(0,2).toUpperCase()}</span>)}
  </div>
  {data.total>0&&<button type="button"
   className="nodrag nopan absolute -bottom-4 left-1/2 z-10 flex h-8 min-w-8 -translate-x-1/2 items-center gap-0.5 rounded-full border border-[var(--planner-border)] bg-[var(--planner-surface)] px-2 text-[10px] shadow"
   aria-label={(data.isCollapsed?"Expand ":"Collapse ")+data.label}
   aria-expanded={!data.isCollapsed}
   onClick={event=>{event.stopPropagation();data.onToggle(data.id);}}>
   {data.isCollapsed?<ChevronRight size={12}/>:<ChevronDown size={12}/>}
   {data.total}
  </button>}
  <Handle type="source" position={Position.Right}
   className="!h-3 !w-3 !border-2 !border-[var(--planner-accent)] !bg-[var(--planner-surface)]"
   title={"Drag to empty space to add child of "+data.label}/>
  {data.isDropTarget&&<CornerDownRight size={15} className="absolute -top-4 right-0 text-[var(--planner-accent)]"/>}
 </div>;
}
export const MindMapTaskNode=memo(MindMapTaskNodeComponent);
