import Link from "next/link";
import {EmptyTeam} from "@/components/empty-team";
import {PageShell} from "@/components/page-shell";
import {StatsCharts} from "@/components/stats-charts";
import {TeamSelector} from "@/components/team-selector";
import {db} from "@/lib/db";
import {pageContext} from "@/lib/page-data";
import {StatisticsService} from "@/services/statistics";

export const dynamic="force-dynamic";

type PlayerRanking={id:string;name:string;matches:number;starts:number;goals:number;assists:number;points:number;perGame:number;mvps:number;green:number;yellow:number;red:number;cards:number};
const top=(players:PlayerRanking[],metric:(player:PlayerRanking)=>number)=>[...players].filter(player=>metric(player)>0).sort((a,b)=>metric(b)-metric(a)||b.goals-a.goals||b.assists-a.assists||a.name.localeCompare(b.name,"nl")).slice(0,10);
const decimal=(value:number)=>value.toLocaleString("nl-NL",{minimumFractionDigits:1,maximumFractionDigits:1});

function Ranking({title,teamId,players,value,render}:{title:string;teamId:string;players:PlayerRanking[];value:(player:PlayerRanking)=>number;render:(player:PlayerRanking)=>React.ReactNode}){
  const rows=top(players,value);
  return <section className="card ranking-card"><div className="card-head"><h2>{title}</h2><span className="badge">TOP {Math.min(10,rows.length)}</span></div>{rows.length?<div className="ranking-list">{rows.map((player,index)=><Link href={`/players/${player.id}?team=${teamId}`} className="ranking-row" key={player.id}><span className="ranking-position">{index+1}</span><span><strong>{player.name}</strong><small>{player.matches} wedstrijden</small></span><strong className="ranking-value">{render(player)}</strong></Link>)}</div>:<p className="muted">Nog geen geregistreerde gegevens.</p>}</section>;
}

function ResultBar({won,drawn,lost,played}:{won:number;drawn:number;lost:number;played:number}){
  const percentage=(value:number)=>played?`${value/played*100}%`:"0%";
  return <><div className="result-bar" aria-label={`${won} gewonnen, ${drawn} gelijk, ${lost} verloren`}><i className="won" style={{width:percentage(won)}}/><i className="drawn" style={{width:percentage(drawn)}}/><i className="lost" style={{width:percentage(lost)}}/></div><div className="result-legend"><span><i className="won"/>Winst <strong>{won}</strong></span><span><i className="drawn"/>Gelijk <strong>{drawn}</strong></span><span><i className="lost"/>Verlies <strong>{lost}</strong></span></div></>;
}

