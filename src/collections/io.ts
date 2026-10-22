import Papa from "papaparse";
import { createCollection, newId, normalizeCollection, type CollectionBlockPayload, type CollectionField, type CollectionRecord, type CollectionSources } from "./model";
import { projectCollectionLookups } from "./collectionRelations";
import { projectCollectionFormulas } from "./collectionFormula";
import { buildTaskTree } from "./collectionTaskTree";
import { validateCollectionImport } from "./collectionImportValidation";

export function importCollectionCsv(text: string): CollectionBlockPayload {
  const parsed = Papa.parse<string[]>(text.replace(/^\uFEFF/, ""), { delimiter: ",", skipEmptyLines: "greedy" });
  if (parsed.errors.length) throw new Error("Invalid CSV: " + parsed.errors[0].message);
  if ((parsed.data ?? []).length > 5001) throw new Error("CSV import exceeds 5000-record limit");
  if ((parsed.data?.[0]?.length ?? 0) > 50) throw new Error("CSV import exceeds 50-field limit");
  const rows = parsed.data ?? [];
  if (!rows.length || !rows[0].length) throw new Error("CSV is empty");
  const header = rows[0].slice(0, 50);
  const idIndex=header.indexOf("__planner_task_id"),parentIndex=header.indexOf("__planner_parent_id");
  if((idIndex>=0)!==(parentIndex>=0))throw new Error("CSV tree columns must be paired");
  const headers=header.filter((_,i)=>i!==idIndex&&i!==parentIndex);
  const fields: CollectionField[] = headers.map((name, i) => ({ id: newId(), name: String(name).trim() || "Column " + (i + 1), type: "text" }));
  const columns=header.flatMap((_,i)=>i===idIndex||i===parentIndex?[]:[i]);
  const records = rows.slice(1).map(row=>({
    id:idIndex>=0 ? String(row[idIndex]??"") : newId(),
    parentId:parentIndex>=0 ? String(row[parentIndex]??"")||null : null,
    values:Object.fromEntries(fields.map((f,i)=>[f.id,String(row[columns[i]]??"")])),
  }));
  const data={...createCollection(),title:"Imported CSV",fields,records};
  return normalizeCollection(validateCollectionImport(data));
}
function csvValue(v: string): string {
  // Prevent spreadsheet formula injection when opening exports in Excel.
  const safe = /^[=+\-@\t\r]/.test(v) ? "'" + v : v;
  return '"' + safe.replace(/"/g, '""') + '"';
}
export function exportCollectionCsv(data: CollectionBlockPayload, sources: CollectionSources = {}): string {
  const tree=buildTaskTree(data.records);
  const hierarchical=[...tree.byId.values()].some(row=>!!row.parentId);
  const extra=hierarchical?["__planner_task_id","__planner_parent_id"]:[];
  return [[...data.fields.map(f=>f.name),...extra].map(csvValue).join(","),
    ...data.records.map((r) => {
      const computed = projectCollectionFormulas(data, projectCollectionLookups(data, r, sources));
      const values=data.fields.map(f=>computed.values[f.id]??"");
      return [...values,...(hierarchical?[r.id,r.parentId??""]:[])].map(csvValue).join(",");
    })].join("\r\n");
}
export function importCollectionJson(text: string): CollectionBlockPayload {
  return normalizeCollection(validateCollectionImport(JSON.parse(text) as unknown));
}
export function downloadCollection(filename: string, content: string, type: string): void {
  const objectUrl = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
