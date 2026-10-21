import { btnClass } from "./CollectionFieldEditor";
export function CollectionPhase4Controls({ readOnly, canUndo, canRedo, undo, redo, darkMode, setDarkMode }: {
  readOnly:boolean; canUndo:boolean; canRedo:boolean; undo:()=>void; redo:()=>void;
  darkMode:boolean; setDarkMode:(value:boolean)=>void;
}) {
  const button=btnClass+" focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-40";
  return <div className="flex shrink-0 items-center justify-end gap-1 border-b border-slate-200 px-2 py-1 dark:border-slate-700 sm:gap-2 sm:px-3">
    <button type="button" aria-label="Undo last change" disabled={readOnly||!canUndo}
      onClick={undo} className={button}><span aria-hidden="true">↶</span><span className="hidden sm:inline">Undo</span></button>
    <button type="button" aria-label="Redo last change" disabled={readOnly||!canRedo}
      onClick={redo} className={button}><span aria-hidden="true">↷</span><span className="hidden sm:inline">Redo</span></button>
    <button type="button" aria-label="Toggle dark mode" aria-pressed={darkMode}
      onClick={()=>setDarkMode(!darkMode)} className={button}><span aria-hidden="true">{darkMode?"☀":"☾"}</span><span className="hidden sm:inline">{darkMode?"Light":"Dark"}</span></button>
    <span className="hidden text-[11px] text-slate-500 sm:inline">N (Board/Grid) · / search · Esc close · Ctrl+Z undo</span>
  </div>;
}
