import Link from "next/link";
import {EmptyTeam} from "@/components/empty-team";
import {MatchTeamLabel} from "@/components/match-team-label";
import {PageShell} from "@/components/page-shell";
import {TeamSelector} from "@/components/team-selector";
import {TrainingCreateForm} from "@/components/training-create-form";
import {db} from "@/lib/db";
import {pageContext} from "@/lib/page-data";
import {hasAnyTeamRole,teamManagementRoles} from "@/lib/team-roles";

export const dynamic="force-dynamic";

export default async function Agenda({searchParams}:{searchParams:Promise<{team?:string}>}){
  const query=await searchParams,{user,teams,team}=await pageContext(query.team);
  if(!team)return <PageShell user={user}><EmptyTeam/></PageShell>;
  const membership=user.teamMemberships.find(item=>item.teamId===team.id),canManage=user.platformRole==="admin"||Boolean(membership&&hasAnyTeamRole(membership.roles,teamManagementRoles));
  const [matches,trainings]=await Promise.all([db.match.findMany({where:{OR:[{homeTeamId:team.id},{awayTeamId:team.id}]},include:{homeTeam:true,awayTeam:true,attendance:{where:{player:{teamId:team.id}}}},orderBy:{date:"asc"}}),db.training.findMany({where:{teamId:team.id},include:{attendance:true},orderBy:[{date:"asc"},{startTime:"asc"}]})]);
  const items=[...matches.map(match=>({id:match.id,type:"match" as const,date:match.date,time:match.startTime,title:"",venue:match.venue,href:`/matches/${match.id}?team=${team.id}`,attendance:match.attendance,homeTeam:match.homeTeam,awayTeam:match.awayTeam})),...trainings.map(training=>({id:training.id,type:"training" as const,date:training.date,time:training.startTime,title:training.title,venue:training.venue,href:`/trainings/${training.id}?team=${team.id}`,attendance:training.attendance,homeTeam:null,awayTeam:null}))].sort((a,b)=>a.date.getTime()-b.date.getTime());
  return <PageShell user={user}>
    <div className="page-head"><div><span className="eyebrow">Wedstrijden & trainingen</span><h1>Agenda</h1></div><TeamSelector teams={teams} current={team.id}/></div>
    {canManage&&<TrainingCreateForm teamId={team.id}/>}
    <section className="card agenda-card"><div className="card-head"><h2>Teamagenda</h2><span className="badge">{items.length} afspraken</span></div><div className="agenda-list">{items.map(item=>{const present=item.attendance.filter(row=>row.status==="present").length,absent=item.attendance.filter(row=>row.status==="absent").length;return <Link className="agenda-row" href={item.href} key={`${item.type}-${item.id}`}><time><strong>{item.date.toLocaleDateString("nl-NL",{day:"2-digit",month:"short"})}</strong><span>{item.time??"–"}</span></time><span><small className={`agenda-type ${item.type}`}>{item.type==="match"?"Wedstrijd":"Training"}</small>{item.type==="match"&&item.homeTeam&&item.awayTeam?<span className="agenda-match-teams"><MatchTeamLabel name={item.homeTeam.shortName} own={item.homeTeam.id===team.id} side="home"/><span className="match-versus">–</span><MatchTeamLabel name={item.awayTeam.shortName} own={item.awayTeam.id===team.id} side="away"/></span>:<strong>{item.title}</strong>}<small>{item.venue??"Locatie onbekend"}</small></span><span className="attendance-summary"><i className="present">{present}</i><i className="absent">{absent}</i></span></Link>})}</div>{!items.length&&<div className="empty">Nog niets in de agenda.</div>}</section>
  </PageShell>;
}
