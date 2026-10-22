import {useState,type ReactNode} from "react";
import {useDraggable,useDroppable,useDndContext} from "@dnd-kit/core";
import {CSS} from "@dnd-kit/utilities";
import {ChevronDown,ChevronRight,GripVertical,CornerDownRight} from "lucide-react";
import {buildTaskTree} from "../collections/collectionTaskTree";
import {shiftTreeSibling,indentTreeTask,outdentTreeTask,moveTaskTree} from "../collections/collectionTreeActions";
import {recordTitle,type CollectionBlockPayload,type CollectionRecord} from "../collections/model";
interface Props{data:CollectionBlockPayload;record:CollectionRecord;collapsed:boolean;readOnly:boolean;
 onToggle:(id:string)=>void;onChange:(next:CollectionBlockPayload)=>void;children:ReactNode}
const targetId=(mode:string,id:string)=>"tree-target:"+mode+":"+id;
function TreeDropTarget({id,mode}: {id:string;mode:"before"|"after"|"child"}){
 const {active}=useDndContext(),{isOver,setNodeRef}=useDroppable({id:targetId(mode,id),disabled:!active});
 return <div ref={setNodeRef} data-testid={"tree-drop-"+mode}
  aria-label={(mode==="child"?"Make sub-task of ":mode==="before"?"Move before ":"Move after ")+id}
  className={"absolute left-0 right-0 z-10 "+(mode==="before"?"top-0 h-2":mode==="after"?"bottom-0 h-2":"top-2 bottom-2")+
   (!active?" pointer-events-none":isOver?" bg-[var(--planner-accent)]/25 ring-2 ring-[var(--planner-accent)]":" pointer-events-auto bg-transparent")}/>;
}
export function CollectionGridTreeCell({data,record,collapsed,readOnly,onToggle,onChange,children}:Props){
 const [moving,setMoving]=useState(false),[warning,setWarning]=useState("");
 const tree=buildTaskTree(data.records),depth=tree.depth.get(record.id)??1;
 const hasChildren=(tree.children.get(record.id)?.length??0)>0;
 const drag=useDraggable({id:"tree:"+record.id,disabled:readOnly});
 const update=(next:CollectionBlockPayload)=>{
  if(next!==data){setWarning("");onChange(next);}
  else setWarning("Cannot move: cycle, dependency or maximum 6 levels.");
 };
 const keyboard=(event:React.KeyboardEvent<HTMLButtonElement>)=>{
  if(readOnly)return;
  if(event.altKey&&["ArrowUp","ArrowDown","ArrowRight","ArrowLeft"].includes(event.key)){
   event.preventDefault();
   if(event.key==="ArrowUp")update(shiftTreeSibling(data,record.id,-1));
   if(event.key==="ArrowDown")update(shiftTreeSibling(data,record.id,1));
   if(event.key==="ArrowRight")setMoving(true);
   if(event.key==="ArrowLeft")update(outdentTreeTask(data,record.id));
  }else if(event.key==="Tab"){
   event.preventDefault();update(event.shiftKey?outdentTreeTask(data,record.id):indentTreeTask(data,record.id));
  }else if(event.key==="ArrowRight"&&hasChildren&&collapsed){
   event.preventDefault();onToggle(record.id);
  }else if(event.key==="ArrowLeft"&&hasChildren&&!collapsed){
   event.preventDefault();onToggle(record.id);
  }else if(event.key==="Escape"){setMoving(false);}
 };
 return <div className="relative flex min-h-9 min-w-0 items-center gap-0.5" data-tree-depth={depth}>
  <TreeDropTarget id={record.id} mode="before"/>
  <TreeDropTarget id={record.id} mode="after"/>
  <TreeDropTarget id={record.id} mode="child"/>
  <span aria-hidden="true" style={{width:Math.min(depth-1,5)*16}} className="shrink-0"/>
  {hasChildren?<button type="button" aria-label={(collapsed?"Expand ":"Collapse ")+recordTitle(data,record)}
    aria-expanded={!collapsed} onClick={()=>onToggle(record.id)}
    className="relative z-20 grid h-7 w-7 shrink-0 place-items-center rounded hover:bg-[var(--planner-hover)] focus-visible:ring-2">
    {collapsed?<ChevronRight size={15}/>:<ChevronDown size={15}/>}</button>:
    <span aria-hidden="true" className="w-7 shrink-0"/>}
  <button type="button" aria-label={"Move "+recordTitle(data,record)} title="Drag to reorder; Tab indent, Shift+Tab outdent; Alt+arrows"
    disabled={readOnly} onKeyDown={keyboard}
    {...drag.attributes} {...drag.listeners}
    className="relative z-20 grid h-8 w-5 shrink-0 cursor-grab place-items-center rounded text-[var(--planner-secondary)] focus-visible:ring-2"
    style={{transform:CSS.Translate.toString(drag.transform)}}><GripVertical size={14}/></button>
  <div className="relative z-20 min-w-0 flex-1">{children}</div>
  {depth>1&&<CornerDownRight className="shrink-0 text-[var(--planner-secondary)]" size={12} aria-label="Nested task"/>}
  {moving&&<div className="absolute left-6 top-full z-40 w-48 rounded border border-[var(--planner-border)] bg-[var(--planner-surface)] p-2 shadow-xl">
    <label className="block text-xs">Move to parent
     <select autoFocus aria-label={"Move "+recordTitle(data,record)+" to parent"}
      className="mt-1 w-full rounded border bg-[var(--planner-surface)] p-1" onChange={e=>{
       update(moveTaskTree(data,record.id,e.target.value||null,"child"));setMoving(false);
      }} defaultValue="">
      <option value="">Choose task</option>
      {data.records.filter(item=>item.id!==record.id).map(item=><option key={item.id} value={item.id}>{recordTitle(data,item)}</option>)}
     </select></label>
    <button type="button" onClick={()=>setMoving(false)} className="mt-2 text-xs">Cancel</button>
   </div>}
  {warning&&<span role="alert" className="absolute left-4 top-full z-40 bg-[var(--planner-surface)] px-1 text-[10px] text-amber-600">{warning}</span>}
 </div>;
}
