import {useEffect,useRef,useState} from "react";
import {createPortal} from "react-dom";
import {bulkUpdateGrid,type GridBulkAction} from "../collections/collectionGridActions";
import {recordTitle,type CollectionBlockPayload} from "../collections/model";
import {setTaskProgress} from "./collectionBoardGroups";
interface Menu{id:string;x:number;y:number}
interface Props{data:CollectionBlockPayload;selected:string[];setSelected:(ids:string[])=>void;
 menu:Menu|null;setMenu:(value:Menu|null)=>void;readOnly:boolean;
 onChange:(next:CollectionBlockPayload)=>void;}
export function CollectionBoardInputBar({data,selected,setSelected,menu,setMenu,readOnly,onChange}:Props){
 const [deleteIds,setDeleteIds]=useState<string[]>([]);
 const menuRef=useRef<HTMLDivElement>(null);
 const previousFocus=useRef<HTMLElement|null>(null);
 const change=(ids:string[],action:GridBulkAction)=>{
  const next=bulkUpdateGrid(data,ids,action,readOnly);
  if(next!==data)onChange(next);
  setSelected([]);setMenu(null);
 };
 useEffect(()=>{
  if(!menu)return;
  previousFocus.current=document.activeElement as HTMLElement;
  const escape=(event:KeyboardEvent)=>{if(event.key==="Escape"){setMenu(null);previousFocus.current?.focus();}};
  const outside=(event:PointerEvent)=>{if(menuRef.current&&!menuRef.current.contains(event.target as Node))setMenu(null);};
  document.addEventListener("keydown",escape);
  document.addEventListener("pointerdown",outside,true);
  menuRef.current?.querySelector<HTMLElement>("button")?.focus();
  return()=>{document.removeEventListener("keydown",escape);document.removeEventListener("pointerdown",outside,true);};
 },[menu?.id,menu?.x,menu?.y]);
 const item=menu?data.records.find(row=>row.id===menu.id):null;
 const contextIds=menu?.id?(selected.includes(menu.id)?selected:[menu.id]):[];
 const apply=(kind:"complete"|"reopen"|"urgent"|"delete")=>{
  const ids=menu?contextIds:selected;
  if(kind==="delete"){setDeleteIds(ids);setMenu(null);return;}
  if(kind==="urgent")change(ids,{kind:"priority",value:"urgent"});
  else change(ids,{kind:"progress",value:kind==="complete"?"completed":"not_started"});
 };
 return <>
  {selected.length>0&&<div role="toolbar" aria-label="Selected task actions" data-testid="planner-bulk-bar"
   className="fixed inset-x-3 bottom-3 z-[10000] mx-auto flex min-h-14 max-w-[680px] flex-wrap items-center justify-center gap-2 rounded-xl border border-[var(--planner-border)] bg-[var(--planner-surface)] p-2 text-sm shadow-xl">
   <span aria-live="polite" className="px-2">{selected.length} selected</span>
   <button type="button" className="min-h-11 rounded px-3 hover:bg-[var(--planner-hover)]"
    onClick={()=>apply("complete")}>Complete selected</button>
   <button type="button" className="min-h-11 rounded px-3 hover:bg-[var(--planner-hover)]"
    onClick={()=>apply("urgent")}>Urgent selected</button>
   <button type="button" className="min-h-11 rounded px-3 text-red-600 hover:bg-[var(--planner-hover)]"
    onClick={()=>apply("delete")}>Delete selected</button>
   <button type="button" className="min-h-11 rounded px-3 hover:bg-[var(--planner-hover)]"
    onClick={()=>setSelected([])}>Clear selection</button>
  </div>}
  {menu&&createPortal(<div ref={menuRef} role="menu" aria-label="Task context actions"
    data-testid="planner-task-context-menu"
    onKeyDown={e=>{if(e.key==="ArrowDown"||e.key==="ArrowUp"){
     e.preventDefault();const buttons=[...e.currentTarget.querySelectorAll<HTMLButtonElement>("button")];
     const i=buttons.indexOf(document.activeElement as HTMLButtonElement);
     buttons[(i+(e.key==="ArrowDown"?1:buttons.length-1))%buttons.length]?.focus();
    }}}
    className="fixed z-[12000] w-56 rounded-lg border border-[var(--planner-border)] bg-[var(--planner-surface)] p-2 text-sm shadow-xl"
    style={{left:Math.max(8,Math.min(menu.x,window.innerWidth-232)),
     top:Math.max(8,Math.min(menu.y,window.innerHeight-260))}}>
    <strong className="block truncate px-3 py-2">{item?recordTitle(data,item):"Task"}</strong>
    <button role="menuitem" className="min-h-11 w-full rounded px-3 text-left hover:bg-[var(--planner-hover)]"
     onClick={()=>{setSelected([...new Set([...selected,menu.id])]);setMenu(null);}}>Select for bulk actions</button>
    <button role="menuitem" className="min-h-11 w-full rounded px-3 text-left hover:bg-[var(--planner-hover)]"
     onClick={()=>apply("complete")}>Complete task</button>
    <button role="menuitem" className="min-h-11 w-full rounded px-3 text-left hover:bg-[var(--planner-hover)]"
     onClick={()=>apply("urgent")}>Mark urgent</button>
    <button role="menuitem" className="min-h-11 w-full rounded px-3 text-left text-red-600 hover:bg-[var(--planner-hover)]"
     onClick={()=>apply("delete")}>Delete task</button>
   </div>,document.body)}
  {deleteIds.length>0&&createPortal(<div className="fixed inset-0 z-[13000] grid place-items-center bg-black/40 p-3">
   <div role="alertdialog" aria-modal="true" aria-label="Delete selected tasks?"
    className="w-full max-w-sm rounded-xl bg-[var(--planner-surface)] p-4 text-[var(--planner-text)] shadow-xl">
    <h3 className="font-semibold">Delete {deleteIds.length} task(s)?</h3>
    <p className="my-2 text-xs">This can be undone using Ctrl+Z.</p>
    <div className="flex justify-end gap-2">
     <button autoFocus type="button" className="min-h-11 rounded px-3" onClick={()=>setDeleteIds([])}>Cancel</button>
     <button type="button" className="min-h-11 rounded bg-red-700 px-3 text-white"
      onClick={()=>{change(deleteIds,{kind:"delete"});setDeleteIds([]);}}>Confirm delete</button>
    </div>
   </div>
  </div>,document.body)}
 </>;
}
