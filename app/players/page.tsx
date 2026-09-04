import {PageShell} from "@/components/page-shell";
import {TeamSelector} from "@/components/team-selector";
import {EmptyTeam} from "@/components/empty-team";
import {RosterListItem,type RosterPerson} from "@/components/roster-card";
import {pageContext} from "@/lib/page-data";
import {db} from "@/lib/db";
import type {TeamRole} from "@/generated/prisma/client";
import {PlayerCreateControl} from "@/components/player-management-controls";
import {TeamSettingsControl} from "@/components/team-settings-control";

export const dynamic="force-dynamic";
const sections:{role:TeamRole;title:string;description:string}[]=[
  {role:"player",title:"Spelers",description:"Vaste selectie en prestaties"},
  {role:"coach",title:"Coaches",description:"Begeleiding en wedstrijdorganisatie"},
  {role:"trainer",title:"Trainers",description:"Training en sportieve ontwikkeling"},
  {role:"team_admin",title:"Teambeheerders",description:"Beheer van team, leden en rollen"},
  {role:"viewer",title:"Kijkers",description:"Teamleden met alleen leestoegang"},
];
const nameCollator=new Intl.Collator("nl",{sensitivity:"base"});
function accountLastName(name:string){return name.trim().split(/\s+/).at(-1)??name}
function sortByLastName(people:RosterPerson[]){return people.sort((a,b)=>nameCollator.compare(a.sortName??a.name,b.sortName??b.name)||nameCollator.compare(a.name,b.name))}
function membershipHint(player:{trainingMember:boolean;matchMember:boolean}){return player.trainingMember&&!player.matchMember?"Training":player.matchMember&&!player.trainingMember?"Wedstrijd":undefined}

export default async function Players({searchParams}:{searchParams:Promise<{team?:string}>}){
  const query=await searchParams,{user,teams,team}=await pageContext(query.team);
  if(!team)return <PageShell user={user}><EmptyTeam/></PageShell>;
  const canAdmin=user.platformRole==="admin"||user.teamMemberships.some(membership=>membership.teamId===team.id&&membership.roles.includes("team_admin"));
  const matchFilter={status:"finished" as const,OR:[{homeTeamId:team.id},{awayTeamId:team.id}]};
  const [memberships,players,invites]=await Promise.all([
    db.teamMembership.findMany({where:{teamId:team.id},include:{user:{include:{player:{include:{matchStats:{where:{match:matchFilter}}}}}}},orderBy:{createdAt:"asc"}}),
    db.player.findMany({where:{teamId:team.id,active:true},include:{matchStats:{where:{match:matchFilter}}},orderBy:[{lastName:"asc"},{namePrefix:"asc"},{firstName:"asc"}]}),
    canAdmin?db.teamInvite.findMany({where:{teamId:team.id,usedAt:null,expiresAt:{gt:new Date()}},include:{createdBy:{select:{name:true}}},orderBy:{createdAt:"desc"}}):Promise.resolve([]),
  ]);
  const linkedPlayerIds=new Set(memberships.map(membership=>membership.user.player?.id).filter(Boolean));
  function memberPerson(membership:(typeof memberships)[number],role:TeamRole|"unassigned"):RosterPerson{
    const player=membership.user.player?.teamId===team.id?membership.user.player:null,goals=player?.matchStats.reduce((total,stat)=>total+stat.goals,0),assists=player?.matchStats.reduce((total,stat)=>total+stat.assists,0);
    return {key:`${role}-${membership.userId}`,name:player?.displayName??membership.user.name,sortName:player?.lastName??accountLastName(membership.user.name),photoPath:membership.user.photoPath??player?.photoPath??null,subtitle:player?.position??(role==="player"?"Nog niet aan een spelersprofiel gekoppeld":`@${membership.user.username}`),href:role==="player"&&player?`/players/${player.id}?team=${team.id}`:`/team-members/${membership.userId}?team=${team.id}`,shirtNumber:role==="player"?player?.shirtNumber:undefined,matches:role==="player"&&player?player.matchStats.length:undefined,goals,assists,membershipHint:role==="player"&&player?membershipHint(player):undefined};
  }
  function unlinkedPerson(player:(typeof players)[number]):RosterPerson{return {key:`player-${player.id}`,name:player.displayName,sortName:player.lastName,photoPath:player.photoPath,subtitle:player.position??"",href:`/players/${player.id}?team=${team.id}`,shirtNumber:player.shirtNumber,matches:player.matchStats.length,goals:player.matchStats.reduce((total,stat)=>total+stat.goals,0),assists:player.matchStats.reduce((total,stat)=>total+stat.assists,0),membershipHint:membershipHint(player)}}
  const unlinkedPlayers=players.filter(player=>!linkedPlayerIds.has(player.id));
  const regularUnlinked=unlinkedPlayers.filter(player=>!player.isSubstitute).map(unlinkedPerson);
  const substitutes=sortByLastName([
    ...memberships.filter(membership=>membership.roles.includes("player")&&membership.user.player?.teamId===team.id&&membership.user.player.isSubstitute).map(membership=>memberPerson(membership,"player")),
    ...unlinkedPlayers.filter(player=>player.isSubstitute).map(unlinkedPerson),
  ]);
  const unlinkedAccounts=sortByLastName(memberships.filter(membership=>!membership.user.player).map(membership=>memberPerson(membership,"unassigned")));
  return <PageShell user={user}>
    <div className="page-head"><div><span className="eyebrow">Selectie & staf</span><h1>Teamleden</h1></div><div className="member-actions"><TeamSelector teams={teams} current={team.id}/>{canAdmin&&<><PlayerCreateControl teamId={team.id}/><TeamSettingsControl teamId={team.id} club={{id:team.club.id,name:team.club.name,logoPath:team.club.logoLocalPath??team.club.logoUrl}} invites={invites.map(invite=>({id:invite.id,expiresAt:invite.expiresAt.toISOString(),createdBy:invite.createdBy.name}))}/></>}</div></div>
    <div className="role-sections">
      {sections.map(section=>{const people=memberships.filter(membership=>membership.roles.includes(section.role)&&(section.role!=="player"||(membership.user.player?.teamId===team.id&&!membership.user.player.isSubstitute))).map(membership=>memberPerson(membership,section.role));if(section.role==="player")people.push(...regularUnlinked);sortByLastName(people);if(!people.length)return null;return <section key={section.role}><div className="role-section-head"><div><span className="eyebrow">{section.description}</span><h2>{section.title}</h2></div><span className="badge">{people.length}</span></div><div className="roster-list">{people.map(person=><RosterListItem person={person} key={person.key}/>)}</div></section>})}
      {substitutes.length>0&&<section><div className="role-section-head"><div><span className="eyebrow">Spelers die af en toe aansluiten</span><h2>Invalspelers</h2></div><span className="badge">{substitutes.length}</span></div><div className="roster-list">{substitutes.map(person=><RosterListItem person={person} key={person.key}/>)}</div></section>}
      {canAdmin&&unlinkedAccounts.length>0&&<section><div className="role-section-head"><div><span className="eyebrow">Geregistreerde accounts zonder spelersprofiel</span><h2>Nog niet aan een speler gekoppeld</h2></div><span className="badge">{unlinkedAccounts.length}</span></div><div className="roster-list">{unlinkedAccounts.map(person=><RosterListItem person={person} key={person.key}/>)}</div></section>}
    </div>
  </PageShell>;
}
