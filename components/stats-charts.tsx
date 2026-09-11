"use client";

import {Bar,BarChart,CartesianGrid,Line,LineChart,ResponsiveContainer,Tooltip,XAxis,YAxis} from "recharts";

type MatchPoint={date:string;goalsFor:number;goalsAgainst:number;points:number};
type PlayerPoint={name:string;goals:number;assists:number};

function EmptyChart({message}:{message:string}){return <div className="chart-empty"><span aria-hidden="true">↗</span><strong>Nog geen grafiek</strong><p>{message}</p></div>}

export function StatsCharts({matches,players}:{matches:MatchPoint[];players:PlayerPoint[]}){
  const hasMatches=matches.length>0,hasContributions=players.some(player=>player.goals>0||player.assists>0);
  return <div className="charts statistics-charts">
    <section className="card chart-card"><div className="card-head"><div><span className="eyebrow">Wedstrijdverloop</span><h2>Goals voor en tegen</h2></div></div><div className="chart">{hasMatches?<ResponsiveContainer width="100%" height="100%"><LineChart data={matches} margin={{left:-18,right:8}}><CartesianGrid stroke="var(--line)" vertical={false}/><XAxis dataKey="date" tick={{fontSize:11}}/><YAxis allowDecimals={false}/><Tooltip/><Line type="monotone" dataKey="goalsFor" name="Voor" stroke="#0c5c42" strokeWidth={3} dot={{r:3}}/><Line type="monotone" dataKey="goalsAgainst" name="Tegen" stroke="#ff7043" strokeWidth={3} dot={{r:3}}/></LineChart></ResponsiveContainer>:<EmptyChart message="Na de eerste gespeelde wedstrijd zie je hier het verloop."/>}</div></section>
    <section className="card chart-card"><div className="card-head"><div><span className="eyebrow">Seizoensopbouw</span><h2>Cumulatieve punten</h2></div></div><div className="chart">{hasMatches?<ResponsiveContainer width="100%" height="100%"><LineChart data={matches} margin={{left:-18,right:8}}><CartesianGrid stroke="var(--line)" vertical={false}/><XAxis dataKey="date" tick={{fontSize:11}}/><YAxis allowDecimals={false}/><Tooltip/><Line type="monotone" dataKey="points" name="Punten" stroke="#0c5c42" strokeWidth={4} dot={{r:3,fill:"#c9f45b",stroke:"#0c5c42",strokeWidth:2}}/></LineChart></ResponsiveContainer>:<EmptyChart message="Punten worden opgebouwd zodra er uitslagen zijn."/>}</div></section>
    <section className="card chart-card player-chart-card"><div className="card-head"><div><span className="eyebrow">Aanvallende bijdrage</span><h2>Goals en assists</h2></div></div><div className="chart">{hasContributions?<ResponsiveContainer width="100%" height="100%"><BarChart data={players} margin={{left:-18,right:8}}><CartesianGrid stroke="var(--line)" vertical={false}/><XAxis dataKey="name" tick={{fontSize:11}} interval={0} angle={players.length>5?-18:0} textAnchor={players.length>5?"end":"middle"} height={players.length>5?58:30}/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="goals" name="Goals" fill="#0c5c42" radius={[5,5,0,0]}/><Bar dataKey="assists" name="Assists" fill="#c9f45b" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer>:<EmptyChart message="Registreer goals of assists om deze bijdrage te zien."/>}</div></section>
  </div>;
}
