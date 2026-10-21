import { btnClass } from "./CollectionFieldEditor";
export function CollectionPhase4Controls({ readOnly, canUndo, canRedo, undo, redo, darkMode, setDarkMode }: {
  readOnly:boolean; canUndo:boolean; canRedo:boolean; undo:()=>void; redo:()=>void;
  darkMode:boolean; setDarkMode:(value:boolean)=>void;
}) {
  const button=btnClass+" focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-40";
  return <div className="flex flex-wrap items-center justify-end gap-2 border-b border-slate-200 px-3 py-1 dark:border-slate-700">
    <button type="button" aria-label="Undo last change" disabled={readOnly||!canUndo}
      onClick={undo} className={button}>↶ Undo</button>
    <button type="button" aria-label="Redo last change" disabled={readOnly||!canRedo}
      onClick={redo} className={button}>↷ Redo</button>
    <button type="button" aria-label="Toggle dark mode" aria-pressed={darkMode}
      onClick={()=>setDarkMode(!darkMode)} className={button}>{darkMode?"☀ Light":"☾ Dark"}</button>
    <span className="hidden text-[11px] text-slate-500 sm:inline">N new · / search · Esc close · Ctrl+Z undo</span>
  </div>;
}
