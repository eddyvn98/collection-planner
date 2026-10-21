import { useState, type ReactNode, type RefObject } from "react";
import { Star, Plus, ChevronDown, Ellipsis, HelpCircle, Share2, UserRound, ArrowLeft, ExternalLink,
  Settings2, History, Maximize2, Minimize2 } from "lucide-react";
import { CollectionViewTabs } from "./CollectionViewTabs";
import { CollectionMobileViewPicker } from "./CollectionMobileViewPicker";
import { ListFilter } from "lucide-react";
import { CollectionPhase4Controls } from "./CollectionPhase4Controls";
import { BOARD_MODES } from "./collectionBoardGroups";
import { resolveMyTasksId } from "../collections/collectionFilterChips";
import type { CollectionBlockPayload, CollectionView } from "../collections/model";
import type { TaskFilterState } from "../collections/collectionPlannerFilters";
interface Props {
 data:CollectionBlockPayload; view:CollectionView; readOnly:boolean;
 filters:TaskFilterState; onFilters:(next:TaskFilterState)=>void; filterControl:ReactNode;
 onTitle:(text:string)=>void; onSelect:(id:string)=>void; onDelete:(id:string)=>void;
 onAddView:(kind:CollectionView["kind"])=>void; onGroup:(mode:NonNullable<CollectionView["boardGroupBy"]>)=>void;
 onSettings:()=>void; onHistory:()=>void; settings:boolean; showHistory:boolean; importExport:ReactNode;
 canUndo:boolean; canRedo:boolean; undo:()=>void; redo:()=>void; darkMode:boolean; setDarkMode:(x:boolean)=>void;
 navigation?:{collectionsHref:string;canvasHref:string;syncMessage:string};
 full:boolean; onExpand:()=>void; onClose:()=>void; backRef:RefObject<HTMLButtonElement>;
}
const item="flex min-h-9 w-full items-center gap-2 rounded px-3 text-left text-sm hover:bg-[var(--planner-hover)] focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)]";
export function CollectionPlannerHeader(p:Props){
 const [more,setMore]=useState(false),[help,setHelp]=useState(false);
 const [groupMenu,setGroupMenu]=useState(false),[viewsMenu,setViewsMenu]=useState(false);
 const [chooseMe,setChooseMe]=useState(false);
 const [me,setMe]=useState(()=>{try{return localStorage.getItem("planner:my-person")??"";}catch{return "";}});
 const [star,setStar]=useState(()=>{try{return localStorage.getItem("planner:star:"+p.data.title)==="1";}catch{return false;}});
 const currentMe=resolveMyTasksId(p.data,me);
 const mine=!!currentMe && p.filters.assignee===currentMe;
 const toggleMe=()=>{if(!currentMe){setChooseMe(true);return;}
   p.onFilters({...p.filters,assignee:mine?"":currentMe});};
 const menuButton="inline-flex h-10 w-10 shrink-0 items-center justify-center gap-1 rounded px-1 text-[var(--planner-secondary)] hover:bg-[var(--planner-hover)] focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)]";
 return <header data-testid="planner-header" className="relative z-50 flex h-12 w-full min-w-0 shrink-0 items-center gap-0.5 sm:gap-2 border-b border-[var(--planner-border)] bg-[var(--planner-surface)] px-2 text-[var(--planner-text)] sm:px-3">
  {p.full&&<button ref={p.backRef} aria-label="Back" className={menuButton} onClick={p.onClose}><ArrowLeft size={16}/></button>}
  <input aria-label="Collection title" value={p.data.title} disabled={p.readOnly} onChange={e=>p.onTitle(e.target.value)}
    title={p.data.title} className="min-w-0 w-[min(24vw,88px)] shrink bg-transparent text-ellipsis text-base font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)] sm:w-48 sm:shrink-0 sm:text-xl"/>
  <button type="button" title={star?"Unstar plan":"Star plan"} aria-label="Star plan" aria-pressed={star} className={menuButton+" hidden sm:inline-flex"}
    onClick={()=>{const next=!star;setStar(next);try{localStorage.setItem("planner:star:"+p.data.title,next?"1":"0");}catch{}}}>
    <Star size={16} strokeWidth={1.75} fill={star?"#5B5FC7":"none"}/></button>
  <div className="hidden min-w-0 flex-1 overflow-x-auto overscroll-contain sm:block"><CollectionViewTabs views={p.data.views} activeViewId={p.view.id}
    readOnly={p.readOnly} onSelect={p.onSelect} onDelete={p.onDelete}/></div>
  <CollectionMobileViewPicker views={p.data.views} selected={p.view.id} onSelect={p.onSelect}/>
  <div className="ml-auto flex shrink-0 items-center gap-0 sm:gap-1">
    {p.filterControl}
    <button aria-pressed={mine} className={menuButton+" xl:w-auto xl:px-2 xl:gap-1.5 "+(mine?" bg-[var(--planner-hover)] text-[var(--planner-accent)]":"")}
      onClick={toggleMe} title="My tasks" aria-label="My tasks"><UserRound size={16}/><span className="hidden whitespace-nowrap xl:inline text-sm">My tasks</span></button>
    {chooseMe&&<select autoFocus aria-label="Select my identity" className="max-w-28 rounded border bg-[var(--planner-surface)] p-1 text-xs"
      defaultValue="" onChange={e=>{setMe(e.target.value);try{localStorage.setItem("planner:my-person",e.target.value);}catch{}
        p.onFilters({...p.filters,assignee:e.target.value});setChooseMe(false);}}>
      <option value="">Who am I?</option>{(p.data.people??[]).map(person=><option value={person.id} key={person.id}>{person.name}</option>)}
    </select>}
    {p.view.kind==="kanban"&&<div className="relative">
      <button aria-label="Group by" aria-expanded={groupMenu} className={menuButton+" lg:w-auto lg:px-2"} onClick={()=>setGroupMenu(!groupMenu)}>
        <ListFilter size={16} strokeWidth={1.75}/><span className="hidden lg:inline text-xs">Group</span><ChevronDown className="hidden sm:block" size={14}/></button>
      {groupMenu&&<div role="menu" className="absolute right-0 top-full z-50 w-44 rounded border border-[var(--planner-border)] bg-[var(--planner-surface)] p-1 shadow-lg">
        {BOARD_MODES.map(mode=><button role="menuitem" className={item} key={mode.value}
         onClick={()=>{p.onGroup(mode.value);setGroupMenu(false);}}>{mode.label}</button>)}
      </div>}
    </div>}
    <button title="Copy plan link" aria-label="Share plan" className={menuButton+" hidden sm:inline-flex"}
      onClick={()=>void navigator.clipboard?.writeText(window.location.href)}><Share2 size={16}/></button>
    <div className="relative"><button aria-label="Shortcuts" title="Keyboard shortcuts" className={menuButton+" hidden sm:inline-flex"} onClick={()=>setHelp(!help)}>
      <HelpCircle size={16}/></button>
      {help&&<div role="dialog" aria-label="Shortcuts" className="absolute right-0 top-full z-50 w-56 rounded border border-[var(--planner-border)] bg-[var(--planner-surface)] p-3 text-xs shadow-lg">
        <strong>Keyboard shortcuts</strong><p className="mt-2">N — New task (Board/Grid)</p><p>/ — Search</p>
        <p>Esc — Close/clear</p><p>Ctrl/Cmd+Z — Undo</p><p>Ctrl/Cmd+Shift+Z — Redo</p></div>}
    </div>
    <div className="relative"><button aria-label="More plan actions" title="More actions" className={menuButton} onClick={()=>setMore(!more)}>
      <Ellipsis size={18}/></button>
      {more&&<div role="menu" className="absolute right-0 top-full z-50 w-64 rounded border border-[var(--planner-border)] bg-[var(--planner-surface)] p-2 shadow-lg">
       <button role="menuitem" className={item} onClick={()=>{p.onSettings();setMore(false);}}><Settings2 size={16}/> {p.settings?"Hide settings":"Settings"}</button>
       <button role="menuitem" className={item} onClick={()=>{p.onHistory();setMore(false);}}><History size={16}/> {p.showHistory?"Hide history":"History"}</button>
       <button role="menuitem" className={item} onClick={()=>{p.full?p.onClose():p.onExpand();setMore(false);}}>
        {p.full?<Minimize2 size={16}/>:<Maximize2 size={16}/>} {p.full?"Exit full screen":"Full screen"}</button>
       
       {p.navigation&&<div className="border-t border-[var(--planner-border)] py-1">
         <a href={p.navigation.collectionsHref} className={item}><ArrowLeft size={16}/> All collections</a>
         <a href={p.navigation.canvasHref} className={item}><ExternalLink size={16}/> Open canvas</a>
         <span role="status" className="block px-3 text-xs text-[var(--planner-secondary)]">{p.navigation.syncMessage}</span>
       </div>}
       <div className="border-t border-[var(--planner-border)] py-2">{p.importExport}</div>
       <details className="sm:hidden"><summary className={item}><Plus size={16}/> Add view</summary>
         {(["table","kanban","calendar","charts","timeline","gallery","mindmap","form"] as const).map(kind=>
           <button key={kind} className={item+" pl-8"} onClick={()=>{p.onAddView(kind);setMore(false);}}>
             {({table:"Grid",kanban:"Board",calendar:"Schedule",charts:"Charts",timeline:"Timeline",
               gallery:"Gallery",mindmap:"Mind Map",form:"Form"})[kind]}</button>)}
       </details>
       <button role="menuitem" className={item+" sm:hidden"} onClick={()=>{void navigator.clipboard?.writeText(window.location.href);setMore(false);}}><Share2 size={16}/> Share plan</button>
       <button role="menuitem" className={item+" sm:hidden"} onClick={()=>{setHelp(!help);setMore(false);}}>
         <HelpCircle size={16}/> Keyboard shortcuts</button>
       <CollectionPhase4Controls readOnly={p.readOnly} canUndo={p.canUndo} canRedo={p.canRedo}
         undo={p.undo} redo={p.redo} darkMode={p.darkMode} setDarkMode={p.setDarkMode}/>
      </div>}
    </div>
    <div className="relative"><button disabled={p.readOnly} aria-label="Add view" title="Add view" className={menuButton+" hidden sm:inline-flex"} onClick={()=>setViewsMenu(!viewsMenu)}>
      <Plus size={16}/><span className="hidden xl:inline text-xs">View</span></button>
      {viewsMenu&&<div role="menu" className="absolute right-0 top-full z-50 w-40 rounded border border-[var(--planner-border)] bg-[var(--planner-surface)] p-1 shadow-lg">
        {(["table","kanban","calendar","charts","timeline","gallery","mindmap","form"] as const).map(kind=>
          <button role="menuitem" key={kind} className={item} onClick={()=>{p.onAddView(kind);setViewsMenu(false);}}>
            {({table:"Grid",kanban:"Board",calendar:"Schedule",charts:"Charts",timeline:"Timeline",
              gallery:"Gallery",mindmap:"Mind Map",form:"Form"})[kind]}</button>)}
      </div>}
    </div>
  </div>
 </header>;
}
