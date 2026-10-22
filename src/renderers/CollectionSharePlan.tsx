import {useEffect,useState} from "react";
import {Share2,CheckCircle2,AlertCircle} from "lucide-react";
export function CollectionSharePlan(){
 const [message,setMessage]=useState("");
 const [manual,setManual]=useState(false);
 const share=async()=>{
  // Feedback is immediate even if browser clipboard permission is pending.
  // Keep a selectable URL fallback until the host confirms the write.
  setMessage("Copying page link… Plan data stays on this device.");
  setManual(true);
  try{
   if(!navigator.clipboard?.writeText)throw new Error("Clipboard unavailable");
   await navigator.clipboard.writeText(window.location.href);
   setMessage("Link copied. Plan data stays on this device; this link does not share tasks.");
   setManual(false);
  }catch{
   setMessage("Copy unavailable. Select the link below to copy manually. Plan data stays local.");
   setManual(true);
  }
 };
 useEffect(()=>{
  const requested=()=>{void share();};
  document.addEventListener("planner:share",requested);
  return()=>document.removeEventListener("planner:share",requested);
 },[]);
 return <div className="relative flex min-w-0 items-center gap-1">
  <button type="button" aria-label="Share plan" title="Copy this page link, not collection data"
   onClick={()=>void share()}
   className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-xs hover:bg-[var(--planner-hover)] focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)]">
   <Share2 size={16}/> <span className="hidden sm:inline">Share</span></button>
  {message&&<div role="status" aria-live="polite" data-testid="planner-share-feedback"
   className="absolute right-0 top-full z-[200] w-[min(320px,calc(100vw-16px))] rounded-lg border border-[var(--planner-border)] bg-[var(--planner-surface)] p-3 text-xs shadow-xl">
   <p className="flex gap-2">{manual?<AlertCircle size={16}/>:<CheckCircle2 size={16} className="text-emerald-600"/>}{message}</p>
   {manual&&<input aria-label="Manual plan link" readOnly value={typeof window==="undefined"?"":window.location.href}
    onFocus={e=>e.currentTarget.select()} className="mt-2 w-full rounded border border-[var(--planner-border)] bg-[var(--planner-surface)] p-2"/>}
   <button type="button" aria-label="Dismiss share feedback" onClick={()=>{setMessage("");setManual(false);}}
    className="mt-2 min-h-11 rounded px-3 underline">Close</button>
  </div>}
 </div>;
}
