import { useEffect } from "react";
export function CollectionKeyboard({ root, undo, redo, onEscape, disabled }: {
  root: React.RefObject<HTMLDivElement>; undo:()=>void; redo:()=>void;
  onEscape:()=>void; disabled:boolean;
}) {
  useEffect(() => {
    const keydown=(event:KeyboardEvent)=>{
      const node=root.current;
      if (!node || !node.contains(event.target as Node)) return;
      const target=event.target as HTMLElement;
      const editing=target.matches("input,textarea,select,[contenteditable='true']") ||
        !!target.closest("[contenteditable='true']");
      const dialog=target.closest('[role="dialog"],[role="alertdialog"]');
      if (dialog) return;
      const mod=event.ctrlKey || event.metaKey;
      if (mod && event.key.toLowerCase()==="z" && !editing && !disabled) {
        event.preventDefault();(event.shiftKey?redo:undo)();return;
      }
      if (editing || event.altKey || mod) return;
      if (event.key === "Escape") {onEscape();return;}
      if (disabled) return;
      if (event.key === "/") {
        const search=node.querySelector<HTMLInputElement>('[aria-label="Filter task keyword"],[aria-label="Search records"]');
        if (search) {event.preventDefault();search.focus();search.select();}
      }
      if (event.key.toLowerCase()==="n" && !event.shiftKey) {
        const field=node.querySelector<HTMLInputElement>('[aria-label="New task title"]');
        const add=node.querySelector<HTMLButtonElement>('[data-planner-add-task]:not(:disabled)');
        if (field) {event.preventDefault();field.focus();}
        else if (add) {event.preventDefault();add.click();}
      }
    };
    document.addEventListener("keydown",keydown);
    return ()=>document.removeEventListener("keydown",keydown);
  },[root,undo,redo,onEscape,disabled]);
  return null;
}
