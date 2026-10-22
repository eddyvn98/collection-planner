import {flexRender,type Table} from "@tanstack/react-table";
import {Fragment} from "react";
import {viewGroupName} from "../collections/collectionToolbarGrouping";
import {Circle,CheckCircle2,ExternalLink,Trash2} from "lucide-react";
import type {TreeIndex} from "../collections/collectionTaskTree";
import {recordTitle,type CollectionBlockPayload,type CollectionRecord,type CollectionField} from "../collections/model";
import {CollectionGridTreeCell} from "./CollectionGridTreeCell";
import {setTaskProgress} from "./collectionBoardGroups";
import {CollectionGridAddRow} from "./CollectionGridAddRow";
interface Props{table:Table<CollectionRecord>;data:CollectionBlockPayload;readOnly:boolean;
 selected:string[];setSelected:(ids:string[])=>void;collapsed:Set<string>;tree:TreeIndex;
 toggle:(id:string)=>void;onChange:(next:CollectionBlockPayload)=>void;
 onOpen:(id:string)=>void;onDelete:(id:string)=>void;numbers:Set<string>;groupField?:CollectionField;}
export function CollectionGridRows({table,data,readOnly,selected,setSelected,collapsed,toggle,
 onChange,onOpen,onDelete,numbers,tree,groupField}:Props){
 return <tbody>{table.getRowModel().rows.map((row,index,all)=>{
  const title=recordTitle(data,row.original),id=row.original.id;
  return <Fragment key={id}>
  {groupField&&(index===0||all[index-1]?.original.values[groupField.id]!==row.original.values[groupField.id])&&
   <tr data-testid="planner-grid-group"><th colSpan={table.getAllLeafColumns().length+3}
    scope="rowgroup" className="min-h-11 bg-[var(--planner-hover)] px-3 py-2 text-left text-xs font-semibold">
    {groupField.name}: {viewGroupName(row.original,groupField)}</th></tr>}
  <tr data-record-id={id} className="group h-10 border-b border-[var(--planner-border)] hover:bg-[var(--planner-hover)]">
   <td className="p-0.5"><div className="flex items-center gap-1">
    <button type="button" aria-label={(row.original.progress==="completed"?"Reopen ":"Complete ")+title}
     disabled={readOnly} className="grid h-8 w-8 place-items-center rounded-full text-[var(--planner-accent)] hover:bg-[var(--planner-hover)]"
     onClick={()=>onChange(setTaskProgress(data,id,row.original.progress==="completed"?"not_started":"completed"))}>
     {row.original.progress==="completed"?<CheckCircle2 size={18}/>:<Circle size={18}/>}
    </button>
    <input type="checkbox" disabled={readOnly} checked={selected.includes(id)}
     aria-label={"Select task "+title}
     onChange={e=>setSelected(e.target.checked?[...new Set([...selected,id])]:selected.filter(x=>x!==id))}/>
   </div></td>
   {row.getVisibleCells().map((cell,index)=><td key={cell.id} style={{width:cell.column.getSize()}}
     data-grid-field={data.fields.some(f=>f.id===cell.column.id&&["text","date","number","url","select"].includes(f.type))?cell.column.id:undefined}
     className={"p-0.5 "+(numbers.has(cell.column.id)?"text-right":"text-left")}>
     {index===0?<CollectionGridTreeCell data={data} record={row.original}
       collapsed={collapsed.has(id)} readOnly={readOnly} tree={tree} onToggle={toggle} onChange={onChange}>
       {flexRender(cell.column.columnDef.cell,cell.getContext())}
      </CollectionGridTreeCell>:flexRender(cell.column.columnDef.cell,cell.getContext())}
   </td>)}
   <td aria-hidden="true"/>
   <td><div className="flex items-center opacity-0 pointer-events-none transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
    <button type="button" className="grid h-8 w-8 place-items-center rounded hover:bg-[var(--planner-hover)] focus-visible:ring-2"
     title="Open task" aria-label={"Open "+title} onClick={()=>onOpen(id)}><ExternalLink size={14}/></button>
    <button type="button" aria-label={"Delete "+title} title="Delete task"
     className="grid h-8 w-8 place-items-center rounded text-[var(--planner-secondary)] hover:text-rose-600 focus-visible:ring-2"
     disabled={readOnly} onClick={()=>onDelete(id)}><Trash2 size={14}/></button>
   </div></td>
  </tr></Fragment>;
 })}
 <CollectionGridAddRow data={data} colSpan={table.getAllLeafColumns().length+3}
  readOnly={readOnly} onChange={onChange}/>
 </tbody>;
}
