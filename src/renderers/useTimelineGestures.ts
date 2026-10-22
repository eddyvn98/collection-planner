import {useEffect,useRef,type RefObject} from "react";
export function useTimelineGestures(element:RefObject<HTMLDivElement>,zoom:(direction:-1|1)=>void){
 const callback=useRef(zoom);callback.current=zoom;
 useEffect(()=>{
  const node=element.current;if(!node)return;
  const touches=new Map<number,number>();
  let initialDistance=0,consumed=false;
  const wheel=(event:WheelEvent)=>{
   if(!event.ctrlKey&&!event.metaKey)return;
   event.preventDefault();callback.current(event.deltaY<0?-1:1);
  };
  const down=(event:PointerEvent)=>{
   if(event.pointerType!=="touch")return;
   touches.set(event.pointerId,event.clientX);
   if(touches.size===2){
    const [a,b]=[...touches.values()];initialDistance=Math.abs(a-b);consumed=false;
   }
  };
  const move=(event:PointerEvent)=>{
   if(!touches.has(event.pointerId))return;
   touches.set(event.pointerId,event.clientX);
   if(touches.size!==2||consumed)return;
   const [a,b]=[...touches.values()],distance=Math.abs(a-b);
   if(initialDistance>0&&Math.abs(distance-initialDistance)>45){
    callback.current(distance>initialDistance?-1:1);consumed=true;
   }
  };
  const release=(event:PointerEvent)=>{
   touches.delete(event.pointerId);if(touches.size<2)initialDistance=0;
  };
  node.addEventListener("wheel",wheel,{passive:false});
  node.addEventListener("pointerdown",down,true);
  node.addEventListener("pointermove",move,true);
  node.addEventListener("pointerup",release,true);
  node.addEventListener("pointercancel",release,true);
  return()=>{node.removeEventListener("wheel",wheel);
   node.removeEventListener("pointerdown",down,true);
   node.removeEventListener("pointermove",move,true);
   node.removeEventListener("pointerup",release,true);
   node.removeEventListener("pointercancel",release,true);
  };
 },[element]);
}
