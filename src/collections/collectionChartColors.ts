export interface ColorChartPoint { key: string }
export const PLANNER_CHART_COLORS = [
  "#2563eb", "#0d9488", "#d97706", "#7c3aed",
  "#e11d48", "#0891b2", "#65a30d", "#a855f7",
] as const;
/** Never index by the nonzero subset: category colors must match legend, slice and bar. */
export function chartPointColor<T extends ColorChartPoint>(all: T[], point: T): string {
  const index=all.findIndex(item=>item.key===point.key);
  return PLANNER_CHART_COLORS[(index<0?0:index)%PLANNER_CHART_COLORS.length];
}