export default async function Statistics({searchParams}:{searchParams:Promise<{team?:string}>}){
  const query=await searchParams,{user,teams,team}=await pageContext(query.team);
  if(!team)return <PageShell user={user}><EmptyTeam/></PageShell>;
  const matchFilter={status:"finished" as const,OR:[{homeTeamId:team.id},{awayTeamId:team.id}]};
  const [matches,players]=await Promise.all([
    db.match.findMany({where:matchFilter,include:{homeTeam:true,awayTeam:true},orderBy:{date:"asc"}}),
    db.player.findMany({where:{teamId:team.id},include:{matchStats:{where:{match:matchFilter}},events:{where:{match:matchFilter}}},orderBy:[{lastName:"asc"},{firstName:"asc"}]}),
  ]);
  const summary=StatisticsService.detailedSummary(matches,team.id),homeSummary=StatisticsService.summary(matches.filter(match=>match.homeTeamId===team.id),team.id),awaySummary=StatisticsService.summary(matches.filter(match=>match.awayTeamId===team.id),team.id),cumulative=StatisticsService.cumulativePoints(matches,team.id);
  const rankings:PlayerRanking[]=players.map(player=>{const goals=player.matchStats.reduce((total,stat)=>total+stat.goals,0),assists=player.matchStats.reduce((total,stat)=>total+stat.assists,0),green=player.events.filter(event=>event.type==="green_card").length,yellow=player.events.filter(event=>event.type==="yellow_card").length,red=player.events.filter(event=>event.type==="red_card").length,matches=player.matchStats.length,points=goals+assists;return{id:player.id,name:player.displayName,matches,starts:player.matchStats.filter(stat=>stat.started).length,goals,assists,points,perGame:matches?points/matches:0,mvps:player.matchStats.filter(stat=>stat.mvp).length,green,yellow,red,cards:green+yellow+red}});
  const chartMatches=matches.map((match,index)=>{const result=StatisticsService.resultFor(match,team.id)!;return{date:match.date.toLocaleDateString("nl-NL",{day:"2-digit",month:"short"}),goalsFor:result.goalsFor,goalsAgainst:result.goalsAgainst,points:cumulative[index]?.points??0}}),chartPlayers=rankings.filter(player=>player.points>0).sort((a,b)=>b.points-a.points).slice(0,10),playerRows=[...rankings].sort((a,b)=>b.points-a.points||b.goals-a.goals||b.assists-a.assists||a.name.localeCompare(b.name,"nl"));
  const enriched=matches.map(match=>{const result=StatisticsService.resultFor(match,team.id)!;return{match,result,opponent:result.home?match.awayTeam.name:match.homeTeam.name,margin:result.goalsFor-result.goalsAgainst}}),bestWin=enriched.filter(item=>item.margin>0).sort((a,b)=>b.margin-a.margin||b.result.goalsFor-a.result.goalsFor)[0],heaviestLoss=enriched.filter(item=>item.margin<0).sort((a,b)=>a.margin-b.margin)[0];
  const record=(item:typeof bestWin)=>item?`${item.result.goalsFor}–${item.result.goalsAgainst} tegen ${item.opponent}`:"Nog geen";
  const splitRows=[{label:"Thuis",summary:homeSummary},{label:"Uit",summary:awaySummary}];

  return <PageShell user={user}>
    <div className="page-head"><div><span className="eyebrow">Team- en spelersprestaties</span><h1>Statistieken</h1></div><TeamSelector teams={teams} current={team.id}/></div>
    <section className="metrics statistics-metrics"><div className="metric"><span>Winstpercentage</span><strong>{summary.played?Math.round(summary.won/summary.played*100):0}%</strong><small>{summary.won} van {summary.played}</small></div><div className="metric"><span>Punten per duel</span><strong>{decimal(summary.pointsPerGame)}</strong><small>{summary.points} totaal</small></div><div className="metric"><span>Goals voor / duel</span><strong>{decimal(summary.goalsForPerGame)}</strong><small>{summary.goalsFor} totaal</small></div><div className="metric"><span>Goals tegen / duel</span><strong>{decimal(summary.goalsAgainstPerGame)}</strong><small>{summary.goalsAgainst} totaal</small></div><div className="metric"><span>Clean sheets</span><strong>{summary.cleanSheets}</strong><small>{summary.failedToScore}× niet gescoord</small></div><div className="metric"><span>Langst ongeslagen</span><strong>{summary.longestUnbeaten}</strong><small>{summary.longestWinning} winst op rij</small></div></section>

    <div className="performance-grid">
      <section className="card performance-card"><div className="card-head"><div><span className="eyebrow">Resultaten</span><h2>Seizoensbalans</h2></div><strong className="performance-points">{summary.points}<small>punten</small></strong></div><ResultBar won={summary.won} drawn={summary.drawn} lost={summary.lost} played={summary.played}/></section>
      <section className="card split-card"><div className="card-head"><div><span className="eyebrow">Vergelijking</span><h2>Thuis en uit</h2></div></div><div className="table-scroll"><table className="statistics-table split-table"><thead><tr><th></th><th>W</th><th>G</th><th>V</th><th>DS</th><th>P/D</th></tr></thead><tbody>{splitRows.map(row=><tr key={row.label}><td><strong>{row.label}</strong><small>{row.summary.played} duels</small></td><td>{row.summary.won}</td><td>{row.summary.drawn}</td><td>{row.summary.lost}</td><td>{row.summary.goalsFor-row.summary.goalsAgainst>0?"+":""}{row.summary.goalsFor-row.summary.goalsAgainst}</td><td><strong>{decimal(row.summary.played?row.summary.points/row.summary.played:0)}</strong></td></tr>)}</tbody></table></div></section>
    </div>

    <div className="record-grid"><article className="record-card"><span>Grootste overwinning</span><strong>{record(bestWin)}</strong></article><article className="record-card"><span>Zwaarste nederlaag</span><strong>{record(heaviestLoss)}</strong></article><article className="record-card"><span>Scoringspercentage</span><strong>{summary.played?Math.round(summary.scoredMatches/summary.played*100):0}%</strong><small>Gescoord in {summary.scoredMatches} van {summary.played} duels</small></article></div>

    <StatsCharts matches={chartMatches} players={chartPlayers.map(player=>({name:player.name,goals:player.goals,assists:player.assists}))}/>

    <section className="card player-statistics-card"><div className="card-head"><div><span className="eyebrow">Volledige selectie</span><h2>Spelerstatistieken</h2></div><span className="badge">{playerRows.length} spelers</span></div><div className="table-scroll"><table className="statistics-table player-statistics-table"><thead><tr><th>#</th><th>Speler</th><th>W</th><th>Basis</th><th>G</th><th>A</th><th>G+A</th><th>Per duel</th><th>MVP</th><th>Kaarten</th></tr></thead><tbody>{playerRows.map((player,index)=><tr key={player.id}><td className="table-rank">{index+1}</td><td><Link className="player-stat-link" href={`/players/${player.id}?team=${team.id}`}>{player.name}</Link></td><td>{player.matches}</td><td>{player.starts}</td><td>{player.goals}</td><td>{player.assists}</td><td><strong className="contribution-total">{player.points}</strong></td><td>{player.perGame.toLocaleString("nl-NL",{minimumFractionDigits:2,maximumFractionDigits:2})}</td><td>{player.mvps||"–"}</td><td>{player.cards?<span className="card-summary"><i className="green"/> {player.green}<i className="yellow"/> {player.yellow}<i className="red"/> {player.red}</span>:"–"}</td></tr>)}</tbody></table></div>{!playerRows.length&&<div className="empty">Nog geen spelersgegevens geregistreerd.</div>}</section>

    <div className="section-head"><div><span className="eyebrow">Uitblinkers</span><h2>Ranglijsten</h2></div></div><div className="ranking-grid"><Ranking title="Topscorers" teamId={team.id} players={rankings} value={player=>player.goals} render={player=>player.goals}/><Ranking title="Meeste assists" teamId={team.id} players={rankings} value={player=>player.assists} render={player=>player.assists}/><Ranking title="Meeste MVP's" teamId={team.id} players={rankings} value={player=>player.mvps} render={player=>player.mvps}/><Ranking title="Meeste kaarten" teamId={team.id} players={rankings} value={player=>player.cards} render={player=><span className="card-summary"><i className="green"/> {player.green}<i className="yellow"/> {player.yellow}<i className="red"/> {player.red}</span>}/></div>
  </PageShell>;
}
