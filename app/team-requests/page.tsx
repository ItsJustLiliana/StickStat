import {TeamJoinInbox} from "@/components/team-join-inbox";
import {EmptyTeam} from "@/components/empty-team";
import {PageShell} from "@/components/page-shell";
import {TeamSelector} from "@/components/team-selector";
import {db} from "@/lib/db";
import {pageContext} from "@/lib/page-data";

export const dynamic = "force-dynamic";

export default async function TeamRequests({searchParams}:{searchParams:Promise<{team?:string}>}) {
  const query = await searchParams, {user, teams, team} = await pageContext(query.team);
  if (!team) return <PageShell user={user}><EmptyTeam/></PageShell>;
  const canManage = user.platformRole === "admin" || user.teamMemberships.some(membership => membership.teamId === team.id && membership.roles.includes("team_admin"));
  if (!canManage) return <PageShell user={user}><section className="card empty">Je hebt geen toegang tot deze inbox.</section></PageShell>;
  const [requests, players] = await Promise.all([db.teamJoinRequest.findMany({where:{teamId:team.id, status:"pending"}, include:{user:true}, orderBy:{createdAt:"asc"}}), db.player.findMany({where:{teamId:team.id, active:true}, orderBy:[{lastName:"asc"}, {namePrefix:"asc"}, {firstName:"asc"}]})]);
  return <PageShell user={user}><div className="page-head"><div><span className="eyebrow">{team.club.name} · {team.name}</span><h1>Teamaanmeldingen</h1></div><TeamSelector teams={teams} current={team.id}/></div><section className="card"><div className="card-head"><div><h2>Inbox</h2><p className="muted">Keer een aanmelding goed en koppel het account direct aan een speler.</p></div><span className="badge">{requests.length} open</span></div><TeamJoinInbox teamId={team.id} requests={requests.map(request => ({id:request.id, name:request.user.name, username:request.user.username, createdAt:request.createdAt.toISOString()}))} players={players.map(player => ({id:player.id, name:player.displayName, linked:Boolean(player.userId)}))}/></section></PageShell>;
}
