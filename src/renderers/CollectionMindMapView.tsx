"use client";
import {useEffect,useMemo,useRef,useState,type KeyboardEvent} from "react";
import {Background,Controls,MiniMap,Position,ReactFlow,type ReactFlowInstance,
 type Node, type Edge, type Connection} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {Maximize,Plus,Trash2,WandSparkles,Pencil,ArrowRight} from "lucide-react";
import type {CollectionBlockPayload,CollectionRecord} from "../collections/model";
import {deleteRecord,recordTitle,setParent} from "../collections/model";
import {buildTaskTree,canSetTaskParent,descendantCounts,isTreeAncestor,MAX_VISIBLE_TREE_NODES} from "../collections/collectionTaskTree";
import {layoutMindMap} from "./collectionMindMapLayout";
import {visibleMindMapSelection} from "./collectionMindMapSelection";
import {addMindMapRelative,renameMindMapTask,visibleMindMapRecords,candidateMindMapParent} from "./collectionMindMapActions";
import {MindMapTaskNode,type MindCardNode,type MindCardData} from "./CollectionMindMapTaskNode";
import {CollectionModalDialog} from "./CollectionModalDialog";
import {CollectionInlineHistory,type CollectionInlineHistoryProps} from "./CollectionInlineHistory";
import {hintClass,inputClass} from "./CollectionFieldEditor";
interface Props{rows:CollectionRecord[];data:CollectionBlockPayload;readOnly:boolean;
 onChange:(next:CollectionBlockPayload)=>void;history?:CollectionInlineHistoryProps}
