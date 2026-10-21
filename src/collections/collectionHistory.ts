import { useCallback, useEffect, useRef, useState } from "react";
import type { CollectionBlockPayload } from "../collections/model";
export interface HistoryState { past: CollectionBlockPayload[]; current: CollectionBlockPayload;
  future: CollectionBlockPayload[]; }
export const initialHistory = (current: CollectionBlockPayload): HistoryState => ({past:[],current,future:[]});
export function historyCommit(state: HistoryState, next: CollectionBlockPayload): HistoryState {
  if (next === state.current) return state;
  return { past:[...state.past.slice(-49),state.current], current:next, future:[] };
}
export function historyUndo(state: HistoryState): HistoryState {
  if (!state.past.length) return state;
  return {past:state.past.slice(0,-1),current:state.past[state.past.length-1],
    future:[state.current,...state.future].slice(0,50)};
}
export function historyRedo(state: HistoryState): HistoryState {
  if (!state.future.length) return state;
  return {past:[...state.past.slice(-49),state.current],current:state.future[0],
    future:state.future.slice(1)};
}
export function useCollectionHistory(data: CollectionBlockPayload,
  persist: (next: CollectionBlockPayload) => void, readOnly = false) {
  const history = useRef<HistoryState>(initialHistory(data));
  const send = useRef(persist); send.current = persist;
  const [,force] = useState(0);
  // A remote revision/import can legitimately replace the backing data.
  useEffect(() => { if (history.current.current !== data) {
    history.current = initialHistory(data); force(n=>n+1);
  } }, [data]);
  const apply = useCallback((next: HistoryState) => {
    if (readOnly || next === history.current) return;
    history.current = next; force(n=>n+1); send.current(next.current);
  }, [readOnly]);
  const onChange = useCallback((next: CollectionBlockPayload) =>
    apply(historyCommit(history.current,next)), [apply]);
  const undo = useCallback(() => apply(historyUndo(history.current)), [apply]);
  const redo = useCallback(() => apply(historyRedo(history.current)), [apply]);
  return {onChange,undo,redo,canUndo:history.current.past.length>0,
    canRedo:history.current.future.length>0};
}
