import {useEffect,useRef,type ReactNode} from "react";
import {createPortal} from "react-dom";
import {focusSelector,nextFocusIndex} from "./collectionInteraction";
export function CollectionModalDialog({label,onClose,children,trigger}:{
 label:string;onClose:()=>void;children:ReactNode;trigger?:HTMLElement|null;
}){
 const panel=useRef<HTMLElement>(null);
 const closeRef=useRef(onClose);
 closeRef.current=onClose;
 useEffect(()=>{
  const previous=trigger??(document.activeElement instanceof HTMLElement?document.activeElement:null);
  const frame=requestAnimationFrame(()=>{
   const target=panel.current?.querySelector<HTMLElement>("[data-dialog-initial]");
   (target??panel.current)?.focus();
  });
  const close=(event:KeyboardEvent)=>{
   if(event.key!=="Escape"||document.querySelector("[data-planner-floating]"))return;
   event.preventDefault();event.stopImmediatePropagation();closeRef.current();
  };
  window.addEventListener("keydown",close,true);
  return ()=>{
   window.cancelAnimationFrame(frame);window.removeEventListener("keydown",close,true);
   requestAnimationFrame(()=>{if(previous?.isConnected)previous.focus();});
  };
 },[]);
 const tab=(event:React.KeyboardEvent<HTMLElement>)=>{
  if(event.key!=="Tab")return;
  const items=[...panel.current?.querySelectorAll<HTMLElement>(focusSelector)??[]]
   .filter(x=>x.getClientRects().length>0);
  const index=items.indexOf(document.activeElement as HTMLElement);
  if(index<0||(!event.shiftKey&&index===items.length-1)||(event.shiftKey&&index===0)){
   event.preventDefault();
   items[nextFocusIndex(index,items.length,event.shiftKey)]?.focus();
  }
 };
 return createPortal(<div className="fixed inset-0 z-[12000] flex items-center justify-center bg-black/40 p-4"
   onMouseDown={e=>{if(e.target===e.currentTarget)closeRef.current();}}>
   <section ref={panel} role="alertdialog" aria-modal="true" aria-label={label} tabIndex={-1}
    onKeyDown={tab}
    className="planner-motion-popover w-full max-w-sm rounded-lg border border-[var(--planner-border)] bg-[var(--planner-surface)] p-5 text-[var(--planner-text)] shadow-xl">
    {children}
   </section>
 </div>,document.body);
}
