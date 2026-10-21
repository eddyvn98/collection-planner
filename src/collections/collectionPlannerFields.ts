import type { CollectionBlockPayload, CollectionField, CollectionView } from "./model";
/** Status was an old select field. Progress is now the only editable task state. */
export const isLegacyStatusField = (field: CollectionField) =>
  field.type === "select" && /^(status|progress)$/i.test(field.name.trim());
export function visiblePlannerFields(data: CollectionBlockPayload) {
  return data.fields.filter(field => !isLegacyStatusField(field));
}
export function plannerBucket(data: CollectionBlockPayload, view?: CollectionView) {
  return data.fields.find(field => field.id === view?.groupFieldId && !isLegacyStatusField(field)) ??
    data.fields.find(field => field.type === "select" && /^buckets?$/i.test(field.name)) ??
    data.fields.find(field => field.type === "select" && !isLegacyStatusField(field));
}
