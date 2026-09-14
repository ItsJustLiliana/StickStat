/* eslint-disable @next/next/no-img-element */
"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {resizePhotoTo1080p} from "@/lib/browser-image";

export function ClubLogoEditor({club}:{club:{id:string;name:string;logoPath:string|null}}){
  const router=useRouter(),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
  async function upload(file:File|undefined){if(!file)return;setBusy(true);setMessage("");try{const logo=await resizePhotoTo1080p(file,2_000_000,true);const form=new FormData();form.set("logo",logo);const response=await fetch(`/api/clubs/${club.id}/logo`,{method:"POST",body:form}),body=await response.json();if(!response.ok)throw new Error(body.error?.message??"Uploaden mislukt");setMessage("Clublogo opgeslagen.");router.refresh()}catch(error){setMessage(error instanceof Error?error.message:"Uploaden mislukt")}finally{setBusy(false)}}
  return <section className="card"><div className="card-head"><div><span className="eyebrow">Clubuitstraling</span><h2>Clublogo</h2></div>{club.logoPath?<img className="club-logo-preview" src={club.logoPath} alt={`${club.name} logo`}/>:<div className="club-logo-preview placeholder">{club.name.split(/\s+/).map(part=>part[0]).join("").slice(0,3)}</div>}</div><p className="muted">StickStat probeert het logo automatisch te synchroniseren. Een handmatige upload krijgt altijd voorrang.</p><label className="button upload-button">Logo kiezen<input hidden type="file" accept="image/*,.heic,.heif" disabled={busy} onChange={event=>void upload(event.target.files?.[0])}/></label>{message&&<p className="form-message" role="status">{message}</p>}</section>
}
