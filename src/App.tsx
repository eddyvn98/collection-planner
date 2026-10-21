import { useEffect, useState } from "react";
import { CollectionSurface } from "./renderers/CollectionSurface";
import { createCollection, normalizeCollection, type CollectionBlockPayload } from "./collections/model";

const STORAGE_KEY = "collection-planner:v1";

function load(): CollectionBlockPayload {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return normalizeCollection(raw ? (JSON.parse(raw) as CollectionBlockPayload) : null);
  } catch {
    return createCollection();
  }
}

export function App() {
  const [data, setData] = useState(load);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* storage unavailable */ }
  }, [data]);
  return <div className="min-h-[100dvh] bg-[var(--planner-canvas)]"><CollectionSurface blockId="main" data={data} onChange={setData} readOnly={false} standalone /></div>;
}
