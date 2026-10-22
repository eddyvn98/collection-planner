import {useEffect,useState} from "react";
/** Move fixed action bars above the on-screen keyboard on iOS/Android. */
export function usePlannerKeyboardInset(){
 const [bottom,setBottom]=useState(0);
 useEffect(()=>{
  const viewport=window.visualViewport;
  if(!viewport)return;
  const calculate=()=>{
   const inset=Math.max(0,window.innerHeight-viewport.height-viewport.offsetTop);
   setBottom(inset>80?inset:0);
  };
  calculate();
  viewport.addEventListener("resize",calculate);
  viewport.addEventListener("scroll",calculate);
  return()=>{viewport.removeEventListener("resize",calculate);viewport.removeEventListener("scroll",calculate);};
 },[]);
 return bottom;
}
