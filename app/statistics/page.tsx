import {PageShell} from "@/components/page-shell";
import {TeamSelector} from "@/components/team-selector";
import {EmptyTeam} from "@/components/empty-team";
import {StatsCharts} from "@/components/stats-charts";
import {pageContext} from "@/lib/page-data";
import {db} from "@/lib/db";
import {StatisticsService} from "@/services/statistics";

export const dynamic="force-dynamic";
export default async function Statistics({searchParams}:{searchParams:Promise<{team?:string}>}){
  const q=await searchParams,{user,teams,team}=await pageContext(q.team);
  if(!team)return <PageShell user={user}><EmptyTeam/></PageShell>;
  const matches=await db.match.findMany({where:{status:"finished",OR:[{homeTeamId:team.id},{awayTeamId:team.id}]},orderBy:{date:"asc"}});
  const players=await db.player.findMany({where:{teamId:team.id},include:{matchStats:true}});
  const summary=StatisticsService.summary(matches,team.id),cumulative=StatisticsService.cumulativePoints(matches,team.id);
  const chartMatches=matches.map((m,i)=>{const r=StatisticsService.resultFor(m,team.id)!;return{date:m.date.toLocaleDateString("nl-NL",{day:"2-digit",month:"short"}),goalsFor:r.goalsFor,goalsAgainst:r.goalsAgainst,points:cumulative[i]?.points??0}});
  const chartPlayers=players.map(p=>({name:p.displayName,goals:p.matchStats.reduce((n,s)=>n+s.goals,0),assists:p.matchStats.reduce((n,s)=>n+s.assists,0)}));
  return <PageShell user={user}><div className="page-head"><div><span className="eyebrow">Seizoensanalyse</span><h1>Statistieken</h1></div><TeamSelector teams={teams} current={team.id}/></div><section className="metrics"><div className="metric"><span>Winstpercentage</span><strong>{summary.played?Math.round(summary.won/summary.played*100):0}%</strong></div><div className="metric"><span>Goals per duel</span><strong>{summary.played?(summary.goalsFor/summary.played).toFixed(1):"0.0"}</strong></div><div className="metric"><span>Thuisduels</span><strong>{matches.filter(m=>m.homeTeamId===team.id).length}</strong></div><div className="metric"><span>Uitduels</span><strong>{matches.filter(m=>m.awayTeamId===team.id).length}</strong></div><div className="metric"><span>Punten</span><strong>{summary.points}</strong></div><div className="metric"><span>Doelsaldo</span><strong>{summary.goalsFor-summary.goalsAgainst}</strong></div></section><StatsCharts matches={chartMatches} players={chartPlayers}/></PageShell>;
}
