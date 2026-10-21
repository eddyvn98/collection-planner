import { setRecordValue, updateField, type CollectionBlockPayload } from "../collections/model";
import { updateTask } from "../collections/collectionTasks";
export const UNASSIGNED = "";
export function bucketOptions(data: CollectionBlockPayload, fieldId: string): string[] {
  const field = data.fields.find(f => f.id === fieldId && f.type === "select");
  return field ? [...new Set([...(field.options ?? []), ...data.records.map(r => r.values[fieldId] ?? "")].filter(Boolean))] : [];
}
export function addBucket(data: CollectionBlockPayload, fieldId: string, name: string): CollectionBlockPayload {
  const field = data.fields.find(f => f.id === fieldId && f.type === "select");
  const value = name.trim();
  if (!field || !value || bucketOptions(data, fieldId).some(s => s.toLowerCase() === value.toLowerCase())) return data;
  return updateField(data, fieldId, { options: [...(field.options ?? []), value] });
}
export function renameBucket(data: CollectionBlockPayload, fieldId: string, from: string, to: string): CollectionBlockPayload {
  const field = data.fields.find(f => f.id === fieldId && f.type === "select");
  const next = to.trim();
  if (!field || !from || !next || bucketOptions(data, fieldId).some(s => s !== from && s.toLowerCase() === next.toLowerCase())) return data;
  const updated = updateField(data, fieldId, { options: (field.options ?? []).map(s => s === from ? next : s) });
  return { ...updated, records: updated.records.map(r => r.values[fieldId] === from
    ? { ...r, values: { ...r.values, [fieldId]: next } } : r) };
}
export function deleteBucket(data: CollectionBlockPayload, fieldId: string, bucket: string): CollectionBlockPayload {
  const field = data.fields.find(f => f.id === fieldId && f.type === "select");
  if (!field || !bucket) return data;
  const updated = updateField(data, fieldId, { options: (field.options ?? []).filter(s => s !== bucket) });
  return { ...updated, records: updated.records.map(r => r.values[fieldId] === bucket
    ? { ...r, values: { ...r.values, [fieldId]: "" } } : r) };
}
export function moveBucket(data: CollectionBlockPayload, fieldId: string, bucket: string, direction: -1 | 1): CollectionBlockPayload {
  const field = data.fields.find(f => f.id === fieldId && f.type === "select");
  const options = [...(field?.options ?? [])];
  const at = options.indexOf(bucket), target = at + direction;
  if (!field || at < 0 || target < 0 || target >= options.length) return data;
  [options[at], options[target]] = [options[target], options[at]];
  return updateField(data, fieldId, { options });
}
export function orderedCards(data: CollectionBlockPayload, rows: CollectionBlockPayload["records"]) {
  const positions = new Map(data.records.map((row, i) => [row.id, i]));
  return [...rows].sort((a, b) => (a.boardOrder ?? positions.get(a.id) ?? 0) -
    (b.boardOrder ?? positions.get(b.id) ?? 0));
}
export function moveBoardCard(data: CollectionBlockPayload, recordId: string, fieldId: string | undefined,
  bucket: string, beforeId?: string, readOnly = false): CollectionBlockPayload {
  if (readOnly || !fieldId || !data.records.some(r => r.id === recordId)) return data;
  const group = data.fields.find(f => f.id === fieldId && f.type === "select");
  if (!group || (bucket !== "" && !bucketOptions(data, fieldId).includes(bucket))) return data;
  const destination = orderedCards(data, data.records.filter(r => r.id !== recordId && (r.values[fieldId] ?? "") === bucket));
  const place = destination.findIndex(r => r.id === beforeId);
  destination.splice(place < 0 ? destination.length : place, 0, data.records.find(r => r.id === recordId)!);
  const old = data.records.find(r => r.id === recordId)!;
  if ((old.values[fieldId] ?? "") === bucket &&
    orderedCards(data, data.records.filter(r => (r.values[fieldId] ?? "") === bucket))
      .map(r => r.id).join() === destination.map(r => r.id).join()) return data;
  let next = setRecordValue(data, recordId, fieldId, bucket);
  for (let i = 0; i < destination.length; i++) next = updateTask(next, destination[i].id, { boardOrder: i });
  return next;
}
