import {addDays,format,isValid,parseISO} from "date-fns";
import {createBoardTask,setTaskDate,updateTask,localToday} from "./collectionTasks";
import type {CollectionBlockPayload,TaskPriority} from "./model";
export type InputToken={kind:"date"|"assignee"|"label"|"priority";label:string;value:string};
export interface QuickAddParse{title:string;due:string;priority?:TaskPriority;
 assigneeIds:string[];labelIds:string[];tokens:InputToken[];}
const WEEKDAYS:Record<string,number>={"cn":0,"chủ nhật":0,"chu nhat":0,
 "t2":1,"thứ 2":1,"thu 2":1,"t3":2,"thứ 3":2,"thu 3":2,
 "t4":3,"thứ 4":3,"thu 4":3,"t5":4,"thứ 5":4,"thu 5":4,
 "t6":5,"thứ 6":5,"thu 6":5,"t7":6,"thứ 7":6,"thu 7":6,
 monday:1,tuesday:2,wednesday:3,thursday:4,friday:5,saturday:6,sunday:0};
export function parseNaturalDate(value:string,today=localToday()):string|null{
 const word=value.trim().toLocaleLowerCase("vi");
 const date=parseISO(today);if(!isValid(date))return null;
 if(/^(today|hôm nay|hom nay)$/.test(word))return today;
 if(/^(tomorrow|mai|ngày mai|ngay mai)$/.test(word))return format(addDays(date,1),"yyyy-MM-dd");
 const plus=/^\+(\d{1,3})d$/.exec(word);
 if(plus)return format(addDays(date,Number(plus[1])),"yyyy-MM-dd");
 if(Object.prototype.hasOwnProperty.call(WEEKDAYS,word)){
  const diff=(WEEKDAYS[word]-date.getDay()+7)%7;
  return format(addDays(date,diff||7),"yyyy-MM-dd");
 }
 if(/^\d{4}-\d{2}-\d{2}$/.test(word)){
  const parsed=parseISO(word);return isValid(parsed)&&format(parsed,"yyyy-MM-dd")===word?word:null;
 }
 return null;
}
const PRIORITY:Record<string,TaskPriority>={urgent:"urgent",important:"important",
 medium:"medium",low:"low",cao:"important",gap:"urgent",khẩn:"urgent"};
const DATE_PATTERN=/(^|\s)(ngày mai|ngay mai|hôm nay|hom nay|mai|tomorrow|today|thứ\s*[2-7]|thu\s*[2-7]|t[2-7]|\+\d{1,3}d|\d{4}-\d{2}-\d{2})(?=\s|$)/giu;
export function parseQuickAdd(input:string,data:CollectionBlockPayload,today=localToday()):QuickAddParse{
 const tokens:InputToken[]=[],assigneeIds:string[]=[],labelIds:string[]=[];
 let due="",priority:TaskPriority|undefined,text=input;
 const references=[
  ...(data.people??[]).map(p=>({kind:"assignee" as const,prefix:"@",name:p.name,id:p.id})),
  ...(data.labels??[]).map(p=>({kind:"label" as const,prefix:"#",name:p.name,id:p.id}))
 ].sort((a,b)=>b.name.length-a.name.length);
 for(const item of references){
  const escaped=(item.prefix+item.name).replace(/[\\^$.*+?()[\]{}|]/g,"\\$&");
  const regex=new RegExp("(^|\\s)("+escaped+")(?=\\s|$)","giu");
  text=text.replace(regex,(_full,space:string,word:string)=>{
   tokens.push({kind:item.kind,label:word,value:item.id});
   const ids=item.kind==="assignee"?assigneeIds:labelIds;
   if(!ids.includes(item.id))ids.push(item.id);
   return space;
  });
 }
 text=text.replace(/(^|\s)!([\p{L}]+)/giu,(raw,space:string,p:string)=>{
  const recognized=PRIORITY[p.toLocaleLowerCase("vi")];
  if(!recognized)return raw;
  priority=recognized;tokens.push({kind:"priority",label:"!"+p,value:recognized});return space;
 });
 text=text.replace(DATE_PATTERN,(raw,space:string,day:string)=>{
  const parsed=parseNaturalDate(day,today);
  if(!parsed||due)return raw;
  due=parsed;tokens.push({kind:"date",label:day,value:due});return space;
 });
 return {title:text.replace(/\s+/g," ").trim(),due,priority,assigneeIds,labelIds,tokens};
}
export function createQuickTask(data:CollectionBlockPayload,input:string,
 groupFieldId?:string,bucket="",today=localToday()):CollectionBlockPayload{
 const parsed=parseQuickAdd(input,data,today);
 if(!parsed.title)return data;
 let next=createBoardTask(data,parsed.title,groupFieldId,bucket);
 if(next===data)return data;
 const record=next.records[next.records.length-1];
 if(parsed.due)next=setTaskDate(next,record.id,"due",parsed.due);
 if(parsed.priority||parsed.assigneeIds.length||parsed.labelIds.length)
  next=updateTask(next,record.id,{
   ...(parsed.priority?{priority:parsed.priority}:{}),
   assigneeIds:parsed.assigneeIds,labelIds:parsed.labelIds
  },"Quick add tokens");
 return next;
}
