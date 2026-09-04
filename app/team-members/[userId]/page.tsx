import Image from "next/image";
import {notFound} from "next/navigation";
import {PageShell} from "@/components/page-shell";
import {TeamMemberManagement} from "@/components/team-member-management";
import {pageContext} from "@/lib/page-data";
import {db} from "@/lib/db";
import type {TeamRole} from "@/generated/prisma/client";

export const dynamic="force-dynamic";
const roleLabels:Record<TeamRole,string>={player:"Speler",coach:"Coach",trainer:"Trainer",team_admin:"Teambeheerder",viewer:"Kijker"};

export default async function TeamMemberDetails({params,searchParams}:{params:Promise<{userId:string}>;searchParams:Promise<{team?:string}>}){
  const [{userId},query]=await Promise.all([params,searchParams]),{user,team}=await pageContext(query.team);
  if(!team)notFound();
  const canAdmin=user.platformRole==="admin"||user.teamMemberships.some(item=>item.teamId===team.id&&item.roles.includes("team_admin"));
  const finishedMatch={status:"finished" as const,OR:[{homeTeamId:team.id},{awayTeamId:team.id}]};
  const now=new Date();
  const [membership,players,adminCount,attendanceData]=await Promise.all([
    db.teamMembership.findUnique({where:{userId_teamId:{userId,teamId:team.id}},include:{user:{include:{player:{include:{matchStats:{where:{match:finishedMatch}},events:{where:{match:finishedMatch}}}}}}}}),
    canAdmin?db.player.findMany({where:{teamId:team.id,active:true},select:{id:true,displayName:true,userId:true},orderBy:[{lastName:"asc"},{namePrefix:"asc"},{firstName:"asc"}]}):Promise.resolve([]),
    canAdmin?db.teamMembership.count({where:{teamId:team.id,roles:{has:"team_admin"}}}):Promise.resolve(0),
    (async()=>{const player=await db.player.findFirst({where:{userId},select:{id:true,matchAttendance:true,trainingAttendance:true}});return player??{matchAttendance:[],trainingAttendance:[]};})(),
  ]);
  if(!membership)notFound();
  const hasPlayerRole=membership.roles.includes("player"),linkedPlayer=membership.user.player?.teamId===team.id?membership.user.player:null,player=hasPlayerRole?linkedPlayer:null,photo=membership.user.photoPath??linkedPlayer?.photoPath??null;
  const matches=player?.matchStats.length??0,goals=player?.matchStats.reduce((total,stat)=>total+stat.goals,0)??0,assists=player?.matchStats.reduce((total,stat)=>total+stat.assists,0)??0,mvps=player?.matchStats.filter(stat=>stat.mvp).length??0,cards=player?.events.filter(event=>event.type.endsWith("_card")).length??0,matchesAttended=attendanceData.matchAttendance.filter(item=>item.status==="present").length,trainingsAttended=attendanceData.trainingAttendance.filter(item=>item.status==="present").length;
  return <PageShell user={user}>
    <div className="page-head"><div><span className="eyebrow">{team.club.name} · {team.name}</span><h1>{player?.displayName??membership.user.name}</h1><div className="member-roles">{membership.roles.length?membership.roles.map(role=><span className="badge" key={role}>{roleLabels[role]}</span>):<span className="badge">Geen rol</span>}</div></div><div className="player-detail-actions">{photo?<Image unoptimized className="profile-photo" width={92} height={92} src={photo} alt={`Profielfoto van ${membership.user.name}`}/>:<div className="profile-photo placeholder">{membership.user.name.split(/\s+/).map(part=>part[0]).join("").slice(0,2).toUpperCase()}</div>}{canAdmin&&<TeamMemberManagement teamId={team.id} userId={membership.userId} roles={membership.roles} playerId={linkedPlayer?.id??null} players={players} protectedAdmin={membership.roles.includes("team_admin")&&adminCount===1}/>}</div></div>
    {player?<><section className="metrics member-metrics">{player.shirtNumber!==null&&<div className="metric"><span>Rugnummer</span><strong>{player.shirtNumber}</strong></div>}{player.position&&<div className="metric"><span>Positie</span><strong className="text-metric">{player.position}</strong></div>}<div className="metric"><span>Wedstrijden</span><strong>{matches}</strong></div><div className="metric"><span>Wedstrijden aanwezig</span><strong>{matchesAttended}</strong></div><div className="metric"><span>Trainingen aanwezig</span><strong>{trainingsAttended}</strong></div><div className="metric"><span>Goals</span><strong>{goals}</strong></div><div className="metric"><span>Assists</span><strong>{assists}</strong></div><div className="metric"><span>G + A</span><strong>{goals+assists}</strong></div></section><section className="card"><h2>Overige prestaties</h2><p className="muted">{mvps}× MVP · {cards} kaarten</p></section></>:hasPlayerRole?<section className="card"><h2>Spelersprofiel nog niet gekoppeld</h2><p className="muted">Dit account heeft de rol Speler, maar is nog niet verbonden met een spelersprofiel. Een teambeheerder kan dit hier met het potlood aanpassen.</p></section>:<section className="card"><h2>Teamfunctie</h2><p className="muted">Dit account heeft geen gekoppeld spelersprofiel. Rugnummer, positie en wedstrijdstatistieken zijn daarom niet van toepassing.</p></section>}
  </PageShell>;
}
