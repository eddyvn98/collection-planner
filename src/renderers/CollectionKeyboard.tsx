import {useEffect} from "react";
export function CollectionKeyboard({root,undo,redo,onEscape,onView,disabled}:{
 root:React.RefObject<HTMLDivElement>;undo:()=>void;redo:()=>void;
 onEscape:()=>void;onView?:(index:number)=>void;disabled:boolean;
}){
 useEffect(()=>{
  const keydown=(event:KeyboardEvent)=>{
   const node=root.current;
   if(!node||(!node.contains(event.target as Node) &&
     event.target!==document.body&&event.target!==document.documentElement))return;
   const target=event.target as HTMLElement;
   const editing=target.matches("input,textarea,select,[contenteditable=true]")||
    !!target.closest("[contenteditable=true]");
   const dialog=target.closest('[role="dialog"],[role="alertdialog"]');
   if(dialog && event.key!=="Escape")return;
   const mod=event.ctrlKey||event.metaKey;
   if(mod&&event.key.toLowerCase()==="z"&&!editing&&!disabled){
    event.preventDefault();(event.shiftKey?redo:undo)();return;
   }
   if(event.key==="Escape"&&editing&&target.matches('[aria-label^="New task in "]'))return;
   if(event.key==="Escape"){document.dispatchEvent(new Event("planner:escape"));onEscape();return;}
   if(editing||event.altKey||mod)return;
   if(event.key==="/"){event.preventDefault();
    document.dispatchEvent(new Event("planner:focus-search"));return;}
   if(event.key==="?"||event.key==="Shift+?"){event.preventDefault();
    document.dispatchEvent(new Event("planner:shortcuts"));return;}
   if(["1","2","3","4"].includes(event.key)&&!event.shiftKey){
    event.preventDefault();onView?.(Number(event.key)-1);return;
   }
   if(disabled)return;
   if(event.key.toLowerCase()==="n"&&!event.shiftKey){
    const field=node.querySelector<HTMLInputElement>('[aria-label^="New task in "],[aria-label="New task title"]');
    const add=node.querySelector<HTMLButtonElement>('[data-planner-add-task]:not(:disabled)');
    if(field){event.preventDefault();field.focus();}
    else if(add){event.preventDefault();add.click();}
   }
  };
  document.addEventListener("keydown",keydown);
  return ()=>document.removeEventListener("keydown",keydown);
 },[root,undo,redo,onEscape,onView,disabled]);
 return null;
}
