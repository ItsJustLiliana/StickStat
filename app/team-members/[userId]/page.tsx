import Image from "next/image";
import {notFound} from "next/navigation";
import {PageShell} from "@/components/page-shell";
import {pageContext} from "@/lib/page-data";
import {db} from "@/lib/db";
import type {TeamRole} from "@/generated/prisma/client";

export const dynamic="force-dynamic";
const roleLabels:Record<TeamRole,string>={player:"Speler",coach:"Coach",trainer:"Trainer",team_admin:"Teambeheerder",viewer:"Kijker"};

export default async function TeamMemberDetails({params,searchParams}:{params:Promise<{userId:string}>;searchParams:Promise<{team?:string}>}){
  const [{userId},query]=await Promise.all([params,searchParams]),{user,team}=await pageContext(query.team);
  if(!team)notFound();
  const membership=await db.teamMembership.findUnique({where:{userId_teamId:{userId,teamId:team.id}},include:{user:{include:{player:{include:{matchStats:true,events:true}}}}}});
  if(!membership)notFound();
  const hasPlayerRole=membership.roles.includes("player"),player=hasPlayerRole&&membership.user.player?.teamId===team.id?membership.user.player:null,photo=membership.user.photoPath??player?.photoPath??null;
  const matches=player?.matchStats.length??0,goals=player?.matchStats.reduce((total,stat)=>total+stat.goals,0)??0,assists=player?.matchStats.reduce((total,stat)=>total+stat.assists,0)??0,mvps=player?.matchStats.filter(stat=>stat.mvp).length??0,cards=player?.events.filter(event=>event.type.endsWith("_card")).length??0;
  return <PageShell user={user}>
    <div className="page-head"><div><span className="eyebrow">{team.club.name} · {team.name}</span><h1>{player?.displayName??membership.user.name}</h1><div className="member-roles">{membership.roles.map(role=><span className="badge" key={role}>{roleLabels[role]}</span>)}</div></div>{photo?<Image unoptimized className="profile-photo" width={92} height={92} src={photo} alt={`Profielfoto van ${membership.user.name}`}/>:<div className="profile-photo placeholder">{membership.user.name.split(/\s+/).map(part=>part[0]).join("").slice(0,2).toUpperCase()}</div>}</div>
    {player?<><section className="metrics member-metrics"><div className="metric"><span>Rugnummer</span><strong>{player.shirtNumber??"–"}</strong></div><div className="metric"><span>Positie</span><strong className="text-metric">{player.position??"Onbekend"}</strong></div><div className="metric"><span>Wedstrijden</span><strong>{matches}</strong></div><div className="metric"><span>Goals</span><strong>{goals}</strong></div><div className="metric"><span>Assists</span><strong>{assists}</strong></div><div className="metric"><span>G + A</span><strong>{goals+assists}</strong></div></section><section className="card"><h2>Overige prestaties</h2><p className="muted">{mvps}× MVP · {cards} kaarten</p></section></>:hasPlayerRole?<section className="card"><h2>Spelersprofiel nog niet gekoppeld</h2><p className="muted">Dit account heeft wel de rol Speler, maar is nog niet verbonden met een spelersprofiel. Een teambeheerder of coach kan dit in Teambeheer doen.</p></section>:<section className="card"><h2>Teamfunctie</h2><p className="muted">Dit account heeft geen spelersrol. Rugnummer, positie en wedstrijdstatistieken zijn daarom niet van toepassing.</p></section>}
  </PageShell>;
}
