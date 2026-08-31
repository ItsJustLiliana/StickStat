import Link from "next/link";
import {PageShell} from "@/components/page-shell";
import {TeamSelector} from "@/components/team-selector";
import {EmptyTeam} from "@/components/empty-team";
import {StatsCharts} from "@/components/stats-charts";
import {pageContext} from "@/lib/page-data";
import {db} from "@/lib/db";
import {StatisticsService} from "@/services/statistics";

export const dynamic="force-dynamic";
type PlayerRanking={id:string;name:string;matches:number;goals:number;assists:number;points:number;mvps:number;green:number;yellow:number;red:number;cards:number};
const top=(players:PlayerRanking[],metric:(player:PlayerRanking)=>number)=>[...players].filter(player=>metric(player)>0).sort((a,b)=>metric(b)-metric(a)||b.goals-a.goals||b.assists-a.assists||a.name.localeCompare(b.name,"nl")).slice(0,10);

function Ranking({title,teamId,players,value,render}:{title:string;teamId:string;players:PlayerRanking[];value:(player:PlayerRanking)=>number;render:(player:PlayerRanking)=>React.ReactNode}){
  const rows=top(players,value);
  return <section className="card ranking-card"><div className="card-head"><h2>{title}</h2><span className="badge">TOP {Math.min(10,rows.length)}</span></div>{rows.length?<div className="ranking-list">{rows.map((player,index)=><Link href={`/players/${player.id}?team=${teamId}`} className="ranking-row" key={player.id}><span className="ranking-position">{index+1}</span><span><strong>{player.name}</strong><small>{player.matches} wedstrijden</small></span><strong className="ranking-value">{render(player)}</strong></Link>)}</div>:<p className="muted">Nog geen geregistreerde gegevens.</p>}</section>
}

export default async function Statistics({searchParams}:{searchParams:Promise<{team?:string}>}){
  const query=await searchParams,{user,teams,team}=await pageContext(query.team);if(!team)return <PageShell user={user}><EmptyTeam/></PageShell>;
  const [matches,players]=await Promise.all([
    db.match.findMany({where:{status:"finished",OR:[{homeTeamId:team.id},{awayTeamId:team.id}]},orderBy:{date:"asc"}}),
    db.player.findMany({where:{teamId:team.id},include:{matchStats:{where:{match:{status:"finished",OR:[{homeTeamId:team.id},{awayTeamId:team.id}]}}},events:{where:{match:{status:"finished",OR:[{homeTeamId:team.id},{awayTeamId:team.id}]}}}},orderBy:[{lastName:"asc"},{firstName:"asc"}]}),
  ]);
  const summary=StatisticsService.summary(matches,team.id),cumulative=StatisticsService.cumulativePoints(matches,team.id),rankings:PlayerRanking[]=players.map(player=>{const goals=player.matchStats.reduce((total,stat)=>total+stat.goals,0),assists=player.matchStats.reduce((total,stat)=>total+stat.assists,0),green=player.events.filter(event=>event.type==="green_card").length,yellow=player.events.filter(event=>event.type==="yellow_card").length,red=player.events.filter(event=>event.type==="red_card").length;return{id:player.id,name:player.displayName,matches:player.matchStats.length,goals,assists,points:goals+assists,mvps:player.matchStats.filter(stat=>stat.mvp).length,green,yellow,red,cards:green+yellow+red}});
  const chartMatches=matches.map((match,index)=>{const result=StatisticsService.resultFor(match,team.id)!;return{date:match.date.toLocaleDateString("nl-NL",{day:"2-digit",month:"short"}),goalsFor:result.goalsFor,goalsAgainst:result.goalsAgainst,points:cumulative[index]?.points??0}}),chartPlayers=rankings.filter(player=>player.points>0).sort((a,b)=>b.points-a.points).slice(0,10);
  return <PageShell user={user}><div className="page-head"><div><span className="eyebrow">Team- en spelersprestaties</span><h1>Statistieken</h1></div><TeamSelector teams={teams} current={team.id}/></div><section className="metrics"><div className="metric"><span>Winstpercentage</span><strong>{summary.played?Math.round(summary.won/summary.played*100):0}%</strong></div><div className="metric"><span>Goals per duel</span><strong>{summary.played?(summary.goalsFor/summary.played).toFixed(1):"0.0"}</strong></div><div className="metric"><span>Thuisduels</span><strong>{matches.filter(match=>match.homeTeamId===team.id).length}</strong></div><div className="metric"><span>Uitduels</span><strong>{matches.filter(match=>match.awayTeamId===team.id).length}</strong></div><div className="metric"><span>Punten</span><strong>{summary.points}</strong></div><div className="metric"><span>Doelsaldo</span><strong>{summary.goalsFor-summary.goalsAgainst}</strong></div></section><StatsCharts matches={chartMatches} players={chartPlayers.map(player=>({name:player.name,goals:player.goals,assists:player.assists}))}/><div className="ranking-grid"><Ranking title="Topscorers" teamId={team.id} players={rankings} value={player=>player.goals} render={player=>player.goals}/><Ranking title="Meeste assists" teamId={team.id} players={rankings} value={player=>player.assists} render={player=>player.assists}/><Ranking title="Meeste MVP's" teamId={team.id} players={rankings} value={player=>player.mvps} render={player=>player.mvps}/><Ranking title="Meeste kaarten" teamId={team.id} players={rankings} value={player=>player.cards} render={player=><span className="card-summary"><i className="green"/> {player.green}<i className="yellow"/> {player.yellow}<i className="red"/> {player.red}</span>}/></div></PageShell>
}
