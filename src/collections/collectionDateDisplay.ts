/** Date-only values must not shift by timezone when displayed in Vietnamese format. */
export function displayPlannerDate(value:string):string{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return value;
 const [year,month,day]=value.split("-").map(Number);
 const date=new Date(Date.UTC(year,month-1,day));
 if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)return value;
 return new Intl.DateTimeFormat("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric",timeZone:"UTC"}).format(date);
}
