"use client";
import {ImagePlus,Trash2} from "lucide-react";
import {useRouter} from "next/navigation";
import {useState} from "react";

type Kind="team"|"mvp";
export function MatchPhotoManager({matchId,teamId,teamPhotoPath,mvpPhotoPath,mvpName,canEdit}:{matchId:string;teamId:string;teamPhotoPath:string|null;mvpPhotoPath:string|null;mvpName:string|null;canEdit:boolean}){
  const router=useRouter(),[busy,setBusy]=useState<Kind|null>(null),[message,setMessage]=useState("");
  async function upload(kind:Kind,file:File|undefined){if(!file)return;if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>4_000_000){setMessage("Kies een JPG, PNG of WebP tot 4 MB.");return}setBusy(kind);setMessage("");try{const form=new FormData();form.set("teamId",teamId);form.set(`${kind}Photo`,file);const response=await fetch(`/api/matches/${matchId}/photos`,{method:"POST",body:form}),body=await response.json();if(!response.ok)throw new Error(body.error?.message??"Uploaden mislukt");setMessage("Foto opgeslagen.");router.refresh()}catch(error){setMessage(error instanceof Error?error.message:"Uploaden mislukt")}finally{setBusy(null)}}
  async function remove(kind:Kind){setBusy(kind);setMessage("");try{const response=await fetch(`/api/matches/${matchId}/photos`,{method:"DELETE",headers:{"content-type":"application/json"},body:JSON.stringify({teamId,kind})}),body=await response.json();if(!response.ok)throw new Error(body.error?.message??"Verwijderen mislukt");setMessage("Foto verwijderd.");router.refresh()}catch(error){setMessage(error instanceof Error?error.message:"Verwijderen mislukt")}finally{setBusy(null)}}
  if(!canEdit)return null;
  const controls=[{kind:"team" as const,label:"Teamfoto",current:teamPhotoPath},...(mvpName?[{kind:"mvp" as const,label:`Foto Man of the Match: ${mvpName}`,current:mvpPhotoPath}]:[])];
  return <section className="match-photo-manager"><h3>Wedstrijdfoto&apos;s</h3><p className="muted">Teambeheerder kan een teamfoto en, na het kiezen van de Man of the Match, diens foto toevoegen.</p><div className="match-photo-actions">{controls.map(control=><div key={control.kind}><label className="button secondary"><ImagePlus size={16}/>{busy===control.kind?"Bezig…":control.current?`${control.label} vervangen`:control.label}<input hidden disabled={busy!==null} type="file" accept="image/jpeg,image/png,image/webp" onChange={event=>{void upload(control.kind,event.target.files?.[0]);event.target.value=""}}/></label>{control.current&&<button className="icon-button" disabled={busy!==null} type="button" aria-label={`${control.label} verwijderen`} onClick={()=>void remove(control.kind)}><Trash2 size={16}/></button>}</div>)}</div>{message&&<p className="muted" role="status">{message}</p>}</section>;
}
