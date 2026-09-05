"use client";
import {ProfilePhoto} from "./profile-photo";

import {useEffect,useRef,useState} from "react";
import type {PointerEvent as ReactPointerEvent} from "react";
import {useRouter} from "next/navigation";

const outputSize=512;
type Point={x:number;y:number};
type DragState=Point&{pointerId:number;startX:number;startY:number};

export function ProfilePhotoEditor({currentPhoto,name}:{currentPhoto:string|null;name:string}){
  const canvas=useRef<HTMLCanvasElement>(null),imageSize=useRef({width:outputSize,height:outputSize}),drag=useRef<DragState|null>(null),router=useRouter();
  const [source,setSource]=useState<string|null>(null),[zoom,setZoom]=useState(1),[offset,setOffset]=useState<Point>({x:0,y:0}),[busy,setBusy]=useState(false),[message,setMessage]=useState("");

  function constrained(point:Point,nextZoom=zoom){
    const size=imageSize.current,scale=Math.max(outputSize/size.width,outputSize/size.height)*nextZoom,maxX=Math.max(0,(size.width*scale-outputSize)/2),maxY=Math.max(0,(size.height*scale-outputSize)/2);
    return {x:Math.max(-maxX,Math.min(maxX,point.x)),y:Math.max(-maxY,Math.min(maxY,point.y))};
  }

  useEffect(()=>{
    if(!source||!canvas.current)return;
    const image=new Image();
    image.onload=()=>{const target=canvas.current;if(!target)return;imageSize.current={width:image.width,height:image.height};const context=target.getContext("2d");if(!context)return;const scale=Math.max(outputSize/image.width,outputSize/image.height)*zoom,width=image.width*scale,height=image.height*scale,maxX=Math.max(0,(width-outputSize)/2),maxY=Math.max(0,(height-outputSize)/2),x=Math.max(-maxX,Math.min(maxX,offset.x)),y=Math.max(-maxY,Math.min(maxY,offset.y));context.clearRect(0,0,outputSize,outputSize);context.drawImage(image,(outputSize-width)/2+x,(outputSize-height)/2+y,width,height)};
    image.src=source;
    return ()=>{image.onload=null;};
  },[source,zoom,offset]);

  useEffect(()=>()=>{if(source?.startsWith("blob:"))URL.revokeObjectURL(source);},[source]);

  function choose(file:File|undefined){
    if(!file)return;if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>8_000_000){setMessage("Kies een JPG, PNG of WebP tot 8 MB.");return}
    setSource(URL.createObjectURL(file));setZoom(1);setOffset({x:0,y:0});setMessage("");
  }

  function startDrag(event:ReactPointerEvent<HTMLDivElement>){event.currentTarget.setPointerCapture(event.pointerId);drag.current={pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,...offset}}
  function moveDrag(event:ReactPointerEvent<HTMLDivElement>){const active=drag.current;if(!active||active.pointerId!==event.pointerId)return;const ratio=outputSize/event.currentTarget.getBoundingClientRect().width;setOffset(constrained({x:active.x+(event.clientX-active.startX)*ratio,y:active.y+(event.clientY-active.startY)*ratio}))}
  function stopDrag(event:ReactPointerEvent<HTMLDivElement>){if(drag.current?.pointerId===event.pointerId)drag.current=null}
  function changeZoom(nextZoom:number){setZoom(nextZoom);setOffset(current=>constrained(current,nextZoom))}

  async function save(){
    if(!canvas.current)return;setBusy(true);setMessage("");
    try {
      const target=canvas.current;
      const blob=await new Promise<Blob|null>(resolve=>target.toBlob(resolve,"image/jpeg",.9));
      if(!blob)throw new Error("Bijsnijden is mislukt.");
      const form=new FormData();form.set("photo",blob,"profile.jpg");
      const response=await fetch("/api/profile/photo",{method:"POST",body:form}),body=await response.json();
      if(!response.ok)throw new Error(body.error?.message??"Uploaden mislukt");
      setSource(null);setMessage("Profielfoto opgeslagen.");router.refresh();
    } catch(error) {setMessage(error instanceof Error?error.message:"Uploaden mislukt");}
    finally {setBusy(false);}
  }

  async function remove(){
    setBusy(true);setMessage("");
    try {
      const response=await fetch("/api/profile/photo",{method:"DELETE"}),body=await response.json();
      if(!response.ok)throw new Error(body.error?.message??"Verwijderen mislukt");
      setSource(null);setMessage("Profielfoto verwijderd.");router.refresh();
    } catch(error) {setMessage(error instanceof Error?error.message:"Verwijderen mislukt");}
    finally {setBusy(false);}
  }

  return <section className="card profile-photo-card"><div className="card-head"><div><span className="eyebrow">Profielfoto</span><h2 style={{marginTop:6}}>Jouw foto</h2></div>{currentPhoto?<ProfilePhoto src={currentPhoto} name={name}/>:<div className="profile-photo placeholder">{name.split(/\s+/).map(part=>part[0]).join("").slice(0,2).toUpperCase()}</div>}</div><div className="member-actions"><label className="button" style={{display:"inline-block"}}>Foto kiezen<input hidden disabled={busy} type="file" accept="image/jpeg,image/png,image/webp" onChange={event=>{choose(event.target.files?.[0]);event.target.value="";}}/></label>{currentPhoto&&<button className="button secondary" type="button" disabled={busy} onClick={()=>{setSource(currentPhoto);setZoom(1);setOffset({x:0,y:0})}}>Huidige bijsnijden</button>}{currentPhoto&&<button className="button secondary" type="button" disabled={busy} onClick={()=>void remove()}>Verwijderen</button>}</div>{source&&<div className="crop-editor"><p className="muted crop-help">Sleep de foto om de uitsnede te bepalen.</p><div className="crop-frame" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={stopDrag} onPointerCancel={stopDrag}><canvas ref={canvas} width={outputSize} height={outputSize}/><span/></div><label>Zoom<input type="range" min="1" max="3" step="0.01" value={zoom} onChange={event=>changeZoom(Number(event.target.value))}/></label><button className="button" disabled={busy} type="button" onClick={()=>void save()}>{busy?"Opslaan…":"Uitsnede opslaan"}</button></div>}{message&&<p className="muted" role="status" style={{marginTop:14}}>{message}</p>}</section>;
}
