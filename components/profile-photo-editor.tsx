/* eslint-disable @next/next/no-img-element */
"use client";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";

const outputSize=512;

export function ProfilePhotoEditor({currentPhoto,name}:{currentPhoto:string|null;name:string}){
  const canvas=useRef<HTMLCanvasElement>(null),router=useRouter();
  const [source,setSource]=useState<string|null>(null),[zoom,setZoom]=useState(1),[offsetX,setOffsetX]=useState(0),[offsetY,setOffsetY]=useState(0),[busy,setBusy]=useState(false),[message,setMessage]=useState("");

  useEffect(()=>{
    if(!source||!canvas.current)return;
    const image=new Image();
    image.onload=()=>{const target=canvas.current;if(!target)return;const context=target.getContext("2d");if(!context)return;context.clearRect(0,0,outputSize,outputSize);const scale=Math.max(outputSize/image.width,outputSize/image.height)*zoom,width=image.width*scale,height=image.height*scale;context.drawImage(image,(outputSize-width)/2+offsetX,(outputSize-height)/2+offsetY,width,height)};
    image.src=source;
  },[source,zoom,offsetX,offsetY]);

  function choose(file:File|undefined){
    if(!file)return;if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>8_000_000){setMessage("Kies een JPG, PNG of WebP tot 8 MB.");return}
    if(source?.startsWith("blob:"))URL.revokeObjectURL(source);
    setSource(URL.createObjectURL(file));setZoom(1);setOffsetX(0);setOffsetY(0);setMessage("");
  }

  async function save(){
    if(!canvas.current)return;setBusy(true);setMessage("");
    const blob=await new Promise<Blob|null>(resolve=>canvas.current?.toBlob(resolve,"image/jpeg",.9));
    if(!blob){setBusy(false);setMessage("Bijsnijden is mislukt.");return}
    const form=new FormData();form.set("photo",blob,"profile.jpg");
    const response=await fetch("/api/profile/photo",{method:"POST",body:form}),body=await response.json();
    setBusy(false);if(!response.ok){setMessage(body.error?.message??"Uploaden mislukt");return}setSource(null);setMessage("Profielfoto opgeslagen.");router.refresh();
  }

  async function remove(){setBusy(true);setMessage("");const response=await fetch("/api/profile/photo",{method:"DELETE"}),body=await response.json();setBusy(false);if(!response.ok){setMessage(body.error?.message??"Verwijderen mislukt");return}setSource(null);setMessage("Profielfoto verwijderd.");router.refresh()}

  return <section className="card profile-photo-card"><div className="card-head"><div><span className="eyebrow">Profielfoto</span><h2 style={{marginTop:6}}>Jouw foto</h2></div>{currentPhoto?<img className="profile-photo" src={currentPhoto} alt={`Profielfoto van ${name}`}/>:<div className="profile-photo placeholder">{name.split(/\s+/).map(part=>part[0]).join("").slice(0,2).toUpperCase()}</div>}</div><div className="member-actions"><label className="button" style={{display:"inline-block"}}>Foto kiezen<input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={event=>choose(event.target.files?.[0])}/></label>{currentPhoto&&<button className="button secondary" type="button" onClick={()=>{setSource(currentPhoto);setZoom(1);setOffsetX(0);setOffsetY(0)}}>Huidige bijsnijden</button>}{currentPhoto&&<button className="button secondary" type="button" disabled={busy} onClick={()=>void remove()}>Verwijderen</button>}</div>{source&&<div className="crop-editor"><div className="crop-frame"><canvas ref={canvas} width={outputSize} height={outputSize}/><span/></div><label>Zoom<input type="range" min="1" max="3" step="0.01" value={zoom} onChange={event=>setZoom(Number(event.target.value))}/></label><label>Horizontaal<input type="range" min="-220" max="220" value={offsetX} onChange={event=>setOffsetX(Number(event.target.value))}/></label><label>Verticaal<input type="range" min="-220" max="220" value={offsetY} onChange={event=>setOffsetY(Number(event.target.value))}/></label><button className="button" disabled={busy} type="button" onClick={()=>void save()}>{busy?"Opslaan…":"Uitsnede opslaan"}</button></div>}{message&&<p className="muted" role="status" style={{marginTop:14}}>{message}</p>}</section>;
}
