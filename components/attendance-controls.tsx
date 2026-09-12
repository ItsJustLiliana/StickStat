"use client";
import {Clock3} from "lucide-react";
import {useState,useTransition} from "react";
import {useRouter} from "next/navigation";
import {Toast} from "./toast";
export type AttendanceStatus="present"|"unknown"|"absent";
const choices=[["present","✓","Aanwezig"],["unknown","?","Onbekend"],["absent","×","Afwezig"]] as const;
export function AttendanceControls({endpoint,playerId,name,status,late=false,canMarkLate=false,disabled=false,locked=false}:{endpoint:string;playerId:string;name:string;status:AttendanceStatus;late?:boolean;canMarkLate?:boolean;disabled?:boolean;locked?:boolean}){
 const router=useRouter(),[busy,setBusy]=useState(false),[error,setError]=useState(""),[refreshing,startTransition]=useTransition();
 async function change(next:AttendanceStatus,nextLate=late){setBusy(true);setError("");try{const response=await fetch(endpoint,{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({playerId,status:next,late:nextLate})}),body=await response.json();if(!response.ok)throw new Error(body.error?.message??"Opslaan mislukt");startTransition(()=>router.refresh())}catch(error){setError(error instanceof Error?error.message:"Opslaan mislukt")}finally{setBusy(false)}}
 return <div className={`attendance-control ${locked?"is-locked":""}`}>{canMarkLate&&<button type="button" className={`late-toggle ${late?"active":""}`} aria-pressed={late} aria-label={`${late?"Te laat verwijderen bij":"Markeer te laat voor"} ${name}`} title="Komt te laat" disabled={disabled||locked||busy||refreshing} onClick={()=>void change(status,!late)}><Clock3 size={15}/></button>}<div className="attendance-options" role="group" aria-label={`Aanwezigheid van ${name}${locked?": vergrendeld":""}`}>{choices.map(([value,icon,label])=><button key={value} type="button" title={locked?"Aanmeldingen vergrendeld":label} aria-label={`${label}: ${name}`} disabled={disabled||locked||busy||refreshing} className={`attendance-choice ${value}`} aria-pressed={status===value} onClick={()=>void change(value)}>{icon}</button>)}</div>{error&&<Toast message={error} onDismiss={()=>setError("")}/>}</div>
}
