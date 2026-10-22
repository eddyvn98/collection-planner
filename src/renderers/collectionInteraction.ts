export function nextMenuIndex(current:number,length:number,key:string):number {
 if(length<=0)return -1;
 if(key==="Home")return 0;
 if(key==="End")return length-1;
 if(key==="ArrowDown")return (current+1+length)%length;
 if(key==="ArrowUp")return (current-1+length)%length;
 return current;
}
export function menuTypeahead(labels:string[],query:string):number {
 const q=query.trim().toLocaleLowerCase();
 return q?labels.findIndex(x=>x.toLocaleLowerCase().startsWith(q)):-1;
}
export function nextFocusIndex(index:number,count:number,shift:boolean):number {
 if(!count)return -1;
 return shift?(index<=0?count-1:index-1):(index>=count-1?0:index+1);
}
export const focusSelector=
 'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])';
export function contrastRatio(fg:string,bg:string):number {
 const luminance=(hex:string)=>{
  const rgb=hex.replace("#","").match(/.{2}/g);
  if(!rgb||rgb.length!==3)return NaN;
  const ch=rgb.map(x=>{
   const n=parseInt(x,16)/255;
   return n<=.04045?n/12.92:Math.pow((n+.055)/1.055,2.4);
  });
  return .2126*ch[0]+.7152*ch[1]+.0722*ch[2];
 };
 const a=luminance(fg),b=luminance(bg);
 return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
}
export const motionDurations={popover:140,drawer:200,settle:150} as const;
export function motionDuration(milliseconds:number,reduced:boolean){return reduced?0:milliseconds;}
