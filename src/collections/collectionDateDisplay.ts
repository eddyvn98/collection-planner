/** Date-only values must not shift by timezone when displayed in Vietnamese format. */
export function displayPlannerDate(value:string):string{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return value;
 const [year,month,day]=value.split("-").map(Number);
 const date=new Date(Date.UTC(year,month-1,day));
 if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)return value;
 return new Intl.DateTimeFormat("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric",timeZone:"UTC"}).format(date);
}

/** Card dates are compact while dates from other years retain their year. */
export function formatPlannerCardDate(value:string,today:string):string{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return value;
 const [year,month,day]=value.split("-").map(Number);
 const date=new Date(Date.UTC(year,month-1,day));
 if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)return value;
 return String(day).padStart(2,"0")+"/"+String(month).padStart(2,"0")+
  (value.slice(0,4)!==today.slice(0,4)?"/"+year:"");
}
export function formatPlannerPriority(value:string):string{
 return value?value.charAt(0).toUpperCase()+value.slice(1).toLowerCase():"";
}
