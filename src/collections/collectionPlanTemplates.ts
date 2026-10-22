import {createCollection,type CollectionBlockPayload,type CollectionField} from "./model";
export type PlannerTemplate="blank"|"kanban"|"sprint"|"personal"|"approval";
export const PLAN_TEMPLATES:{id:PlannerTemplate;label:string}[]=[
 {id:"blank",label:"Blank"},{id:"kanban",label:"Basic Kanban"},
 {id:"sprint",label:"Sprint"},{id:"personal",label:"Personal tasks"},
 {id:"approval",label:"Approval workflow"},
];
const settings:Record<PlannerTemplate,{buckets:string[];labels:string[];fields:string[]}>={
 blank:{buckets:["To do","In progress","Done"],labels:[],fields:[]},
 kanban:{buckets:["Backlog","To do","Doing","Done"],labels:["Bug","Feature"],fields:[]},
 sprint:{buckets:["Backlog","Ready","In progress","Review","Done"],labels:["Bug","Story","Blocked"],fields:["Story points"]},
 personal:{buckets:["To do","This week","In progress","Done"],labels:["Home","Work","Errands"],fields:["Area"]},
 approval:{buckets:["Draft","Review","Changes requested","Approved"],labels:["Waiting","Urgent"],fields:["Approver"]},
};
export function applyPlanTemplate(data:CollectionBlockPayload,id:PlannerTemplate):CollectionBlockPayload{
 if(data.records.length||!(id in settings))return data;
 const config=settings[id];
 const fresh=createCollection();
 const bucket=fresh.fields.find(f=>f.name==="Bucket")!;
 const updated=fresh.fields.map(f=>f.id===bucket.id?{...f,options:config.buckets}:f);
 const extra:CollectionField[]=config.fields.map((name,i)=>({id:"template:"+id+":"+i,name,type:name==="Story points"?"number":"text"}));
 return {...fresh,title:data.title,fields:[...updated,...extra],
  labels:config.labels.map((name,i)=>({id:"template-label:"+id+":"+i,name,color:["#5B5FC7","#A84C78","#286D53"][i%3]})),
  people:data.people??[]};
}
