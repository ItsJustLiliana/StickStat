"use client";
import Link from "next/link";
import {useState} from "react";
type Team={id:string;name:string;shortName:string};type Club={id:string;name:string;teams:Team[]};
export function TeamBrowser({clubs,initialFavorites}:{clubs:Club[];initialFavorites:string[]}){
  const [query,setQuery]=useState(""),[favorites,setFavorites]=useState(new Set(initialFavorites));
  const visible=clubs.filter(club=>`${club.name} ${club.teams.map(team=>team.name).join(" ")}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  async function toggle(teamId:string){const isFavorite=favorites.has(teamId);const response=await fetch("/api/favorite-teams",{method:isFavorite?"DELETE":"POST",headers:{"content-type":"application/json"},body:JSON.stringify({teamId})});if(response.ok)setFavorites(current=>{const next=new Set(current);if(isFavorite)next.delete(teamId);else next.add(teamId);return next})}
  return <section className="card"><div className="card-head"><div><span className="eyebrow">Teams ontdekken</span><h2>Zoek een club</h2></div></div><input className="input" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Club of team zoeken" aria-label="Club of team zoeken"/>{visible.map(club=><div className="club-browser" key={club.id}><h3>{club.name}</h3>{club.teams.map(team=><div className="club-team-row" key={team.id}><Link href={`/standings?team=${team.id}`}>{team.name}</Link><button className="button secondary compact-button" type="button" onClick={()=>void toggle(team.id)}>{favorites.has(team.id)?"Favoriet ✓":"Favoriet"}</button></div>)}</div>)}{!visible.length&&<div className="empty">Geen clubs of teams gevonden.</div>}</section>;
}
