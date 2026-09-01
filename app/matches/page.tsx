import Link from "next/link";
import { EmptyTeam } from "@/components/empty-team";
import { MatchFilters } from "@/components/match-filters";
import { PageShell } from "@/components/page-shell";
import { TeamSelector } from "@/components/team-selector";
import { db } from "@/lib/db";
import { pageContext } from "@/lib/page-data";

export const dynamic = "force-dynamic";

export default async function Matches({ searchParams }: { searchParams: Promise<{ team?: string; season?: string; side?: string; q?: string }> }) {
  const query = await searchParams, { user, teams, team } = await pageContext(query.team);
  if (!team) return <PageShell user={user}><EmptyTeam /></PageShell>;

  let matches = await db.match.findMany({
    where: { OR: [{ homeTeamId: team.id }, { awayTeamId: team.id }] },
    include: { homeTeam: true, awayTeam: true, season: true },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
  const seasons = [...new Map(matches.map(match => [match.season.id, match.season])).values()];
  if (query.season) matches = matches.filter(match => match.seasonId === query.season);
  if (query.side === "home") matches = matches.filter(match => match.homeTeamId === team.id);
  if (query.side === "away") matches = matches.filter(match => match.awayTeamId === team.id);
  if (query.q) matches = matches.filter(match => (match.homeTeamId === team.id ? match.awayTeam.name : match.homeTeam.name).toLowerCase().includes(query.q!.toLowerCase()));

  return <PageShell user={user}>
    <div className="page-head"><div><span className="eyebrow">Programma & resultaten</span><h1>Wedstrijden</h1></div><TeamSelector teams={teams} current={team.id} /></div>
    <MatchFilters teamId={team.id} seasons={seasons} />
    <section className="card" style={{ overflowX: "auto" }}>
      <table><thead><tr><th>Datum</th><th>Wedstrijd</th><th>Uitslag</th></tr></thead><tbody>
        {matches.map(match => <tr key={match.id}><td>{match.date.toLocaleDateString("nl-NL")}{match.startTime && <small className="muted"><br />{match.startTime}</small>}</td><td><Link className="match-teams" href={`/matches/${match.id}?team=${team.id}`}><span className={match.homeTeamId === team.id ? "own-team" : "opponent-team"}>{match.homeTeam.shortName}{match.homeTeamId === team.id && <small>Jouw team</small>}</span><span className="match-versus">–</span><span className={match.awayTeamId === team.id ? "own-team" : "opponent-team"}>{match.awayTeam.shortName}{match.awayTeamId === team.id && <small>Jouw team</small>}</span></Link></td><td className="score">{match.homeScore == null ? "–" : `${match.homeScore}–${match.awayScore}`}</td></tr>)}
      </tbody></table>
      {!matches.length && <div className="empty">Geen wedstrijden gevonden.</div>}
    </section>
  </PageShell>;
}
