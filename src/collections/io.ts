import Papa from "papaparse";
import { createCollection, newId, normalizeCollection, type CollectionBlockPayload, type CollectionField, type CollectionRecord, type CollectionSources } from "./model";
import { projectCollectionLookups } from "./collectionRelations";
import { projectCollectionFormulas } from "./collectionFormula";
import { validateCollectionImport } from "./collectionImportValidation";

export function importCollectionCsv(text: string): CollectionBlockPayload {
  const parsed = Papa.parse<string[]>(text.replace(/^\uFEFF/, ""), { delimiter: ",", skipEmptyLines: "greedy" });
  if (parsed.errors.length) throw new Error("Invalid CSV: " + parsed.errors[0].message);
  if ((parsed.data ?? []).length > 5001) throw new Error("CSV import exceeds 5000-record limit");
  if ((parsed.data?.[0]?.length ?? 0) > 50) throw new Error("CSV import exceeds 50-field limit");
  const rows = parsed.data ?? [];
  if (!rows.length || !rows[0].length) throw new Error("CSV is empty");
  const header = rows[0].slice(0, 50);
  const fields: CollectionField[] = header.map((name, i) => ({ id: newId(), name: String(name).trim() || "Column " + (i + 1), type: "text" }));
  const records = rows.slice(1).map((row) => ({
    id: newId(),
    values: Object.fromEntries(fields.map((f, i) => [f.id, String(row[i] ?? "")])),
  }));
  return { ...createCollection(), title: "Imported CSV", fields, records };
}
function csvValue(v: string): string {
  // Prevent spreadsheet formula injection when opening exports in Excel.
  const safe = /^[=+\-@\t\r]/.test(v) ? "'" + v : v;
  return '"' + safe.replace(/"/g, '""') + '"';
}
export function exportCollectionCsv(data: CollectionBlockPayload, sources: CollectionSources = {}): string {
  return [data.fields.map((f) => csvValue(f.name)).join(","),
    ...data.records.map((r) => {
      const computed = projectCollectionFormulas(data, projectCollectionLookups(data, r, sources));
      return data.fields.map((f) => csvValue(computed.values[f.id] ?? "")).join(",");
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
