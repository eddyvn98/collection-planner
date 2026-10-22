import {useState,type ClipboardEvent,type KeyboardEvent} from "react";
import {fillGridDown,parseSpreadsheetMatrix,pasteGridCells} from "../collections/collectionGridSpreadsheet";
import type {CollectionBlockPayload,CollectionRecord} from "../collections/model";
interface Props{data:CollectionBlockPayload;rows:CollectionRecord[];
 selectedIds:string[];readOnly:boolean;onChange:(data:CollectionBlockPayload)=>void;}
const cellFor=(target:EventTarget|null)=>
 (target as HTMLElement|null)?.closest<HTMLTableCellElement>("td[data-grid-field]")??null;
const isCellEditor=(target:HTMLElement)=>
 !!target.closest("[data-grid-cell-editor],[data-grid-input]");
function tableStructure(table:HTMLTableElement){
 const records=[...table.querySelectorAll<HTMLTableRowElement>("tbody tr[data-record-id]")]
  .map(row=>row.dataset.recordId??"").filter(Boolean);
 const first=table.querySelector<HTMLTableRowElement>("tbody tr[data-record-id]");
 const fields=[...first?.querySelectorAll<HTMLTableCellElement>("td[data-grid-field]")??[]]
  .map(cell=>cell.dataset.gridField??"").filter(Boolean);
 return {records,fields};
}
export function useGridSpreadsheet({data,rows,selectedIds,readOnly,onChange}:Props){
 const [status,setStatus]=useState("");
 const onPasteCapture=(event:ClipboardEvent<HTMLTableElement>)=>{
  if(readOnly)return;
  const cell=cellFor(event.target);if(!cell)return;
  const text=event.clipboardData.getData("text/plain");
  const input=event.target as HTMLElement;
  if(input.matches("input,textarea")&&!/[\r\n\t]/.test(text))return;
  const matrix=parseSpreadsheetMatrix(text);
  if(!matrix.length)return;
  const {records,fields}=tableStructure(event.currentTarget);
  const row=records.indexOf(cell.closest("tr")?.getAttribute("data-record-id")??"");
  const column=fields.indexOf(cell.dataset.gridField??"");
  if(row<0||column<0)return;
  event.preventDefault();
  const next=pasteGridCells(data,records,fields,row,column,matrix);
  if(next!==data){onChange(next);setStatus("Đã dán dữ liệu vào Grid · Hoàn tác: Ctrl+Z");}
  else setStatus("Không có ô hợp lệ để dán.");
 };
 const onKeyDownCapture=(event:KeyboardEvent<HTMLTableElement>)=>{
  const target=event.target as HTMLElement,cell=cellFor(target);
  if(!cell||!isCellEditor(target))return;
  const {records,fields}=tableStructure(event.currentTarget);
  const row=records.indexOf(cell.closest("tr")?.getAttribute("data-record-id")??"");
  const col=fields.indexOf(cell.dataset.gridField??"");
  if(row<0||col<0)return;
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="d"&&!readOnly){
   event.preventDefault();event.stopPropagation();
   const next=fillGridDown(data,rows.map(item=>item.id),selectedIds,fields[col]);
   if(next!==data){onChange(next);setStatus("Đã điền xuống các hàng đã chọn · Hoàn tác: Ctrl+Z");}
   else setStatus("Chọn ít nhất hai hàng để dùng Ctrl+D.");
   return;
  }
  if(event.ctrlKey||event.altKey||event.metaKey)return;
  if(!["Tab","Enter","ArrowDown","ArrowUp","ArrowLeft","ArrowRight"].includes(event.key))return;
  const input=target.matches("input,select,textarea");
  if(input&&event.key!=="Enter"&&event.key!=="Tab")return;
  const nextRow=event.key==="ArrowDown"||event.key==="Enter"&&!event.shiftKey?row+1:
   event.key==="ArrowUp"||event.key==="Enter"&&event.shiftKey?row-1:row;
  let nextCol=event.key==="ArrowRight"||event.key==="Tab"&&!event.shiftKey?col+1:
   event.key==="ArrowLeft"||event.key==="Tab"&&event.shiftKey?col-1:col;
  let finalRow=nextRow;
  if(nextCol>=fields.length){nextCol=0;finalRow++;}
  if(nextCol<0){nextCol=fields.length-1;finalRow--;}
  if(finalRow<0||finalRow>=records.length)return;
  if(!input){event.preventDefault();event.stopPropagation();}
  // Inputs finish their own Enter commit; focus moves after React renders.
  const table=event.currentTarget;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   const destination=[...table.querySelectorAll<HTMLTableRowElement>("tbody tr[data-record-id]")]
    .find(tr=>tr.dataset.recordId===records[finalRow])
    ?.querySelectorAll<HTMLTableCellElement>("td[data-grid-field]")??[]]
    .find(td=>td.dataset.gridField===fields[nextCol]);
   destination?.querySelector<HTMLButtonElement>("[data-grid-cell-editor]")?.focus();
  }));
 };
 return {status,onPasteCapture,onKeyDownCapture};
}
