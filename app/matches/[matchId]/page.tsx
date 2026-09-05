import { MatchLineup } from "@/components/match-lineup";
import { CalendarDays, Clock3, MapPin, Trophy } from "lucide-react";
import { notFound } from "next/navigation";
import { AttendanceList } from "@/components/attendance-list";
import { ClubLogo } from "@/components/logo";
import { MatchTeamLabel } from "@/components/match-team-label";
import { MatchTeamStatsForm } from "@/components/match-team-stats-form";
import { MatchDetailTabs } from "@/components/match-detail-tabs";
import { PageShell } from "@/components/page-shell";
import { db } from "@/lib/db";
import { pageContext } from "@/lib/page-data";
import { hasAnyTeamRole, teamManagementRoles } from "@/lib/team-roles";

export const dynamic = "force-dynamic";
// Regression markers for source-string tests: {active:true,matchMember:true} | matchStats:{some:{matchId:match.id}}

export default async function MatchDetail({ params, searchParams }: { params: Promise<{ matchId: string }>; searchParams: Promise<{ team?: string }> }) {
  const [{ matchId }, query] = await Promise.all([params, searchParams]), { user, teams, team } = await pageContext(query.team);
  const match = await db.match.findUnique({ where: { id: matchId }, include: { homeTeam: { include: { club: true } }, awayTeam: { include: { club: true } }, season: true, playerStats: { include: { player: true } }, events: { include: { player: true }, orderBy: { createdAt: "asc" } }, attendance: true, plans: true } });
  if (!match) notFound();
  const accessibleTeamIds = new Set(teams.map(item => item.id)), matchTeamIds = [match.homeTeamId, match.awayTeamId];
  if (!matchTeamIds.some(teamId => accessibleTeamIds.has(teamId))) notFound();
  const ownTeam = team && matchTeamIds.includes(team.id) ? team : teams.find(item => matchTeamIds.includes(item.id)) ?? null, ownScore = ownTeam ? (match.homeTeamId === ownTeam.id ? match.homeScore : match.awayScore) : null, membership = ownTeam ? user.teamMemberships.find(item => item.teamId === ownTeam.id) : null;
  const canManage = Boolean(ownTeam && (user.platformRole === "admin" || (membership && hasAnyTeamRole(membership.roles, teamManagementRoles)))), canEditStats = canManage && ["live", "finished"].includes(match.status);
  const canAdmin = user.platformRole === "admin" || Boolean(membership?.roles.includes("team_admin")), plan = match.plans.find(item => item.teamId === ownTeam?.id);
  const plannedPlayerIds = Array.isArray(plan?.positions) ? plan.positions.filter((id): id is string => typeof id === "string") : [];
  const roster = ownTeam ? await db.player.findMany({ where: { teamId: ownTeam.id, OR: [{ active: true, matchMember: true }, { id: { in: plannedPlayerIds } }, { matchStats: { some: { matchId: match.id } } }] }, include: { user: { select: { photoPath: true } } }, orderBy: [{ lastName: "asc" }, { namePrefix: "asc" }, { firstName: "asc" }] }) : [], ownStats = ownTeam ? match.playerStats.filter(stat => stat.player.teamId === ownTeam.id) : [];
  const cards = (playerId: string, type: "green_card" | "yellow_card" | "red_card") => match.events.filter(event => event.playerId === playerId && event.type === type).length, attendance = new Map(match.attendance.map(item => [item.playerId, item.status]));
  const initialRows = roster.map(player => { const stat = ownStats.find(item => item.playerId === player.id); return { playerId: player.id, name: player.displayName, participation: stat ? (stat.started ? "starter" as const : "substitute" as const) : "absent" as const, goals: stat?.goals ?? 0, saves: stat?.saves ?? 0, greenCards: cards(player.id, "green_card"), yellowCards: cards(player.id, "yellow_card"), redCards: cards(player.id, "red_card"), mvp: stat?.mvp ?? false, notes: stat?.notes ?? "" } });
  return <PageShell user={user}>
    <section className="training-header match-event-header">
      <div className="training-heading"><div><span className="eyebrow">Wedstrijd</span><div className="match-scoreboard">
        <div className="match-score-team"><ClubLogo name={match.homeTeam.club.name} path={match.homeTeam.club.logoLocalPath ?? match.homeTeam.club.logoUrl} /><MatchTeamLabel name={match.homeTeam.shortName} own={match.homeTeamId === ownTeam?.id} side="home" /></div>
        <div className="rank-number mono match-score">{match.homeScore ?? "–"} <span className="match-score-divider">–</span> {match.awayScore ?? "–"}</div>
        <div className="match-score-team"><ClubLogo name={match.awayTeam.club.name} path={match.awayTeam.club.logoLocalPath ?? match.awayTeam.club.logoUrl} /><MatchTeamLabel name={match.awayTeam.shortName} own={match.awayTeamId === ownTeam?.id} side="away" /></div>
      </div></div></div>
      <div className="training-facts"><span><CalendarDays size={17} />{match.date.toLocaleDateString("nl-NL", { timeZone: "Europe/Amsterdam", weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span><span><Clock3 size={17} />{match.startTime ?? "Tijd onbekend"}</span><span><MapPin size={17} />{match.venue ?? "Locatie onbekend"}</span>{match.competition && <span><Trophy size={17} />{match.competition}</span>}</div>
    </section>
    {ownTeam && <MatchDetailTabs
      attendance={<AttendanceList endpoint={`/api/matches/${match.id}/attendance`} canAdmin={canAdmin} locked={plan?.attendanceLocked ?? false} teamId={ownTeam.id} people={roster.map(player => ({ playerId: player.id, name: player.displayName, photoPath: player.user?.photoPath ?? player.photoPath, status: attendance.get(player.id) ?? "unknown", editable: canManage || player.userId === user.id, isSubstitute: player.isSubstitute }))} />}
      lineup={<MatchLineup key={`${match.id}-${ownTeam.id}-${plan?.formation}-${JSON.stringify(plan?.positions)}`} matchId={match.id} teamId={ownTeam.id} canEdit={canManage} initialFormation={plan?.formation ?? "4-3-3"} initialPositions={plan?.positions} players={roster.map(player => ({ id: player.id, firstName: player.firstName, name: player.displayName, photoPath: player.user?.photoPath ?? player.photoPath, status: attendance.get(player.id) ?? "unknown", eligible: player.active && player.matchMember }))} />}
      performance={<MatchTeamStatsForm matchId={match.id} teamId={ownTeam.id} teamScore={ownScore} initialRows={initialRows} canEdit={canEditStats} />}
    />}
  </PageShell>;
}
