import { useEffect, useState } from "react";
/** Render only one droppable calendar layout to avoid duplicate dnd-kit IDs. */
export function useCompactSchedule() {
  const [compact, setCompact] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const update = () => setCompact(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return compact;
}
