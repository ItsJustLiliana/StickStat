"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";

type Status="present"|"unknown"|"absent";
type Person={playerId:string;name:string;status:Status;editable:boolean;isSubstitute?:boolean};
const choices:[Status,string,string][]=[["present","✓","Aanwezig"],["unknown","?","Onbekend"],["absent","×","Afwezig"]];

export function AttendanceList({endpoint,people,canManage}:{endpoint:string;people:Person[];canManage:boolean}){
  const router=useRouter(),[rows,setRows]=useState(people),[busy,setBusy]=useState<string|null>(null),[message,setMessage]=useState("");
  const regularPlayers=rows.filter(person=>!person.isSubstitute),substitutes=rows.filter(person=>person.isSubstitute);

  async function change(playerId:string,status:Status){setBusy(playerId);setMessage("");const response=await fetch(endpoint,{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({playerId,status})}),body=await response.json();setBusy(null);if(!response.ok){setMessage(body.error?.message??"Opslaan mislukt");return}setRows(current=>current.map(row=>row.playerId===playerId?{...row,status}:row));router.refresh()}

  function playerRows(players:Person[]){return <div className="attendance-list">{players.map(person=><div className="attendance-row" key={person.playerId}><strong>{person.name}</strong><div className="attendance-options">{choices.map(([status,icon,label])=><button key={status} type="button" title={label} aria-label={`${label}: ${person.name}`} disabled={busy===person.playerId||!person.editable} className={`attendance-choice ${status}`} aria-pressed={person.status===status} onClick={()=>void change(person.playerId,status)}>{icon}</button>)}</div></div>)}</div>}

  return <section className="card attendance-card">
    <div className="card-head"><div><h2>Aanwezigheid</h2><p className="muted">Groen is aanwezig, grijs onbekend en rood afwezig.</p></div>{canManage&&<span className="badge accent">TEAMBEHEER</span>}</div>
    {playerRows(regularPlayers)}
    {substitutes.length>0&&<details className="substitute-attendance"><summary><span>Invalspelers</span><small>{substitutes.length} optioneel</small></summary>{playerRows(substitutes)}</details>}
    {!rows.length&&<div className="empty">Geen spelers in deze selectie.</div>}
    {message&&<p className="error" role="alert">{message}</p>}
  </section>;
}
