import {PageShell} from "@/components/page-shell";
import {TeamSelector} from "@/components/team-selector";
import {EmptyTeam} from "@/components/empty-team";
import {RosterListItem,type RosterPerson} from "@/components/roster-card";
import {pageContext} from "@/lib/page-data";
import {db} from "@/lib/db";
import type {TeamRole} from "@/generated/prisma/client";

export const dynamic="force-dynamic";
const sections:{role:TeamRole;title:string;description:string}[]=[
  {role:"player",title:"Spelers",description:"Actieve spelers en prestaties"},
  {role:"coach",title:"Coaches",description:"Begeleiding en wedstrijdorganisatie"},
  {role:"trainer",title:"Trainers",description:"Training en sportieve ontwikkeling"},
  {role:"team_admin",title:"Teambeheerders",description:"Beheer van team, leden en rollen"},
  {role:"viewer",title:"Kijkers",description:"Teamleden met alleen leestoegang"},
];

export default async function Players({searchParams}:{searchParams:Promise<{team?:string}>}){
  const query=await searchParams,{user,teams,team}=await pageContext(query.team);
  if(!team)return <PageShell user={user}><EmptyTeam/></PageShell>;
  const [memberships,players]=await Promise.all([
    db.teamMembership.findMany({where:{teamId:team.id},include:{user:{include:{player:{include:{matchStats:true}}}}},orderBy:{createdAt:"asc"}}),
    db.player.findMany({where:{teamId:team.id,active:true},include:{matchStats:true},orderBy:{shirtNumber:"asc"}}),
  ]);
  const linkedPlayerIds=new Set(memberships.map(membership=>membership.user.player?.id).filter(Boolean));
  function memberPerson(membership:(typeof memberships)[number],role:TeamRole|"unassigned"):RosterPerson{
    const player=membership.user.player?.teamId===team.id?membership.user.player:null,goals=player?.matchStats.reduce((total,stat)=>total+stat.goals,0),assists=player?.matchStats.reduce((total,stat)=>total+stat.assists,0);
    return {key:`${role}-${membership.userId}`,name:player?.displayName??membership.user.name,photoPath:membership.user.photoPath??player?.photoPath??null,subtitle:player?.position??(role==="player"?"Nog niet aan een spelersprofiel gekoppeld":membership.user.email),href:`/team-members/${membership.userId}?team=${team.id}`,shirtNumber:role==="player"?player?.shirtNumber:undefined,matches:role==="player"&&player?player.matchStats.length:undefined,goals,assists};
  }
  const unlinkedPlayers=players.filter(player=>!linkedPlayerIds.has(player.id)).map(player=>({key:`player-${player.id}`,name:player.displayName,photoPath:player.photoPath,subtitle:player.position??"Positie onbekend",href:`/players/${player.id}?team=${team.id}`,shirtNumber:player.shirtNumber,matches:player.matchStats.length,goals:player.matchStats.reduce((total,stat)=>total+stat.goals,0),assists:player.matchStats.reduce((total,stat)=>total+stat.assists,0)} satisfies RosterPerson));
  const unassignedPeople=memberships.filter(membership=>!membership.roles.length).map(membership=>memberPerson(membership,"unassigned"));
  return <PageShell user={user}><div className="page-head"><div><span className="eyebrow">Selectie & staf</span><h1>Teamleden</h1></div><TeamSelector teams={teams} current={team.id}/></div><div className="role-sections">{sections.map(section=>{const people=memberships.filter(membership=>membership.roles.includes(section.role)).map(membership=>memberPerson(membership,section.role));if(section.role==="player")people.push(...unlinkedPlayers);if(!people.length)return null;return <section key={section.role}><div className="role-section-head"><div><span className="eyebrow">{section.description}</span><h2>{section.title}</h2></div><span className="badge">{people.length}</span></div><div className="roster-list">{people.map(person=><RosterListItem person={person} key={person.key}/>)}</div></section>})}{unassignedPeople.length>0&&<section><div className="role-section-head"><div><span className="eyebrow">Accounts zonder toegewezen rol</span><h2>Nog niet ingedeeld</h2></div><span className="badge">{unassignedPeople.length}</span></div><div className="roster-list">{unassignedPeople.map(person=><RosterListItem person={person} key={person.key}/>)}</div></section>}</div></PageShell>;
}
