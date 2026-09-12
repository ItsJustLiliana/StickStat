"use client";
import {ChevronDown,Search} from "lucide-react";
import Link from "next/link";
import {usePathname,useRouter,useSearchParams} from "next/navigation";
import {useState} from "react";
type Team={id:string;name:string;club:{name:string}};
export function TeamFollowSwitcher({teams,current}:{teams:Team[];current:string}){const [open,setOpen]=useState(false),router=useRouter(),pathname=usePathname(),search=useSearchParams();function select(teamId:string){const params=new URLSearchParams(search);params.set("team",teamId);setOpen(false);router.push(`${pathname}?${params}`)}return <div className="team-follow-switcher"><button className="team-follow-trigger" type="button" aria-label="Team wisselen" aria-expanded={open} onClick={()=>setOpen(value=>!value)}><ChevronDown size={18}/></button>{open&&<div className="team-follow-menu"><strong>Gevolgde teams</strong>{teams.length?teams.map(team=><button key={team.id} type="button" className={team.id===current?"active":""} onClick={()=>select(team.id)}>{team.club.name} · {team.name}</button>):<p className="muted">Nog geen favoriete teams.</p>}<Link href="/clubs" onClick={()=>setOpen(false)}><Search size={15}/> Teams zoeken</Link></div>}</div>}
