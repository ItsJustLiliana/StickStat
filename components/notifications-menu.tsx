"use client";
import Link from "next/link";import {Bell} from "lucide-react";import {useEffect,useRef,useState} from "react";
type Notice={id:string;title:string;body:string;link:string|null;readAt:string|null;createdAt:string};
export function NotificationsMenu(){
  const [items,setItems]=useState<Notice[]>([]),[open,setOpen]=useState(false),menuRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{fetch("/api/notifications").then(response=>response.json()).then(body=>setItems(body.data??[])).catch(()=>{})},[]);
  useEffect(()=>{if(!open)return;const closeOutside=(event:PointerEvent)=>{if(menuRef.current&&!menuRef.current.contains(event.target as Node))setOpen(false)},closeOnEscape=(event:KeyboardEvent)=>{if(event.key==="Escape")setOpen(false)};document.addEventListener("pointerdown",closeOutside);document.addEventListener("keydown",closeOnEscape);return()=>{document.removeEventListener("pointerdown",closeOutside);document.removeEventListener("keydown",closeOnEscape)}},[open]);
  const unread=items.filter(item=>!item.readAt).length;
  async function markAll(){await fetch("/api/notifications",{method:"PATCH"});setItems(current=>current.map(item=>({...item,readAt:item.readAt??new Date().toISOString()})))}
  return <div className="notifications" ref={menuRef}><button className="theme-toggle notification-button" aria-label="Notificaties" aria-expanded={open} onClick={()=>setOpen(value=>!value)}><Bell size={17}/>{unread>0&&<i/>}</button>{open&&<section className="notification-popover"><div className="card-head"><strong>Notificaties</strong>{unread>0&&<button className="link link-button" onClick={()=>void markAll()}>Alles gelezen</button>}</div>{items.map(item=><Link href={item.link??"#"} onClick={()=>setOpen(false)} className={item.readAt?"notification-item":"notification-item unread"} key={item.id}><strong>{item.title}</strong><span>{item.body}</span><small>{new Date(item.createdAt).toLocaleDateString("nl-NL")}</small></Link>)}{!items.length&&<p className="muted">Geen notificaties.</p>}</section>}</div>
}
