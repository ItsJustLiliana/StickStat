"use client";

import {Plus,Repeat2,X} from "lucide-react";
import Link from "next/link";
import {usePathname,useRouter,useSearchParams} from "next/navigation";
import {useEffect,useState} from "react";

type Team={id:string;name:string;club:{name:string}};

export function TeamFollowSwitcher({teams,current,ownTeamIds,favoriteTeamIds}:{teams:Team[];current:string;ownTeamIds:string[];favoriteTeamIds:string[]}){
  const [open,setOpen]=useState(false),router=useRouter(),pathname=usePathname(),search=useSearchParams(),own=teams.filter(team=>ownTeamIds.includes(team.id)),favorites=teams.filter(team=>favoriteTeamIds.includes(team.id)&&!ownTeamIds.includes(team.id));
  useEffect(()=>{if(!open)return;const body=document.body,root=document.documentElement,previous={bodyOverflow:body.style.overflow,rootOverflow:root.style.overflow};body.style.overflow="hidden";root.style.overflow="hidden";root.classList.add("team-switch-modal-open");return()=>{body.style.overflow=previous.bodyOverflow;root.style.overflow=previous.rootOverflow;root.classList.remove("team-switch-modal-open")}},[open]);
  function select(teamId:string){const params=new URLSearchParams(search);params.set("team",teamId);setOpen(false);router.push(`${pathname}?${params}`)}
  function TeamButton({team}:{team:Team}){return <button type="button" className={team.id===current?"active":""} onClick={()=>select(team.id)}>{team.club.name} · {team.name}</button>}
  return <div className="team-follow-switcher"><button className="team-follow-trigger" type="button" aria-label="Team wisselen" aria-expanded={open} onClick={()=>setOpen(true)}><Repeat2 size={18}/></button>{open&&<div className="team-switch-modal-backdrop" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)setOpen(false)}}><section className="team-switch-modal" role="dialog" aria-modal="true" aria-label="Team wisselen"><div className="team-switch-modal-head"><div><span className="eyebrow">Team wisselen</span><h2>Jouw teams</h2></div><button type="button" className="icon-button" aria-label="Sluiten" onClick={()=>setOpen(false)}><X size={18}/></button></div><Link className="team-add-button" href="/clubs" onClick={()=>setOpen(false)}><Plus size={18}/> Team toevoegen</Link>{own.length>0&&<section><strong>Jouw team</strong>{own.map(team=><TeamButton team={team} key={team.id}/>)}</section>}<section><strong>Gevolgde teams</strong>{favorites.length?favorites.map(team=><TeamButton team={team} key={team.id}/>):<p className="muted">Nog geen gevolgde teams.</p>}</section></section></div>}</div>;
}
