import {notFound} from "next/navigation";
import {AttendanceList} from "@/components/attendance-list";
import {ClubLogo} from "@/components/logo";
import {MatchTeamLabel} from "@/components/match-team-label";
import {MatchTeamStatsForm} from "@/components/match-team-stats-form";
import {PageShell} from "@/components/page-shell";
import {db} from "@/lib/db";
import {pageContext} from "@/lib/page-data";
import {hasAnyTeamRole,teamManagementRoles} from "@/lib/team-roles";

export const dynamic="force-dynamic";

export default async function MatchDetail({params,searchParams}:{params:Promise<{matchId:string}>;searchParams:Promise<{team?:string}>}){
  const [{matchId},query]=await Promise.all([params,searchParams]),{user,teams,team}=await pageContext(query.team);
  const match=await db.match.findUnique({where:{id:matchId},include:{homeTeam:{include:{club:true}},awayTeam:{include:{club:true}},season:true,playerStats:{include:{player:true}},events:{include:{player:true},orderBy:{createdAt:"asc"}},attendance:true}});
  if(!match)notFound();
  const accessibleTeamIds=new Set(teams.map(item=>item.id)),matchTeamIds=[match.homeTeamId,match.awayTeamId];
  if(!matchTeamIds.some(teamId=>accessibleTeamIds.has(teamId)))notFound();
  const ownTeam=team&&matchTeamIds.includes(team.id)?team:teams.find(item=>matchTeamIds.includes(item.id))??null,ownScore=ownTeam?(match.homeTeamId===ownTeam.id?match.homeScore:match.awayScore):null,membership=ownTeam?user.teamMemberships.find(item=>item.teamId===ownTeam.id):null;
  const canManage=Boolean(ownTeam&&(user.platformRole==="admin"||(membership&&hasAnyTeamRole(membership.roles,teamManagementRoles)))),canEditStats=canManage&&match.status==="finished";
  const roster=ownTeam?await db.player.findMany({where:{teamId:ownTeam.id,OR:[{active:true,matchMember:true},{matchStats:{some:{matchId:match.id}}}]},orderBy:[{lastName:"asc"},{namePrefix:"asc"},{firstName:"asc"}]}):[],ownStats=ownTeam?match.playerStats.filter(stat=>stat.player.teamId===ownTeam.id):[];
  const cards=(playerId:string,type:"green_card"|"yellow_card"|"red_card")=>match.events.filter(event=>event.playerId===playerId&&event.type===type).length,attendance=new Map(match.attendance.map(item=>[item.playerId,item.status]));
  const initialRows=roster.map(player=>{const stat=ownStats.find(item=>item.playerId===player.id);return {playerId:player.id,name:player.displayName,participation:stat?(stat.started?"starter" as const:"substitute" as const):"absent" as const,goals:stat?.goals??0,saves:stat?.saves??0,greenCards:cards(player.id,"green_card"),yellowCards:cards(player.id,"yellow_card"),redCards:cards(player.id,"red_card"),mvp:stat?.mvp??false,notes:stat?.notes??""}});
  return <PageShell user={user}>
    <div className="page-head"><div><span className="eyebrow">Wedstrijddetail</span><h1>{match.status==="finished"?"Eindstand":"Wedstrijd"}</h1></div><span className="badge">{match.status}</span></div>
    <section className="hero match-hero"><div className="match-scoreboard">
      <div className="match-score-team"><ClubLogo name={match.homeTeam.club.name} path={match.homeTeam.club.logoLocalPath??match.homeTeam.club.logoUrl}/><MatchTeamLabel name={match.homeTeam.shortName} own={match.homeTeamId===ownTeam?.id} side="home"/></div>
      <div className="rank-number mono match-score">{match.homeScore??"–"} <span className="match-score-divider">–</span> {match.awayScore??"–"}</div>
      <div className="match-score-team"><ClubLogo name={match.awayTeam.club.name} path={match.awayTeam.club.logoLocalPath??match.awayTeam.club.logoUrl}/><MatchTeamLabel name={match.awayTeam.shortName} own={match.awayTeamId===ownTeam?.id} side="away"/></div>
    </div></section>
    <section className="metrics match-metrics"><div className="metric"><span>Datum</span><strong style={{fontSize:17}}>{match.date.toLocaleDateString("nl-NL",{day:"numeric",month:"long",year:"numeric"})}</strong></div><div className="metric"><span>Tijd</span><strong style={{fontSize:17}}>{match.startTime??"–"}</strong></div><div className="metric"><span>Locatie</span><strong style={{fontSize:17}}>{match.venue??"–"}</strong></div><div className="metric"><span>Competitie</span><strong style={{fontSize:17}}>{match.competition??"–"}</strong></div></section>
    {ownTeam&&<AttendanceList endpoint={`/api/matches/${match.id}/attendance`} canManage={canManage} people={roster.map(player=>({playerId:player.id,name:player.displayName,status:attendance.get(player.id)??"unknown",editable:canManage||player.userId===user.id}))}/>}
    {ownTeam&&<MatchTeamStatsForm matchId={match.id} teamId={ownTeam.id} teamScore={ownScore} initialRows={initialRows} canEdit={canEditStats}/>}
  </PageShell>;
}
