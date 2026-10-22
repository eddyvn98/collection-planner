import type {CollectionField,CollectionRecord} from "./model";
/** Stable grouping: preserve the input order within every group. */
export function groupViewRows(rows:CollectionRecord[],field?:CollectionField){
 if(!field)return rows;
 const order=new Map<string,number>();
 for(const row of rows){
  const value=row.values[field.id]??"";
  if(!order.has(value))order.set(value,order.size);
 }
 return [...rows].sort((a,b)=>
  (order.get(a.values[field.id]??"")??0)-(order.get(b.values[field.id]??"")??0));
}
export function viewGroupName(row:CollectionRecord,field:CollectionField){
 return row.values[field.id]||"Unassigned";
}
