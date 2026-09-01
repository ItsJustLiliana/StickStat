"use client";

import {useState} from "react";
import {TeamSelector} from "./team-selector";

type StandingRow={id:string;teamId:string;teamName:string;position:number;played:number;won:number;drawn:number;lost:number;goalsFor:number;goalsAgainst:number;goalDifference:number;points:number};
type TeamOption={id:string;name:string;club:{name:string}};

export function StandingsView({competition,rows,teams,currentTeamId}:{competition:string;rows:StandingRow[];teams:TeamOption[];currentTeamId:string}){
  const [details,setDetails]=useState(false);
  return <>
    <div className="page-head page-head-with-tools"><div><span className="eyebrow">{competition}</span><h1>Stand</h1></div><div className="page-head-tools"><TeamSelector teams={teams} current={currentTeamId}/><button className="detail-toggle" type="button" role="switch" aria-checked={details} onClick={()=>setDetails(value=>!value)}><span>Details</span><i aria-hidden="true"><b/></i></button></div></div>
    <section className={`card standings-card ${details?"is-detailed":""}`}>
      <table className="standings-table"><thead><tr><th>#</th><th>Team</th>{details&&<><th>GS</th><th>W</th><th>G</th><th>V</th><th>DV</th><th>DT</th></>}<th>DS</th><th>P</th></tr></thead><tbody>
        {rows.map(row=><tr className={row.teamId===currentTeamId?"active-row":""} key={row.id}><td><strong>{row.position}</strong></td><td className="team-name"><strong>{row.teamName}</strong></td>{details&&<><td>{row.played}</td><td>{row.won}</td><td>{row.drawn}</td><td>{row.lost}</td><td>{row.goalsFor}</td><td>{row.goalsAgainst}</td></>}<td className="goal-difference">{row.goalDifference>0?`+${row.goalDifference}`:row.goalDifference}</td><td className="points"><strong>{row.points}</strong></td></tr>)}
      </tbody></table>
      {!rows.length&&<div className="empty">De stand verschijnt na de eerste succesvolle synchronisatie.</div>}
    </section>
  </>;
}
