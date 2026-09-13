"use client";
import Image from "next/image";
import {useRef} from "react";
import {ZoomIn} from "lucide-react";

export function MatchPhoto({src,alt,className="",showZoomControl=false}:{src:string;alt:string;className?:string;showZoomControl?:boolean}){
  const dialog=useRef<HTMLDialogElement>(null);
  return <><button className={`match-photo-button ${className}`} type="button" aria-label={`${alt} vergroten`} onClick={()=>dialog.current?.showModal()}><Image unoptimized src={src} width={240} height={160} alt={alt}/>{showZoomControl&&<span className="match-photo-zoom" aria-hidden="true"><ZoomIn size={18}/></span>}</button><dialog ref={dialog} className="photo-lightbox" aria-label={alt} onClick={event=>{if(event.target===event.currentTarget)dialog.current?.close()}}><div className="photo-lightbox-content"><button className="photo-close" type="button" aria-label="Foto sluiten" onClick={()=>dialog.current?.close()}>×</button><Image unoptimized src={src} width={1200} height={900} alt={alt}/></div></dialog></>;
}