const nodeTypes={plannerTask:MindMapTaskNode};
const fit={padding:0.18,duration:200};
type DragPointer={clientX:number;clientY:number}|{changedTouches:TouchList};
export function MindMapView({rows,data,readOnly,onChange,history}:Props){
 const [selectedId,setSelectedId]=useState<string|null>(null),[page,setPage]=useState(0);
 const [collapsed,setCollapsed]=useState<Set<string>>(()=>new Set());
 const [editingId,setEditingId]=useState<string|null>(null);
 const [dropTarget,setDropTarget]=useState<string|null>(null);
 const [dragPositions,setDragPositions]=useState<Record<string,{x:number;y:number}>>({});
 const [selectedIds,setSelectedIds]=useState<string[]>([]);
 const [deleteId,setDeleteId]=useState<string|null>(null);
 const [warning,setWarning]=useState(""),[layoutEpoch,setLayoutEpoch]=useState(0);
 const [flow,setFlow]=useState<ReactFlowInstance|null>(null);
 const root=useRef<HTMLDivElement>(null),connectionStart=useRef<string|null>(null);
 const pointerDrag=useRef<{id:string;x:number;y:number}|null>(null);
 const pointerHandled=useRef(false);
 const visible=useMemo(()=>visibleMindMapRecords(data,rows,collapsed),[data,rows,collapsed]);
 const PAGE_SIZE=MAX_VISIBLE_TREE_NODES,pageCount=Math.max(1,Math.ceil(visible.length/PAGE_SIZE));
 const currentPage=Math.min(page,pageCount-1);
 const graph=useMemo(()=>layoutMindMap(visible,PAGE_SIZE,currentPage*PAGE_SIZE),
  [visible,currentPage,layoutEpoch]);
 const selected=visibleMindMapSelection(visible,selectedId,currentPage,PAGE_SIZE);
 const tree=useMemo(()=>buildTaskTree(data.records),[data.records]);
 const counts=useMemo(()=>descendantCounts(data.records),[data.records]);
 const labels=useMemo(()=>new Map(data.records.map(row=>[row.id,recordTitle(data,row)])),[data]);
 const select=(id:string)=>{setSelectedId(id);
  const index=visible.findIndex(row=>row.id===id);if(index>=0)setPage(Math.floor(index/PAGE_SIZE));};
 const change=(next:CollectionBlockPayload)=>{
  if(next===data){setWarning("Cannot change hierarchy: cycle, dependency or maximum depth of 6.");return;}
  setWarning("");onChange(next);
 };
 const add=(id:string,mode:"child"|"sibling")=>{
  const next=addMindMapRelative(data,id,mode);
  if(next===data){setWarning("Cannot add: maximum depth is 6.");return;}
  const added=next.records.find(row=>!data.records.some(old=>old.id===row.id));
  if(added){const hidden=new Set(collapsed);hidden.delete(mode==="child"?id:added.parentId??"");
    setCollapsed(hidden);setSelectedId(added.id);setEditingId(added.id);}
  change(next);
 };
 const save=(id:string,value:string)=>{
  setEditingId(null);const next=renameMindMapTask(data,id,value);
  if(next!==data)onChange(next);
 };
 const toggle=(id:string)=>{
  // Commit the focused editor before hiding its branch. React Flow can
  // remount the clicked control if blur saves synchronously on pointer-down.
  const editor=root.current?.querySelector<HTMLInputElement>("input[data-mindmap-rename]");
  const editing=editor?.dataset.mindmapRename;
  if(editing){
   const next=renameMindMapTask(data,editing,editor.value);
   setEditingId(null);
   if(next!==data)onChange(next);
  }
  setCollapsed(previous=>{
   const next=new Set(previous);if(next.has(id))next.delete(id);else next.add(id);return next;
  });
 };
 const nodes=useMemo<MindCardNode[]>(()=>graph.nodes.map(item=>{
  const record=tree.byId.get(item.id),count=counts.get(item.id)??{done:0,total:0};
  const due=data.fields.find(f=>f.type==="date"&&/^(due|end)/i.test(f.name))?.id;
  const bucket=data.fields.find(f=>f.type==="select"&&/bucket/i.test(f.name))?.id;
  const nodeData:MindCardData={id:item.id,label:labels.get(item.id)??"Untitled",
   bucket:record?.values[bucket??""]??"",priority:record?.priority??"medium",
   progress:record?.progress??"not_started",due:record?.values[due??""]??"",
   assignees:(record?.assigneeIds??[]).flatMap(id=>data.people?.filter(p=>p.id===id).map(p=>p.name)??[]),
   done:count.done,total:count.total,isCollapsed:collapsed.has(item.id),
   isDropTarget:dropTarget===item.id,readOnly,isEditing:editingId===item.id,
   onAdd:id=>add(id,"child"),onToggle:toggle,onSave:save,onCancel:()=>setEditingId(null)};
  return {id:item.id,type:"plannerTask",position:dragPositions[item.id]??{x:item.x,y:item.y},data:nodeData,
   sourcePosition:Position.Right,targetPosition:Position.Left,
   draggable:!readOnly,selectable:true};
 }),[graph,labels,tree,counts,data,collapsed,dropTarget,readOnly,editingId,dragPositions]);
 const edges=useMemo<Edge[]>(()=>graph.edges.map(link=>({
  id:link.source+">"+link.target,source:link.source,target:link.target,
  type:"smoothstep",style:{stroke:"var(--planner-accent)",strokeWidth:1.5}
 })),[graph]);
 const structure=graph.nodes.map(n=>n.id+":"+n.parentId).join("|");
 // React Flow mounts new nodes asynchronously. Keep focus on the rename editor.
 useEffect(()=>{
  if(!editingId)return;
  let frame=0,attempt=0,stopped=false;
  const focus=()=>{
   if(stopped)return;
   const inputs=root.current?.querySelectorAll<HTMLInputElement>("input[data-mindmap-rename]");
   const input=Array.from(inputs??[]).find(el=>el.dataset.mindmapRename===editingId);
   if(input&&document.activeElement!==input){input.focus({preventScroll:true});input.select();}
   // React Flow and the toolbar can restore focus after the node has mounted.
   // Retry only during the short mount transition; real interaction cancels it.
   if(++attempt<30)frame=requestAnimationFrame(focus);
  };
  const stop=()=>{stopped=true;cancelAnimationFrame(frame);};
  document.addEventListener("pointerdown",stop,true);
  document.addEventListener("keydown",stop,true);
  frame=requestAnimationFrame(focus);
  return()=>{stop();document.removeEventListener("pointerdown",stop,true);
   document.removeEventListener("keydown",stop,true);};
 },[editingId,graph.nodes.length,data.records.length]);
 useEffect(()=>{
  if(!flow||!root.current||editingId)return;
  const node=root.current;
  const refresh=()=>requestAnimationFrame(()=>{if(node.clientWidth>0&&node.clientHeight>0)
   void flow.fitView(fit);});
  const observer=new ResizeObserver(refresh);observer.observe(node);refresh();
  return()=>observer.disconnect();
 },[flow,structure,layoutEpoch,editingId]);
 const dragTarget=(id:string,x:number,y:number)=>
  candidateMindMapParent(data,id,graph.nodes,x,y);
 const pointerTarget=(id:string,event:DragPointer)=>{
  const p="changedTouches" in event?event.changedTouches[0]:event;
  const choices=[...root.current?.querySelectorAll<HTMLElement>(".react-flow__node[data-id]")??[]]
   .filter(el=>el.dataset.id!==id&&el.dataset.id&&canSetTaskParent(data.records,id,el.dataset.id))
   .map(el=>{const rect=el.getBoundingClientRect();
    const dx=Math.max(rect.left-p.clientX,0,p.clientX-rect.right);
    const dy=Math.max(rect.top-p.clientY,0,p.clientY-rect.bottom);
    return {id:el.dataset.id!,distance:Math.hypot(dx,dy)};})
   .sort((a,b)=>a.distance-b.distance);
  return (choices[0]?.distance??Infinity)<=32?choices[0].id:null;
 };
 const drop=(id:string,x:number,y:number,event:DragPointer)=>{
  const target=pointerTarget(id,event)??dragTarget(id,x,y);
  setDropTarget(null);setDragPositions({});
  if(!target||readOnly)return;
  const moving=selectedIds.includes(id)?selectedIds.filter(current=>
   !selectedIds.some(other=>other!==current&&isTreeAncestor(tree,other,current))):[id];
  let next=data;
  for(const current of moving){
   if(current===target)continue;
   const updated=setParent(next,current,target);
   if(updated===next){setWarning("Cannot reparent: cycle, dependency or maximum depth of 6.");return;}
   next=updated;
  }
  change(next);
 };
 const connect=(connection:Connection)=>{
  if(!connection.source||!connection.target||readOnly)return;
  change(setParent(data,connection.target,connection.source));
 };
 const endConnection=(event:MouseEvent|TouchEvent)=>{
  const from=connectionStart.current;connectionStart.current=null;
  if(!from||readOnly)return;
  const pointer="changedTouches" in event?event.changedTouches[0]:event;
  const el=document.elementFromPoint(pointer.clientX,pointer.clientY);
  if(el?.closest(".react-flow__node"))return;
  add(from,"child");
 };
 const keyboard=(event:KeyboardEvent<HTMLDivElement>)=>{
  if(readOnly||event.target instanceof HTMLInputElement||event.target instanceof HTMLSelectElement)return;
  const id=selected?.id;if(!id)return;
  if(event.key==="F2"){event.preventDefault();event.stopPropagation();setEditingId(id);}
  else if(event.key==="Tab"&&!(event.target instanceof HTMLButtonElement)){
   event.preventDefault();event.stopPropagation();add(id,"child");
  }else if(event.key==="Enter"&&!(event.target instanceof HTMLButtonElement)){
   event.preventDefault();event.stopPropagation();add(id,"sibling");
  }else if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(event.key)){
   const siblings=graph.nodes.map(node=>node.id),index=siblings.indexOf(id);
   const next=event.key==="ArrowLeft"?tree.byId.get(id)?.parentId:
    event.key==="ArrowRight"?tree.children.get(id)?.[0]?.id:
    siblings[index+(event.key==="ArrowDown"?1:-1)];
   if(next){event.preventDefault();event.stopPropagation();select(next);}
  }
 };
 const tidy=()=>{setDragPositions({});setLayoutEpoch(n=>n+1);void flow?.fitView(fit);};
 return <div className="flex min-h-0 w-full min-w-0 flex-col gap-2" data-testid="collection-mindmap">
  <div className="flex flex-wrap items-center gap-1.5 text-xs">
   <span className={hintClass}>Drag node onto another to reparent · Tab adds child · Enter sibling · F2 rename · Shift selects multiple</span>
   {selected&&<><button type="button" aria-label="Add child node" disabled={readOnly}
    className="min-h-11 rounded border border-[var(--planner-border)] px-2" onPointerDown={event=>{if(event.pointerType==="mouse")event.preventDefault();}} onClick={()=>add(selected.id,"child")}><Plus size={14} className="inline"/> Child</button>
    <button type="button" aria-label="Add sibling node" disabled={readOnly}
     className="min-h-11 rounded border border-[var(--planner-border)] px-2" onPointerDown={event=>{if(event.pointerType==="mouse")event.preventDefault();}} onClick={()=>add(selected.id,"sibling")}>Sibling</button>
    <button type="button" aria-label="Rename selected node" disabled={readOnly}
     className="min-h-11 rounded border border-[var(--planner-border)] px-2" onClick={()=>setEditingId(selected.id)}><Pencil size={14} className="inline"/> Rename</button>
    <button type="button" aria-label="Delete selected node" disabled={readOnly}
     className="min-h-11 rounded border border-[var(--planner-border)] px-2 text-rose-600" onClick={()=>setDeleteId(selected.id)}><Trash2 size={14}/></button></>}
   <button type="button" aria-label="Tidy up Mind Map" className="min-h-11 rounded border border-[var(--planner-border)] px-2" onClick={tidy}><WandSparkles size={14} className="inline"/> Tidy up</button>
   <button type="button" aria-label="Fit Mind Map" className="min-h-11 rounded border border-[var(--planner-border)] px-2"
    onClick={()=>void flow?.fitView(fit)}><Maximize size={14}/></button>
   {history&&<CollectionInlineHistory {...history}/>}
   <select aria-label="Mind Map selected record" className={inputClass+" min-h-11"} value={selected?.id??""}
    onChange={event=>select(event.target.value)}>
    {rows.map(row=><option key={row.id} value={row.id}>{labels.get(row.id)??"Untitled"}</option>)}
   </select>
  </div>
  {pageCount>1&&<div aria-label="Mind Map pages" className="flex items-center gap-2 text-xs">
   <button className="min-h-11 rounded px-3" disabled={currentPage===0} onClick={()=>setPage(currentPage-1)}>Previous</button>
   <span>Page {currentPage+1} of {pageCount} ({visible.length} visible)</span>
   <button className="min-h-11 rounded px-3" disabled={currentPage>=pageCount-1} onClick={()=>setPage(currentPage+1)}>Next</button>
  </div>}
  {selected&&<label className="text-xs">Parent of {recordTitle(data,selected)}
   <select aria-label={"Parent of "+recordTitle(data,selected)} disabled={readOnly}
    className={inputClass+" ml-2 min-h-11"} value={selected.parentId??""}
    onChange={event=>change(setParent(data,selected.id,event.target.value||null))}>
    <option value="">Root</option>
    {rows.filter(row=>row.id!==selected.id).map(row=>
     <option key={row.id} value={row.id}>{labels.get(row.id)??"Untitled"}</option>)}
   </select>
  </label>}
  {warning&&<p role="alert" className="text-xs text-amber-600">{warning}</p>}
  <div ref={root} tabIndex={0} onKeyDownCapture={keyboard}
   onPointerDownCapture={event=>{
    pointerHandled.current=false;
    const element=event.target as HTMLElement;
    if(element.closest("button,input,select,.react-flow__handle,.nodrag"))return;
    const dragged=element.closest<HTMLElement>(".react-flow__node[data-id]");
    pointerDrag.current=dragged?.dataset.id?{id:dragged.dataset.id,x:event.clientX,y:event.clientY}:null;
   }}
   onPointerUpCapture={event=>{
    const dragged=pointerDrag.current;pointerDrag.current=null;
    if(!dragged||readOnly||Math.hypot(event.clientX-dragged.x,event.clientY-dragged.y)<16)return;
    if(!pointerTarget(dragged.id,event))return;
    pointerHandled.current=true;
    drop(dragged.id,NaN,NaN,event);
   }}
   onPointerCancelCapture={()=>{pointerDrag.current=null;pointerHandled.current=false;}}
   className="relative h-[520px] min-h-[420px] w-full shrink-0 overflow-hidden rounded-lg border border-[var(--planner-border)] bg-[var(--planner-surface)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)]"
   data-testid="collection-mindmap-graph">
   <ReactFlow style={{width:"100%",height:"100%"}} nodes={nodes} edges={edges}
    nodeTypes={nodeTypes} fitView fitViewOptions={fit} minZoom={0.15} maxZoom={2}
    nodesDraggable={!readOnly} nodesConnectable={!readOnly} selectNodesOnDrag={false}
    multiSelectionKeyCode="Shift" selectionOnDrag panOnDrag={[1,2]}
    onInit={setFlow} onNodeClick={(_event,node)=>select(node.id)}
    onNodeDoubleClick={(_event,node)=>{select(node.id);setEditingId(node.id);}}
    onNodeDrag={(event,node)=>{setDragPositions(previous=>({...previous,[node.id]:node.position}));
     setDropTarget(pointerTarget(node.id,event)??dragTarget(node.id,node.position.x,node.position.y));}}
    onNodeDragStop={(event,node)=>{
     if(pointerHandled.current){pointerHandled.current=false;setDragPositions({});setDropTarget(null);}
     else drop(node.id,node.position.x,node.position.y,event);
    }}
    onSelectionChange={({nodes})=>setSelectedIds(nodes.map(n=>n.id))}
    onConnect={connect}
    onConnectStart={(_event,params)=>{connectionStart.current=params.nodeId??null;}}
    onConnectEnd={endConnection} proOptions={{hideAttribution:true}}>
    <Background color="var(--planner-border)" gap={18}/>
    <Controls showInteractive={false} className="!rounded-lg !border !border-[var(--planner-border)] !bg-[var(--planner-surface)] [&>button]:!h-11 [&>button]:!w-11 [&>button]:!bg-[var(--planner-surface)] [&>button]:!fill-[var(--planner-text)]"/>
    <MiniMap pannable zoomable nodeColor="var(--planner-accent)" maskColor="var(--planner-hover)" style={{background:"var(--planner-surface)"}}/>
   </ReactFlow>
  </div>
  {deleteId&&<CollectionModalDialog label="Delete Mind Map branch?" onClose={()=>setDeleteId(null)}>
   <h2 className="text-sm font-semibold">Delete “{labels.get(deleteId)}”?</h2>
   <p className="mt-2 text-xs">Keep its children by promoting them, or delete the whole branch.</p>
   <div className="mt-3 flex flex-wrap justify-end gap-2">
    <button data-dialog-initial type="button" className="min-h-11 rounded border px-3" onClick={()=>setDeleteId(null)}>Cancel</button>
    <button type="button" className="min-h-11 rounded border px-3" onClick={()=>{change(deleteRecord(data,deleteId,"promote"));setDeleteId(null);}}>Promote children</button>
    <button type="button" className="min-h-11 rounded bg-rose-700 px-3 py-2 text-white" onClick={()=>{
     change(deleteRecord(data,deleteId,"subtree"));setDeleteId(null);}}>Delete branch</button>
   </div>
  </CollectionModalDialog>}
 </div>;
}
