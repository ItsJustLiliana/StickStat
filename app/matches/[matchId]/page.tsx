import {notFound} from "next/navigation";
import {PageShell} from "@/components/page-shell";
import {ClubLogo} from "@/components/logo";
import {MatchTeamStatsForm} from "@/components/match-team-stats-form";
import {pageContext} from "@/lib/page-data";
import {db} from "@/lib/db";
import {hasAnyTeamRole,teamManagementRoles} from "@/lib/team-roles";

export const dynamic="force-dynamic";

export default async function MatchDetail({params,searchParams}:{params:Promise<{matchId:string}>;searchParams:Promise<{team?:string}>}){
  const [{matchId},query]=await Promise.all([params,searchParams]),{user,teams,team}=await pageContext(query.team);
  const match=await db.match.findUnique({where:{id:matchId},include:{homeTeam:{include:{club:true}},awayTeam:{include:{club:true}},season:true,playerStats:{include:{player:true}},events:{include:{player:true},orderBy:{createdAt:"asc"}}}});
  if(!match)notFound();
  const accessibleTeamIds=new Set(teams.map(item=>item.id)),matchTeamIds=[match.homeTeamId,match.awayTeamId];if(!matchTeamIds.some(teamId=>accessibleTeamIds.has(teamId)))notFound();
  const ownTeam=team&&matchTeamIds.includes(team.id)?team:teams.find(item=>matchTeamIds.includes(item.id))??null;
  const ownScore=ownTeam?(match.homeTeamId===ownTeam.id?match.homeScore:match.awayScore):null;
  const membership=ownTeam?user.teamMemberships.find(item=>item.teamId===ownTeam.id):null;
  const canEdit=Boolean(match.status==="finished"&&ownTeam&&(user.platformRole==="admin"||(membership&&hasAnyTeamRole(membership.roles,teamManagementRoles))));
  const roster=ownTeam?await db.player.findMany({where:{teamId:ownTeam.id,OR:[{active:true,matchMember:true},{matchStats:{some:{matchId:match.id}}}]},orderBy:[{shirtNumber:"asc"},{displayName:"asc"}]}):[];
  const ownStats=ownTeam?match.playerStats.filter(stat=>stat.player.teamId===ownTeam.id):[];
  const cards=(playerId:string,type:"green_card"|"yellow_card"|"red_card")=>match.events.filter(event=>event.playerId===playerId&&event.type===type).length;
  const initialRows=roster.map(player=>{const stat=ownStats.find(item=>item.playerId===player.id);return {playerId:player.id,name:player.displayName,participation:stat?(stat.started?"starter" as const:"substitute" as const):"absent" as const,goals:stat?.goals??0,greenCards:cards(player.id,"green_card"),yellowCards:cards(player.id,"yellow_card"),redCards:cards(player.id,"red_card"),mvp:stat?.mvp??false,notes:stat?.notes??""}});
  return <PageShell user={user}><div className="page-head"><div><span className="eyebrow">Wedstrijddetail</span><h1>{match.status==="finished"?"Eindstand":"Wedstrijd"}</h1></div><span className="badge">{match.status}</span></div><section className="hero" style={{gridTemplateColumns:"1fr",textAlign:"center"}}><div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"clamp(18px,5vw,60px)",position:"relative",zIndex:2}}><div style={{display:"grid",justifyItems:"center",gap:10}}><ClubLogo name={match.homeTeam.club.name} path={match.homeTeam.club.logoLocalPath??match.homeTeam.club.logoUrl}/><strong>{match.homeTeam.shortName}</strong></div><div className="rank-number mono" style={{fontSize:"clamp(42px,8vw,82px)"}}>{match.homeScore??"–"} <span style={{color:"white"}}>–</span> {match.awayScore??"–"}</div><div style={{display:"grid",justifyItems:"center",gap:10}}><ClubLogo name={match.awayTeam.club.name} path={match.awayTeam.club.logoLocalPath??match.awayTeam.club.logoUrl}/><strong>{match.awayTeam.shortName}</strong></div></div></section><section className="metrics" style={{gridTemplateColumns:"repeat(4,1fr)"}}><div className="metric"><span>Datum</span><strong style={{fontSize:17}}>{match.date.toLocaleDateString("nl-NL",{day:"numeric",month:"long",year:"numeric"})}</strong></div><div className="metric"><span>Tijd</span><strong style={{fontSize:17}}>{match.startTime??"–"}</strong></div><div className="metric"><span>Locatie</span><strong style={{fontSize:17}}>{match.venue??"–"}</strong></div><div className="metric"><span>Competitie</span><strong style={{fontSize:17}}>{match.competition??"–"}</strong></div></section>{ownTeam&&<MatchTeamStatsForm matchId={match.id} teamId={ownTeam.id} teamScore={ownScore} initialRows={initialRows} canEdit={canEdit}/>}</PageShell>;
}
