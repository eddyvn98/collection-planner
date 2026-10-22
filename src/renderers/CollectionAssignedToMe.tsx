import {useRef,useState} from "react";
import {CalendarDays,CheckCircle2} from "lucide-react";
import {groupAssignedTasks,MY_TASK_GROUPS} from "../collections/collectionMyTasks";
import {recordTitle,type CollectionBlockPayload} from "../collections/model";
import {setTaskProgress} from "./collectionBoardGroups";
import {CollectionRecordDetails} from "./CollectionRecordDetails";
import {taskDate} from "../collections/collectionTasks";
export function CollectionAssignedToMe({data,personId,readOnly,onChange}:{
 data:CollectionBlockPayload;personId:string;readOnly:boolean;onChange:(next:CollectionBlockPayload)=>void;
}){
 const [openId,setOpenId]=useState<string|null>(null);
 const opener=useRef<HTMLButtonElement|null>(null);
 const groups=groupAssignedTasks(data,personId);
 return <section className="min-h-0 flex-1 space-y-4 overflow-auto" aria-label="Assigned to me">
  <h2 className="text-xl font-semibold">Assigned to me</h2>
  {MY_TASK_GROUPS.map(name=><div key={name} className="space-y-1 rounded-lg border border-[var(--planner-border)] bg-[var(--planner-surface)] p-3">
   <h3 className="text-sm font-semibold">{name} ({groups[name].length})</h3>
   {groups[name].map(record=><div key={record.id} className="flex items-center gap-2 border-t border-[var(--planner-border)] py-1">
    <button title="Mark complete" aria-label={"Complete "+recordTitle(data,record)} disabled={readOnly}
     onClick={()=>onChange(setTaskProgress(data,record.id,"completed"))}
     className="grid h-10 w-10 place-items-center text-[var(--planner-accent)]"><CheckCircle2 size={17}/></button>
    <button className="min-h-10 flex-1 text-left text-sm hover:text-[var(--planner-accent)]"
     onClick={e=>{opener.current=e.currentTarget;setOpenId(record.id);}}>{recordTitle(data,record)}</button>
    <span className="flex items-center gap-1 text-xs text-[var(--planner-secondary)]"><CalendarDays size={14}/>{taskDate(data,record,"due")}</span>
   </div>)}
  </div>)}
  {openId&&<CollectionRecordDetails data={data} recordId={openId} readOnly={readOnly}
    returnFocusTo={opener.current} onChange={onChange} onClose={()=>setOpenId(null)}/>}
 </section>;
}
