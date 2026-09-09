import Link from "next/link";
import {ArrowRight, CalendarDays, MapPin} from "lucide-react";
import {ClubLogo} from "@/components/logo";
import {EmptyTeam} from "@/components/empty-team";
import {MatchTeamLabel} from "@/components/match-team-label";
import {PageShell} from "@/components/page-shell";
import {TeamSelector} from "@/components/team-selector";
import {db} from "@/lib/db";
import {pageContext} from "@/lib/page-data";
import {StatisticsService} from "@/services/statistics";

export const dynamic = "force-dynamic";

export default async function Dashboard({searchParams}:{searchParams:Promise<{team?:string}>}) {
  const q = await searchParams, {user, teams, team} = await pageContext(q.team);
  if (!team) return <PageShell user={user}><EmptyTeam/></PageShell>;

  const [standing, matches] = await Promise.all([
    db.standing.findFirst({where:{teamId:team.id}, orderBy:{lastSyncedAt:"desc"}}),
    db.match.findMany({where:{OR:[{homeTeamId:team.id}, {awayTeamId:team.id}]}, include:{homeTeam:true, awayTeam:true}, orderBy:{date:"desc"}}),
  ]);
  const finished = matches.filter(match => match.status === "finished"), summary = StatisticsService.summary(finished, team.id), now = new Date(), next = [...matches].filter(match => match.date >= now && match.status === "scheduled").sort((a, b) => a.date.getTime() - b.date.getTime())[0];
  const record = standing ? `${standing.won} / ${standing.drawn} / ${standing.lost}` : `${summary.won} / ${summary.drawn} / ${summary.lost}`;

  return <PageShell user={user}>
    <div className="page-head">
      <div><span className="eyebrow">Teamoverzicht</span><h1>Dashboard</h1></div>
      <TeamSelector teams={teams} current={team.id}/>
    </div>

    <section className="hero dashboard-hero">
      <div className="team-title"><ClubLogo name={team.club.name} path={team.club.logoLocalPath ?? team.club.logoUrl}/><div><span className="eyebrow dashboard-club-name">{team.club.name}</span><h1>{team.name}</h1><p>{standing?.competition ?? "Competitie wordt bij de eerste sync geladen"}</p></div></div>
      <div className="rank-block"><div className="dashboard-rank"><div className="rank-label">Huidige positie</div><div className="rank-number mono">{standing?.position ?? "–"}</div></div><div className="dashboard-points"><div className="rank-label">Punten</div><strong>{standing?.points ?? summary.points}</strong></div></div>
    </section>

    <section className="metrics dashboard-metrics" aria-label="Teamstatistieken">
      <div className="metric"><span>Gespeeld</span><strong>{standing?.played ?? summary.played}</strong></div>
      <div className="metric"><span>Winst / gelijk / verlies</span><strong className="dashboard-record">{record}</strong></div>
      <div className="metric"><span>Goals voor</span><strong>{standing?.goalsFor ?? summary.goalsFor}</strong></div>
      <div className="metric"><span>Goals tegen</span><strong>{standing?.goalsAgainst ?? summary.goalsAgainst}</strong></div>
      <div className="metric"><span>Doelsaldo</span><strong>{standing?.goalDifference ?? summary.goalsFor - summary.goalsAgainst}</strong></div>
    </section>

    <div className="grid-2 dashboard-panels">
      <section className="card dashboard-panel">
        <div className="card-head"><div><span className="eyebrow">Overzicht</span><h2>Laatste wedstrijden</h2></div><Link className="link dashboard-panel-link" href={`/matches?team=${team.id}`}>Alles bekijken <ArrowRight size={16}/></Link></div>
        {finished.slice(0, 5).map(match => <Link href={`/matches/${match.id}?team=${team.id}`} className="match-row" key={match.id}><div className="match-date">{match.date.toLocaleDateString("nl-NL", {day:"2-digit", month:"short"})}</div><div className="teams"><MatchTeamLabel name={match.homeTeam.shortName} own={match.homeTeamId === team.id} side="home"/><span className="match-versus">–</span><MatchTeamLabel name={match.awayTeam.shortName} own={match.awayTeamId === team.id} side="away"/></div><div className="score mono">{match.homeScore}–{match.awayScore}</div></Link>)}
        {!finished.length && <div className="empty">Nog geen uitslagen beschikbaar.</div>}
      </section>

      <section className="card dashboard-panel dashboard-panel-feature">
        <div className="card-head"><div><span className="eyebrow">Vooruitblik</span><h2>Op de kalender</h2></div><CalendarDays size={21} aria-hidden="true"/></div>
        {next ? <Link href={`/matches/${next.id}?team=${team.id}`} className="next-match"><span className="badge accent">Volgende wedstrijd</span><div className="next-match-date">{next.date.toLocaleDateString("nl-NL", {weekday:"long", day:"numeric", month:"long"})}{next.startTime && ` · ${next.startTime}`}</div><div className="next-match-teams"><MatchTeamLabel name={next.homeTeam.shortName} own={next.homeTeamId === team.id} side="home"/><span className="match-versus">tegen</span><MatchTeamLabel name={next.awayTeam.shortName} own={next.awayTeamId === team.id} side="away"/></div><p><MapPin size={15}/>{next.venue ?? "Locatie nog niet bekend"}</p></Link> : <div className="empty">Geen komende wedstrijd bekend.</div>}
      </section>
    </div>
  </PageShell>;
}
