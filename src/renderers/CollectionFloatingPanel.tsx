import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { focusSelector,nextFocusIndex,nextMenuIndex,menuTypeahead } from "./collectionInteraction";

type Bounds = Pick<DOMRect, "top" | "bottom" | "left" | "right">;
type Alignment = "start" | "end";
export function floatingPlacement(anchor: Bounds, width: number, height: number,
 viewportWidth: number, viewportHeight: number, align: Alignment = "end") {
 const gap = 6, margin = 8;
 const below = Math.max(0, viewportHeight - margin - anchor.bottom - gap);
 const above = Math.max(0, anchor.top - margin - gap);
 const flip = below < height && above > below;
 const space = flip ? above : below;
 const maxHeight = Math.max(0, space);
 const visibleHeight = Math.min(height, maxHeight);
 const top = flip ? Math.max(margin, anchor.top - gap - visibleHeight) : anchor.bottom + gap;
 const wantedLeft = align === "end" ? anchor.right - width : anchor.left;
 const left = Math.max(margin, Math.min(wantedLeft, viewportWidth - margin - width));
 return { top, left, maxHeight, flipped: flip };
}

interface Props {
 open: boolean; anchorRef: RefObject<HTMLElement | null>;
 onClose: () => void; role: "dialog" | "menu" | "listbox";
 label: string; children: ReactNode; className: string; align?: Alignment;
}
export function CollectionFloatingPanel({open,anchorRef,onClose,role,label,children,className,
 align="end"}: Props) {
 const panelRef = useRef<HTMLDivElement>(null);
 const closeRef = useRef(onClose);
 const typed = useRef("");
 closeRef.current = onClose;
 const [layout,setLayout] = useState({top:0,left:0,maxHeight:0,flipped:false});
 useLayoutEffect(()=>{
  if(!open)return;
  const reposition=()=>{
   const anchor=anchorRef.current?.getBoundingClientRect();
   const panel=panelRef.current;
   if(!anchor||!panel)return;
   const bounds=panel.getBoundingClientRect();
   setLayout(floatingPlacement(anchor,bounds.width,panel.scrollHeight,
     window.innerWidth,window.innerHeight,align));
  };
  reposition();
  if(role==="menu") requestAnimationFrame(()=>{
   const first=panelRef.current?.querySelector<HTMLElement>(
     '[role="menuitem"]:not([aria-disabled="true"]),[role="menuitemradio"],button:not(:disabled)');
   first?.focus({preventScroll:true});
  });
  window.addEventListener("resize",reposition);
  window.addEventListener("scroll",reposition,true);
  const outside=(event:PointerEvent)=>{
   const target=event.target as Node;
   if(!panelRef.current?.contains(target)&&!anchorRef.current?.contains(target))closeRef.current();
  };
  const escape=(event:KeyboardEvent)=>{
   if(event.key!=="Escape")return;
   event.preventDefault();
   event.stopImmediatePropagation();
   closeRef.current();
   requestAnimationFrame(()=>anchorRef.current?.focus());
  };
  document.addEventListener("pointerdown",outside,true);
  window.addEventListener("keydown",escape,true);
  return ()=>{
   window.removeEventListener("resize",reposition);
   window.removeEventListener("scroll",reposition,true);
   document.removeEventListener("pointerdown",outside,true);
   window.removeEventListener("keydown",escape,true);
  };
 },[open,align,anchorRef]);
 const handleKey=(event:React.KeyboardEvent<HTMLDivElement>)=>{
  const panel=panelRef.current;
  if(!panel)return;
  const editing=(event.target as HTMLElement).matches("input,select,textarea,[contenteditable=true]");
  if(role==="menu"&&!editing){
   const items=[...panel.querySelectorAll<HTMLElement>(
     '[role="menuitem"]:not([aria-disabled=true]),[role="menuitemradio"]:not([aria-disabled=true]),button:not(:disabled)')]
     .filter(x=>x.getClientRects().length>0&&!x.hasAttribute("disabled"));
   const index=items.indexOf(document.activeElement as HTMLElement);
   if(["ArrowDown","ArrowUp","Home","End"].includes(event.key)){
    event.preventDefault();
    const next=nextMenuIndex(index,items.length,event.key);
    items[next]?.focus();
   }else if(event.key.length===1&&!event.altKey&&!event.ctrlKey&&!event.metaKey&&
     event.key!==" "){
    typed.current=(typed.current+event.key).slice(-32);
    let next=menuTypeahead(items.map(x=>x.textContent?.trim()??""),typed.current);
    if(next<0){typed.current=event.key;next=menuTypeahead(items.map(x=>x.textContent?.trim()??""),typed.current);}
    if(next>=0)items[next].focus();
   }
  }
  if(role==="dialog"&&event.key==="Tab"){
   const items=[...panel.querySelectorAll<HTMLElement>(focusSelector)]
    .filter(x=>x.getClientRects().length>0);
   if(!items.length)return;
   const index=items.indexOf(document.activeElement as HTMLElement);
   if(index<0||(!event.shiftKey&&index===items.length-1)||(event.shiftKey&&index===0)){
    event.preventDefault();items[nextFocusIndex(index,items.length,event.shiftKey)]?.focus();
   }
  }
 };
 if(!open||typeof document==="undefined")return null;
 return createPortal(<div ref={panelRef} role={role} aria-label={label} data-planner-floating
  data-placement={layout.flipped?"top":"bottom"}
  onKeyDown={handleKey} className={className+" planner-motion-popover fixed z-[11000] overflow-y-auto overscroll-contain border border-[var(--planner-border)] bg-[var(--planner-surface)] text-[var(--planner-text)] shadow-xl"}
  style={{top:layout.top,left:layout.left,maxHeight:layout.maxHeight,
    visibility:layout.maxHeight ? "visible":"hidden"}}>
  {children}
 </div>,document.body);
}
