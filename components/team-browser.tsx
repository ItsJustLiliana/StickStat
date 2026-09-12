"use client";
import Link from "next/link";
import {useState} from "react";
type Club={id:string;name:string};
export function TeamBrowser({clubs}:{clubs:Club[]}){const [query,setQuery]=useState("");const visible=clubs.filter(club=>club.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()));return <section className="card club-browser-card"><div className="card-head"><div><span className="eyebrow">Teams ontdekken</span><h2>Zoek een club</h2></div></div><input className="input" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Club zoeken" aria-label="Club zoeken"/><div className="club-search-results">{visible.map(club=><Link className="club-search-result" href={`/clubs/${club.id}`} key={club.id}>{club.name}<span>Bekijk teams →</span></Link>)}</div>{!visible.length&&<div className="empty">Geen clubs gevonden.</div>}</section>}
