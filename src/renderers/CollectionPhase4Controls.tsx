import { RotateCcw, RotateCw, Moon, Sun } from "lucide-react";
export function CollectionPhase4Controls({readOnly,canUndo,canRedo,undo,redo,darkMode,setDarkMode}:{
 readOnly:boolean;canUndo:boolean;canRedo:boolean;undo:()=>void;redo:()=>void;
 darkMode:boolean;setDarkMode:(value:boolean)=>void;
}){
 const cls="flex min-h-9 w-full items-center gap-2 rounded px-3 text-left text-sm hover:bg-[var(--planner-hover)] focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)] disabled:opacity-40";
 return <div className="border-t border-[var(--planner-border)] pt-1">
   <button type="button" className={cls} aria-label="Undo last change" disabled={readOnly||!canUndo} onClick={undo}><RotateCcw size={16}/> Undo</button>
   <button type="button" className={cls} aria-label="Redo last change" disabled={readOnly||!canRedo} onClick={redo}><RotateCw size={16}/> Redo</button>
   <button type="button" className={cls} aria-label="Toggle dark mode" aria-pressed={darkMode}
    onClick={()=>setDarkMode(!darkMode)}>{darkMode?<Sun size={16}/>:<Moon size={16}/>} {darkMode?"Light mode":"Dark mode"}</button>
 </div>;
}
