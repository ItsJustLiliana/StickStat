import Link from "next/link";
import {ClubLogo} from "@/components/logo";
import {EmptyTeam} from "@/components/empty-team";
import {MatchTeamLabel} from "@/components/match-team-label";
import {PageShell} from "@/components/page-shell";
import {TeamSelector} from "@/components/team-selector";
import {db} from "@/lib/db";
import {pageContext} from "@/lib/page-data";
import {StatisticsService} from "@/services/statistics";

export const dynamic="force-dynamic";

export default async function Dashboard({searchParams}:{searchParams:Promise<{team?:string}>}){
  const q=await searchParams,{user,teams,team}=await pageContext(q.team);
  if(!team)return <PageShell user={user}><EmptyTeam/></PageShell>;
  const [standing,matches]=await Promise.all([db.standing.findFirst({where:{teamId:team.id},orderBy:{lastSyncedAt:"desc"}}),db.match.findMany({where:{OR:[{homeTeamId:team.id},{awayTeamId:team.id}]},include:{homeTeam:true,awayTeam:true},orderBy:{date:"desc"}})]);
  const finished=matches.filter(match=>match.status==="finished"),summary=StatisticsService.summary(finished,team.id),form=StatisticsService.form(finished,team.id,5),now=new Date(),last=finished[0],next=[...matches].filter(match=>match.date>=now&&match.status==="scheduled").sort((a,b)=>a.date.getTime()-b.date.getTime())[0];
  return <PageShell user={user}>
    <div className="page-head"><div><span className="eyebrow">Teamoverzicht</span><h1>Dashboard</h1></div><TeamSelector teams={teams} current={team.id}/></div>
    <section className="hero"><div className="team-title"><ClubLogo name={team.club.name} path={team.club.logoLocalPath??team.club.logoUrl}/><div><span className="eyebrow" style={{color:"#c9f45b"}}>{team.club.name}</span><h1>{team.name}</h1><p>{standing?.competition??"Competitie wordt bij de eerste sync geladen"}</p></div></div><div className="rank-block"><div><div className="rank-label">Huidige positie</div><div className="rank-number mono">{standing?.position??"–"}</div></div><div><div className="rank-label">Punten</div><strong style={{fontSize:30}}>{standing?.points??summary.points}</strong></div></div></section>
    <section className="metrics"><div className="metric"><span>Gespeeld</span><strong>{standing?.played??summary.played}</strong></div><div className="metric"><span>W / G / V</span><strong style={{fontSize:20}}>{standing?`${standing.won} / ${standing.drawn} / ${standing.lost}`:`${summary.won} / ${summary.drawn} / ${summary.lost}`}</strong></div><div className="metric"><span>Goals voor</span><strong>{standing?.goalsFor??summary.goalsFor}</strong></div><div className="metric"><span>Goals tegen</span><strong>{standing?.goalsAgainst??summary.goalsAgainst}</strong></div><div className="metric"><span>Doelsaldo</span><strong>{standing?.goalDifference??summary.goalsFor-summary.goalsAgainst}</strong></div><div className="metric"><span>Vorm</span><div className="form-row">{form.length?form.map((result,index)=><span className={`form-dot ${result}`} key={index}>{result}</span>):<strong>–</strong>}</div></div></section>
    <div className="grid-2">
      <section className="card"><div className="card-head"><h2>Laatste wedstrijden</h2><Link className="link" href={`/matches?team=${team.id}`}>Alles bekijken →</Link></div>{finished.slice(0,5).map(match=><Link href={`/matches/${match.id}?team=${team.id}`} className="match-row" style={{color:"inherit",textDecoration:"none"}} key={match.id}><div className="match-date">{match.date.toLocaleDateString("nl-NL",{day:"2-digit",month:"short"})}</div><div className="teams"><MatchTeamLabel name={match.homeTeam.shortName} own={match.homeTeamId===team.id} side="home"/><MatchTeamLabel name={match.awayTeam.shortName} own={match.awayTeamId===team.id} side="away"/></div><div className="score mono">{match.homeScore}–{match.awayScore}</div></Link>)}{!finished.length&&<div className="empty">Nog geen uitslagen beschikbaar.</div>}</section>
      <section className="card"><div className="card-head"><h2>Op de kalender</h2></div>{next?<><span className="badge accent">VOLGENDE WEDSTRIJD</span><div className="next-match"><div className="muted">{next.date.toLocaleDateString("nl-NL",{weekday:"long",day:"numeric",month:"long"})} {next.startTime&&`· ${next.startTime}`}</div><div className="next-match-teams"><MatchTeamLabel name={next.homeTeam.shortName} own={next.homeTeamId===team.id} side="home"/><span className="match-versus">tegen</span><MatchTeamLabel name={next.awayTeam.shortName} own={next.awayTeamId===team.id} side="away"/></div><p className="muted">{next.venue??"Locatie nog niet bekend"}</p></div></>:<div className="empty">Geen komende wedstrijd bekend.</div>}{last&&<><div className="eyebrow">Laatste resultaat</div><div className="last-result"><MatchTeamLabel name={`${last.homeTeam.shortName} ${last.homeScore}`} own={last.homeTeamId===team.id} side="home"/><span>–</span><MatchTeamLabel name={`${last.awayScore} ${last.awayTeam.shortName}`} own={last.awayTeamId===team.id} side="away"/></div></>}</section>
    </div>
  </PageShell>;
}
