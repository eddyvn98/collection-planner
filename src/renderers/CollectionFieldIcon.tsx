import { CalendarDays, CheckSquare2, Hash, Image, Link2, ListFilter, Sigma, Type, GitBranch, Calculator } from "lucide-react";
import type { CollectionFieldType } from "../collections/model";
const icons={
 text:Type,number:Hash,date:CalendarDays,select:ListFilter,checkbox:CheckSquare2,
 url:Link2,image:Image,relation:GitBranch,lookup:GitBranch,rollup:Sigma,formula:Calculator,
};
export function CollectionFieldIcon({type,size=16}: {type:CollectionFieldType;size?:number}){
 const Icon=icons[type];
 return <Icon aria-hidden="true" size={size} strokeWidth={1.75}/>;
}
