import { addDays, addMonths, addWeeks, format, isValid, parseISO } from "date-fns";
import { newId, recordTitle, setRecordValue, type CollectionBlockPayload,
  type CollectionRecord } from "./model";
import { cloneTaskBranch } from "./collectionTaskCloning";
import { buildTaskTree, taskBranch } from "./collectionTaskTree";
import { taskDateFields, updateTask } from "./collectionTasks";
import { isLegacyStatusField, plannerBucket } from "./collectionPlannerFields";
export type TaskRecurrence = NonNullable<CollectionRecord["recurrence"]>;
const nextDay = (day: string, cadence: TaskRecurrence): string => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return "";
  const source = parseISO(day);
  if (!isValid(source) || format(source, "yyyy-MM-dd") !== day) return "";
  const date = cadence === "daily" ? addDays(source, 1)
    : cadence === "weekly" ? addWeeks(source, 1)
    : cadence === "monthly" ? addMonths(source, 1) : source;
  return format(date, "yyyy-MM-dd");
};
export function copyTask(data:CollectionBlockPayload,id:string):CollectionBlockPayload {
 const source=data.records.find(row=>row.id===id);
 if(!source)return data;
 return cloneTaskBranch(data,id,{rootTitle:recordTitle(data,source)+" (copy)"});
}

export function moveTaskToBucket(data: CollectionBlockPayload, id: string, bucket: string): CollectionBlockPayload {
  const field = plannerBucket(data);
  if (!field || (bucket !== "" && !(field.options ?? []).includes(bucket))) return data;
  const branch=taskBranch(buildTaskTree(data.records),id);
  if(!branch.length)return data;
  return {...data,records:data.records.map(row=>
   branch.some(child=>child.id===row.id)&&row.values[field.id]!==bucket
    ?{...row,values:{...row.values,[field.id]:bucket}}:row)};

}
/** Completion creates exactly one fresh occurrence, and never repeats on no-op saves. */
export function completeRecurringTask(data: CollectionBlockPayload, original: CollectionRecord): CollectionBlockPayload {
  if (!original.recurrence || original.recurrence === "none") return data;
  const { start, due } = taskDateFields(data);
  const lastDue = due ? original.values[due.id] : original.dueDate;
  const lastStart = start ? original.values[start.id] : original.startDate;
  if (!lastDue && !lastStart) return data;
  const values = { ...original.values };
  const bucketField = plannerBucket(data);
  if (bucketField) {
    const sourceBucket = original.values[bucketField.id] ?? "";
    // The canonical Bucket field is independent of the retired Status select.
    // Completed buckets should not receive new, unstarted occurrences.
    values[bucketField.id] = /^done$/i.test(sourceBucket.trim())
      ? bucketField.options?.find(option => option.trim() && !/^done$/i.test(option.trim())) ?? ""
      : sourceBucket;
  }
  const legacyStatus = data.fields.find(isLegacyStatusField);
  // Keep compatibility values consistent with the new progress, never use them as a bucket.
  if (legacyStatus?.options?.includes("To do")) values[legacyStatus.id] = "To do";
  if (start && lastStart) values[start.id] = nextDay(lastStart, original.recurrence);
  if (due && lastDue) values[due.id] = nextDay(lastDue, original.recurrence);
  const nextDue = lastDue && !due ? nextDay(lastDue, original.recurrence) : undefined;
  const nextStart = lastStart && !start ? nextDay(lastStart, original.recurrence) : undefined;
  if ((due && lastDue && !values[due.id]) || (start && lastStart && !values[start.id])) return data;
  const cadence=original.recurrence;
  const shift=(row:CollectionRecord)=>{
   const updated={...row.values};
   if(start&&updated[start.id])updated[start.id]=nextDay(updated[start.id],cadence);
   if(due&&updated[due.id])updated[due.id]=nextDay(updated[due.id],cadence);
   return updated;
  };
  // All descendants are cloned as new, unfinished tasks, with remapped parents.
  return cloneTaskBranch(data,original.id,{rootValues:values,resetProgress:true,mapValues:shift});

}
export function setRecurrence(data: CollectionBlockPayload, id: string, recurrence: TaskRecurrence) {
  if (!["none", "daily", "weekly", "monthly"].includes(recurrence)) return data;
  return updateTask(data, id, { recurrence }, "Updated recurrence");
}
