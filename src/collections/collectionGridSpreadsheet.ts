import Papa from "papaparse";
import {setRecordValue,type CollectionBlockPayload,type CollectionField} from "./model";
export const isSpreadsheetField=(field:CollectionField)=>
 ["text","number","date","url","select"].includes(field.type);
export function parseSpreadsheetMatrix(text:string):string[][]{
 if(!text||text.length>100000)return [];
 const delimiter=text.includes("\t")?"\t":",";
 const parsed=Papa.parse<string[]>(text.replace(/^\uFEFF/,""),{delimiter,skipEmptyLines:false});
 if(parsed.errors.length||!parsed.data.length)return [];
 const rows=parsed.data.slice(0,100).map(row=>row.slice(0,30).map(String));
 while(rows.length>1&&rows.at(-1)?.every(cell=>cell===""))rows.pop();
 return rows;
}
function safeSpreadsheetValue(field:CollectionField,value:string){
 if(field.type==="number"&&value!==""&&!/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value.trim()))return false;
 if(field.type==="date"&&value!==""&&!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 if(field.type==="select"&&value!==""&&!field.options?.includes(value))return false;
 return true;
}
export function pasteGridCells(data:CollectionBlockPayload,visibleIds:string[],
 fieldIds:string[],startRow:number,startField:number,matrix:string[][]){
 if(startRow<0||startField<0||!matrix.length)return data;
 const lookup=new Map(data.fields.filter(isSpreadsheetField).map(field=>[field.id,field]));
 let next=data;
 for(let ri=0;ri<Math.min(matrix.length,100);ri++){
  const id=visibleIds[startRow+ri];if(!id)break;
  for(let ci=0;ci<Math.min(matrix[ri].length,30);ci++){
   const field=lookup.get(fieldIds[startField+ci]);
   if(!field)continue;
   const value=matrix[ri][ci];
   const record=next.records.find(item=>item.id===id);
   if(!record||!safeSpreadsheetValue(field,value)||record.values[field.id]===value)continue;
   next=setRecordValue(next,id,field.id,value);
  }
 }
 return next;
}
export function fillGridDown(data:CollectionBlockPayload,visibleIds:string[],
 selectedIds:string[],fieldId:string){
 const field=data.fields.find(f=>f.id===fieldId);
 if(!field||!isSpreadsheetField(field))return data;
 const selected=new Set(selectedIds);
 const ids=visibleIds.filter(id=>selected.has(id));
 if(ids.length<2)return data;
 const first=data.records.find(row=>row.id===ids[0]);
 if(!first)return data;
 const value=first.values[fieldId]??"";
 let next=data;
 for(const id of ids.slice(1)){
  const record=next.records.find(row=>row.id===id);
  if(record&&record.values[fieldId]!==value)next=setRecordValue(next,id,fieldId,value);
 }
 return next;
}
