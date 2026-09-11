import { ProfilePhoto } from "@/components/profile-photo";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { pageContext } from "@/lib/page-data";
import { db } from "@/lib/db";
import { StatsCharts } from "@/components/stats-charts";
import { PlayerDetailManagement } from "@/components/player-management-controls";

export const dynamic = "force-dynamic";

export default async function PlayerDetail({ params, searchParams }: { params: Promise<{ playerId: string }>; searchParams: Promise<{ team?: string }> }) {
  const [{ playerId }, query] = await Promise.all([params, searchParams]), { user, teams } = await pageContext(query.team);
  const now = new Date();
  const player = await db.player.findUnique({ where: { id: playerId }, include: { user: true, team: { include: { club: true } }, matchStats: { where: { match: { status: "finished" } }, include: { match: true } }, events: { where: { match: { status: "finished" } } }, matchAttendance: true, trainingAttendance: { include: { training: true } } } });
  if (!player || !teams.some(team => team.id === player.teamId)) notFound();
  const canAdmin = user.platformRole === "admin" || user.teamMemberships.some(membership => membership.teamId === player.teamId && membership.roles.includes("team_admin"));
  const played = player.matchStats.length, starts = player.matchStats.filter(stat => stat.started).length, goals = player.matchStats.reduce((total, stat) => total + stat.goals, 0), assists = player.matchStats.reduce((total, stat) => total + stat.assists, 0), saves = player.matchStats.reduce((total, stat) => total + stat.saves, 0), cards = player.events.filter(event => event.type.endsWith("_card")).length, mvps = player.matchStats.filter(stat => stat.mvp).length, photo = player.user?.photoPath ?? player.photoPath, matchesAttended = player.matchAttendance.filter(item => item.status === "present").length, matchesAbsent = player.matchAttendance.filter(item => item.status === "absent").length, trainingsAttended = player.trainingAttendance.filter(item => item.status === "present" && item.training.date < now).length, trainingsAbsent = player.trainingAttendance.filter(item => item.status === "absent" && item.training.date < now).length;
  const attendancePercentage = (present:number, absent:number) => present + absent ? Math.round(present / (present + absent) * 100) : 0;
  const chart = player.matchStats.sort((a, b) => a.match.date.getTime() - b.match.date.getTime()).map(stat => ({ date: stat.match.date.toLocaleDateString("nl-NL", { day: "2-digit", month: "short" }), goalsFor: stat.goals, goalsAgainst: stat.assists, points: 0 }));
  const playerDetails = [player.shirtNumber !== null ? `#${player.shirtNumber}` : null, player.position, player.isSubstitute ? "Invalspeler" : null].filter(Boolean);
  const managementPlayer = { firstName: player.firstName, namePrefix: player.namePrefix, lastName: player.lastName, displayName: player.displayName, shirtNumber: player.shirtNumber, position: player.position, trainingMember: player.trainingMember, matchMember: player.matchMember, isSubstitute: player.isSubstitute };
  return <PageShell user={user}>
    <div className="page-head"><div><span className="eyebrow">{player.team.club.name} · {player.team.name}</span><h1>{player.displayName}</h1>{playerDetails.length > 0 && <p className="muted">{playerDetails.join(" · ")}</p>}</div><div className="player-detail-actions">{photo ? <ProfilePhoto src={photo} name={player.displayName} size={80} /> : <div className="player-photo" style={{ width: 80, height: 80, fontSize: 25 }}>{player.firstName[0]}{player.lastName[0]}</div>}{canAdmin && <PlayerDetailManagement teamId={player.teamId} playerId={player.id} linkedAccount={Boolean(player.userId)} player={managementPlayer} />}</div></div>
    <section className="metrics player-detail-metrics" aria-label={`Statistieken van ${player.displayName}`}><div className="metric"><span>Wedstrijden</span><strong>{played}</strong><small>{starts}x in de basis</small></div><div className="metric"><span>Goals</span><strong>{goals}</strong><small>{played ? (goals / played).toFixed(1) : "0.0"} per wedstrijd</small></div><div className="metric"><span>Assists</span><strong>{assists}</strong><small>{played ? (assists / played).toFixed(1) : "0.0"} per wedstrijd</small></div><div className="metric"><span>G + A</span><strong>{goals + assists}</strong><small>Aanvallende bijdrage</small></div><div className="metric"><span>Reddingen</span><strong>{saves}</strong><small>In gespeelde wedstrijden</small></div><div className="metric"><span>Wedstrijd aanwezig</span><strong>{attendancePercentage(matchesAttended,matchesAbsent)}%</strong><small>{matchesAttended} aanwezig</small></div><div className="metric"><span>Training aanwezig</span><strong>{attendancePercentage(trainingsAttended,trainingsAbsent)}%</strong><small>{trainingsAttended} aanwezig</small></div><div className="metric"><span>MVP&apos;s</span><strong>{mvps}</strong><small>{cards} kaarten</small></div></section>
    <StatsCharts matches={chart} players={[{ name: player.displayName, goals, assists }]} />
    <section className="card" style={{ marginTop: 18 }}><h2>Gemiddelden</h2><p className="muted">{played ? (goals / played).toFixed(2) : "0.00"} goals per wedstrijd · {played ? (assists / played).toFixed(2) : "0.00"} assists per wedstrijd</p></section>
  </PageShell>;
}
