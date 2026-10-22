import {useState} from "react";
import {CollectionSettingsSection} from "./CollectionSettingsSection";
const defaults={tokens:true,gestures:true} as const;
export function plannerInputEnabled(kind:keyof typeof defaults){
 try{return localStorage.getItem("planner:input:"+kind)!=="off";}
 catch{return defaults[kind];}
}
export function CollectionInputSettings(){
 const [tokens,setTokens]=useState(()=>plannerInputEnabled("tokens"));
 const [gestures,setGestures]=useState(()=>plannerInputEnabled("gestures"));
 const update=(kind:keyof typeof defaults,value:boolean)=>{
  try{localStorage.setItem("planner:input:"+kind,value?"on":"off");
   document.dispatchEvent(new CustomEvent("planner:input-settings-changed"));
  }catch{/* storage blocked */}
  if(kind==="tokens")setTokens(value);else setGestures(value);
 };
 return <CollectionSettingsSection title="Input" description="Fast typing, pointer, touch and keyboard input preferences. Settings stay on this device.">
  <div data-testid="planner-input-settings" className="grid gap-2 text-sm">
   <label className="flex min-h-11 items-center gap-3">
    <input type="checkbox" aria-label="Enable quick-add tokens" checked={tokens}
     onChange={e=>update("tokens",e.target.checked)}/>
    <span>Recognize dates, @people, #labels and !priority in quick-add</span>
   </label>
   <p className="text-xs text-[var(--planner-secondary)]">Example: Design review mai @Mai #UI !urgent. Unknown tokens remain part of the title.</p>
   <label className="flex min-h-11 items-center gap-3">
    <input type="checkbox" aria-label="Enable touch gestures" checked={gestures}
     onChange={e=>update("gestures",e.target.checked)}/>
    <span>Enable card long-press and horizontal swipe</span>
   </label>
   <p className="text-xs text-[var(--planner-secondary)]">Long-press to open task actions; swipe right to complete, left to request deletion. Shift+F10 opens the keyboard context menu.</p>
  </div>
 </CollectionSettingsSection>;
}
