"use client";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis } from "recharts";
import { chartSelection, chartSeries, chartSummary, summarySelection,
  type ChartDimension, type ChartPoint } from "../collections/collectionCharts";
import { localToday } from "../collections/collectionTasks";
import type { TaskFilterState } from "../collections/collectionPlannerFilters";
import type { CollectionBlockPayload, CollectionRecord } from "../collections/model";
import { chartPointColor } from "../collections/collectionChartColors";
const dimensions: { key: ChartDimension; title: string }[] = [
  { key: "progress", title: "Progress" }, { key: "bucket", title: "Bucket" },
  { key: "priority", title: "Priority" }, { key: "assignee", title: "Assignee" },
];
function ChartPanel({ dimension, title, points, style, onChoose }: {
  dimension: ChartDimension; title: string; points: ChartPoint[]; style: "donut" | "bar";
  onChoose: (dimension: ChartDimension, key: string) => void;
}) {
  const active = points.filter(point => point.value > 0);
  return <section aria-label={title + " chart"} className="min-w-0 rounded-xl border border-[var(--planner-border)] bg-[var(--planner-surface)] p-4 ">
    <h3 className="mb-2 font-semibold">{title}</h3>
    {active.length ? <div className="h-56 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        {style === "donut" ? <PieChart>
          <Pie data={active} dataKey="value" nameKey="name" cx="50%" cy="50%"
            innerRadius={50} outerRadius={78} paddingAngle={2}>
            {active.map((point) => <Cell key={point.key} fill={chartPointColor(points, point)}
              cursor="pointer" onClick={() => onChoose(dimension, point.key)} />)}
          </Pie>
          <Tooltip />
        </PieChart> : <BarChart data={active} margin={{ top: 8, right: 12, bottom: 12, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} tickFormatter={value => String(value).slice(0, 11)} />
          <YAxis allowDecimals={false} width={28} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="value" name="Tasks" maxBarSize={44} radius={[5, 5, 0, 0]}>
            {active.map((point) => <Cell key={point.key} fill={chartPointColor(points, point)}
              cursor="pointer" onClick={() => onChoose(dimension, point.key)} />)}
          </Bar>
        </BarChart>}
      </ResponsiveContainer>
    </div> : <p className="flex h-56 items-center justify-center text-sm text-[var(--planner-secondary)]">No tasks to chart.</p>}
    <div className="mt-2 flex flex-wrap gap-1.5" aria-label={title + " categories"}>
      {points.map((point) => <button type="button" key={point.key}
        onClick={() => onChoose(dimension, point.key)}
        className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs hover:border-[var(--planner-accent)] focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)] border-[var(--planner-border)]"
        title={"Show " + point.name + " tasks in Grid"}>
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: chartPointColor(points, point) }}/>
        {point.name} <strong>{point.value}</strong>
      </button>)}
    </div>
    {dimension === "assignee" && <p className="mt-2 text-[11px] text-[var(--planner-secondary)]">
      A task assigned to several people contributes to each person.</p>}
  </section>;
}
export function CollectionChartsView({ data, rows, onDrilldown }: {
  data: CollectionBlockPayload; rows: CollectionRecord[];
  onDrilldown: (filters: TaskFilterState) => void;
}) {
  const [style, setStyle] = useState<"donut" | "bar">("donut");
  const today = localToday();
  const summary = useMemo(() => chartSummary(data, rows, today), [data, rows, today]);
  const series = useMemo(() => dimensions.map(dimension => ({
    ...dimension, points: chartSeries(data, rows, dimension.key),
  })), [data, rows]);
  const counters = [
    { key: "late" as const, label: "Late", value: summary.late, shade: "text-red-600 dark:text-red-400" },
    { key: "dueSoon" as const, label: "Due soon (7 days)", value: summary.dueSoon, shade: "text-amber-600 dark:text-amber-400" },
    { key: "unassigned" as const, label: "Unassigned", value: summary.unassigned, shade: "text-[var(--planner-text)]" },
  ];
  return <div data-testid="collection-charts" className="min-w-0 space-y-4">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-lg font-semibold">Charts</h2>
        <p className="text-xs text-[var(--planner-secondary)]">{summary.total} {summary.total === 1 ? "task" : "tasks"}. Click any category to filter Grid.</p>
      </div>
      <label className="text-sm">Display <select aria-label="Chart type"
        className="ml-2 rounded-lg border bg-white px-2 py-1.5 "
        value={style} onChange={event => setStyle(event.target.value as "donut" | "bar")}>
        <option value="donut">Donut</option><option value="bar">Bar</option>
      </select></label>
    </header>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {counters.map(counter => <button type="button" key={counter.key}
        onClick={() => onDrilldown(summarySelection(counter.key))}
        aria-label={"Show " + counter.label + " tasks in Grid"}
        className="rounded-xl border border-[var(--planner-border)] bg-[var(--planner-surface)] p-4 text-left shadow-sm transition hover:border-[var(--planner-accent)] focus-visible:ring-2 focus-visible:ring-[var(--planner-accent)] ">
        <span className="block text-xs text-[var(--planner-secondary)]">{counter.label}</span>
        <strong className={"mt-1 block text-3xl tabular-nums " + counter.shade}>{counter.value}</strong>
      </button>)}
    </div>
    <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
      {series.map(item => <ChartPanel key={item.key} dimension={item.key} title={item.title}
        points={item.points} style={style}
        onChoose={(dimension, key) => onDrilldown(chartSelection(dimension, key))}/>)}
    </div>
  </div>;
}
