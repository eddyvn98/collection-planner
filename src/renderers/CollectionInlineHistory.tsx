import {RotateCcw,RotateCw} from "lucide-react";
export interface CollectionInlineHistoryProps {
 readOnly:boolean;canUndo:boolean;canRedo:boolean;undo:()=>void;redo:()=>void;
}
export function CollectionInlineHistory({readOnly,canUndo,canRedo,undo,redo}:CollectionInlineHistoryProps){
 const cls="inline-flex min-h-11 items-center gap-1 rounded-md border border-[var(--planner-border)] px-2 text-xs text-[var(--planner-secondary)] hover:bg-[var(--planner-hover)] focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)] disabled:opacity-40";
 return <div className="inline-flex gap-1" aria-label="Undo and redo">
  <button type="button" className={cls} aria-label="Undo last change" disabled={readOnly||!canUndo}
   onClick={undo}><RotateCcw size={14}/>Undo</button>
  <button type="button" className={cls} aria-label="Redo last change" disabled={readOnly||!canRedo}
   onClick={redo}><RotateCw size={14}/>Redo</button>
 </div>;
}
