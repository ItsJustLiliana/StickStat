"use client";

import Link from "next/link";
import {useRouter} from "next/navigation";
import {Bell} from "lucide-react";
import {useEffect,useRef,useState} from "react";

type Notice={id:string;type?:string;title:string;body:string;link:string|null;readAt:string|null;createdAt:string};
type InstalledVersion={version:string;buildNumber:string};
type Release={version:string;buildNumber:number};

const installedVersionKey="stickstat-installed-app-version";

function installedVersion():InstalledVersion|null{
  try{
    const value=JSON.parse(localStorage.getItem(installedVersionKey)??"null") as Partial<InstalledVersion>|null;
    return value&&typeof value.version==="string"&&typeof value.buildNumber==="string"?value as InstalledVersion:null;
  }catch{return null}
}

function newerVersion(remote:string,local:string){
  const remoteParts=remote.split(".").map(Number),localParts=local.split(".").map(Number);
  for(let index=0;index<3;index++){const difference=(remoteParts[index]??0)-(localParts[index]??0);if(difference)return difference>0}
  return false;
}

function updateAvailable(release:Release,installed:InstalledVersion|null){
  if(!installed)return false;
  return release.buildNumber>(Number.parseInt(installed.buildNumber,10)||0)||newerVersion(release.version,installed.version);
}

export function NotificationsMenu(){
  const router=useRouter();
  const [items,setItems]=useState<Notice[]>([]),[release,setRelease]=useState<Release|null>(null),[installed,setInstalled]=useState<InstalledVersion|null>(null),[open,setOpen]=useState(false),menuRef=useRef<HTMLDivElement>(null);

  useEffect(()=>{
    fetch("/api/notifications").then(response=>response.json()).then(body=>setItems(body.data??[])).catch(()=>{});
    fetch("/api/app/releases/latest",{cache:"no-store"}).then(response=>response.json()).then(body=>{if(typeof body.data?.version==="string"&&typeof body.data?.buildNumber==="number")setRelease(body.data)}).catch(()=>{});
    const refreshInstalled=()=>setInstalled(installedVersion());
    refreshInstalled();
    window.addEventListener("stickstat-app-version",refreshInstalled);
    return()=>window.removeEventListener("stickstat-app-version",refreshInstalled);
  },[]);

  useEffect(()=>{if(!open)return;const closeOutside=(event:PointerEvent)=>{if(menuRef.current&&!menuRef.current.contains(event.target as Node))setOpen(false)},closeOnEscape=(event:KeyboardEvent)=>{if(event.key==="Escape")setOpen(false)};document.addEventListener("pointerdown",closeOutside);document.addEventListener("keydown",closeOnEscape);return()=>{document.removeEventListener("pointerdown",closeOutside);document.removeEventListener("keydown",closeOnEscape)}},[open]);

  const hasUpdate=Boolean(release&&updateAvailable(release,installed));
  const visibleItems=hasUpdate?items.filter(item=>item.type!=="app_update"):items;
  const regularUnread=visibleItems.filter(item=>!item.readAt).length;
  const unread=regularUnread+(hasUpdate?1:0);

  async function markAll(){await fetch("/api/notifications",{method:"PATCH"});setItems(current=>current.map(item=>({...item,readAt:item.readAt??new Date().toISOString()})))}

  function openUpdate(){
    setOpen(false);
    const bridge=(window as Window&{StickStatApp?:{postMessage:(message:string)=>void}}).StickStatApp;
    if(bridge){bridge.postMessage("check-update");return}
    router.push("/updates");
  }

  return <div className="notifications" ref={menuRef}><button className="theme-toggle notification-button" aria-label="Notificaties" aria-expanded={open} onClick={()=>setOpen(value=>!value)}><Bell size={17}/>{unread>0&&<i/>}</button>{open&&<section className="notification-popover"><div className="card-head"><strong>Notificaties</strong>{regularUnread>0&&<button className="link link-button" onClick={()=>void markAll()}>{hasUpdate?"Overige gelezen":"Alles gelezen"}</button>}</div>{hasUpdate&&release&&<button type="button" className="notification-item unread notification-update" onClick={openUpdate}><strong>StickStat {release.version} is beschikbaar</strong><span>Tik hier om de update te downloaden en installeren.</span><small>App-update</small></button>}{visibleItems.map(item=><Link href={item.link??"#"} onClick={()=>setOpen(false)} className={item.readAt?"notification-item":"notification-item unread"} key={item.id}><strong>{item.title}</strong><span>{item.body}</span><small>{new Date(item.createdAt).toLocaleDateString("nl-NL")}</small></Link>)}{!visibleItems.length&&!hasUpdate&&<p className="muted">Geen notificaties.</p>}</section>}</div>
}
