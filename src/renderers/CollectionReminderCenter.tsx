import {useRef,useState} from "react";
import {Bell,X} from "lucide-react";
import {CollectionFloatingPanel} from "./CollectionFloatingPanel";
import {CollectionRecordDetails} from "./CollectionRecordDetails";
import {activeTaskReminders,loadDismissedReminders} from "../collections/collectionReminders";
import {recordTitle,type CollectionBlockPayload} from "../collections/model";
export function CollectionReminderCenter({data,readOnly,onChange}:{
 data:CollectionBlockPayload;readOnly:boolean;onChange:(next:CollectionBlockPayload)=>void;
}){
 const [open,setOpen]=useState(false),[task,setTask]=useState<string|null>(null);
 const [dismissed,setDismissed]=useState(loadDismissedReminders);
 const trigger=useRef<HTMLButtonElement>(null);
 const list=activeTaskReminders(data,undefined,dismissed);
 const dismiss=(id:string)=>{const next=[...dismissed,id];setDismissed(next);
  try{localStorage.setItem("planner:reminders:dismissed",JSON.stringify(next.slice(-500)));}catch{}};
 return <div className="relative">
  <button ref={trigger} aria-label={"Notifications ("+list.length+")"}
   aria-expanded={open} title="Overdue and due today" onClick={()=>setOpen(!open)}
   className="relative grid h-10 w-10 place-items-center rounded hover:bg-[var(--planner-hover)] focus-visible:ring-2">
   <Bell size={16}/>{list.length>0&&<span className="absolute right-0 top-0 rounded-full bg-red-700 px-1 text-[10px] text-white">{list.length}</span>}
  </button>
  <CollectionFloatingPanel open={open} anchorRef={trigger} onClose={()=>setOpen(false)}
   role="dialog" label="Task notifications" className="w-[min(340px,calc(100vw-16px))] rounded-lg p-3">
   <h3 className="mb-2 text-sm font-semibold">Due reminders ({list.length})</h3>
   {!list.length&&<p className="text-sm text-[var(--planner-secondary)]">Nothing needs attention.</p>}
   {list.map(item=><div key={item.id} className="flex items-center gap-1 border-b border-[var(--planner-border)] py-1">
    <button className="min-h-10 min-w-0 flex-1 text-left text-sm hover:text-[var(--planner-accent)]"
     onClick={()=>{setOpen(false);setTask(item.record.id);}}>
      <span className="font-medium">{recordTitle(data,item.record)}</span>
      <span className="block text-xs text-[var(--planner-secondary)]">{item.kind==="overdue"?"Overdue":"Due today"} · {item.due}</span>
    </button>
    <button aria-label={"Dismiss "+recordTitle(data,item.record)} className="grid h-9 w-9 place-items-center rounded hover:bg-[var(--planner-hover)]"
      onClick={()=>dismiss(item.id)}><X size={15}/></button>
   </div>)}
  </CollectionFloatingPanel>
  {task&&<CollectionRecordDetails data={data} recordId={task} readOnly={readOnly}
    onChange={onChange} onClose={()=>setTask(null)} returnFocusTo={trigger.current}/>}
 </div>;
}
