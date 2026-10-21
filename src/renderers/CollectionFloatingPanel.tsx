import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

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
  window.addEventListener("resize",reposition);
  window.addEventListener("scroll",reposition,true);
  const outside=(event:PointerEvent)=>{
   const target=event.target as Node;
   if(!panelRef.current?.contains(target)&&!anchorRef.current?.contains(target))onClose();
  };
  const escape=(event:KeyboardEvent)=>{
   if(event.key!=="Escape")return;
   event.preventDefault();
   event.stopImmediatePropagation();
   onClose();
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
 },[open,align,anchorRef,onClose]);
 if(!open||typeof document==="undefined")return null;
 return createPortal(<div ref={panelRef} role={role} aria-label={label} data-planner-floating
  data-placement={layout.flipped?"top":"bottom"}
  className={className+" fixed z-[11000] overflow-y-auto overscroll-contain border border-[var(--planner-border)] bg-[var(--planner-surface)] text-[var(--planner-text)] shadow-xl"}
  style={{top:layout.top,left:layout.left,maxHeight:layout.maxHeight,
    visibility:layout.maxHeight ? "visible":"hidden"}}>
  {children}
 </div>,document.body);
}
