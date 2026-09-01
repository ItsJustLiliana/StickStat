"use client";

import {Bar,BarChart,CartesianGrid,Line,LineChart,ResponsiveContainer,Tooltip,XAxis,YAxis} from "recharts";

type MatchPoint={date:string;goalsFor:number;goalsAgainst:number;points:number};
type PlayerPoint={name:string;goals:number;assists:number};

export function StatsCharts({matches,players}:{matches:MatchPoint[];players:PlayerPoint[]}){
  return <div className="charts statistics-charts">
    <section className="card chart-card"><div className="card-head"><div><span className="eyebrow">Wedstrijdverloop</span><h2>Goals voor en tegen</h2></div></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={matches} margin={{left:-18,right:8}}><CartesianGrid stroke="#e4ebe7" vertical={false}/><XAxis dataKey="date" tick={{fontSize:11}}/><YAxis allowDecimals={false}/><Tooltip/><Line type="monotone" dataKey="goalsFor" name="Voor" stroke="#0c5c42" strokeWidth={3} dot={{r:3}}/><Line type="monotone" dataKey="goalsAgainst" name="Tegen" stroke="#ff7043" strokeWidth={3} dot={{r:3}}/></LineChart></ResponsiveContainer></div></section>
    <section className="card chart-card"><div className="card-head"><div><span className="eyebrow">Seizoensopbouw</span><h2>Cumulatieve punten</h2></div></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={matches} margin={{left:-18,right:8}}><CartesianGrid stroke="#e4ebe7" vertical={false}/><XAxis dataKey="date" tick={{fontSize:11}}/><YAxis allowDecimals={false}/><Tooltip/><Line type="monotone" dataKey="points" name="Punten" stroke="#0c5c42" strokeWidth={4} dot={{r:3,fill:"#c9f45b",stroke:"#0c5c42",strokeWidth:2}}/></LineChart></ResponsiveContainer></div></section>
    <section className="card chart-card player-chart-card"><div className="card-head"><div><span className="eyebrow">Aanvallende bijdrage</span><h2>Goals en assists</h2></div></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={players} margin={{left:-18,right:8}}><CartesianGrid stroke="#e4ebe7" vertical={false}/><XAxis dataKey="name" tick={{fontSize:11}} interval={0} angle={players.length>5?-18:0} textAnchor={players.length>5?"end":"middle"} height={players.length>5?58:30}/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="goals" name="Goals" fill="#0c5c42" radius={[5,5,0,0]}/><Bar dataKey="assists" name="Assists" fill="#c9f45b" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div></section>
  </div>;
}
