import {redirect} from "next/navigation";
import {PageShell} from "@/components/page-shell";
import {TeamManagementPanel} from "@/components/team-management-panel";
import {TeamSelector} from "@/components/team-selector";
import {currentUser} from "@/lib/auth";
import {db} from "@/lib/db";

export const dynamic="force-dynamic";

export default async function TeamManage({searchParams}:{searchParams:Promise<{team?:string}>}){
  const [query,user]=await Promise.all([searchParams,currentUser()]);
  if(!user)redirect("/login");
  const teams=await db.team.findMany({where:user.platformRole==="admin"?{}:{memberships:{some:{userId:user.id,roles:{hasSome:["team_admin","coach"]}}}},include:{club:true},orderBy:{name:"asc"}});
  const team=teams.find(item=>item.id===query.team)??teams[0];
  if(!team)redirect("/dashboard");
  const [memberships,players,accounts,invites]=await Promise.all([
    db.teamMembership.findMany({where:{teamId:team.id},include:{user:true},orderBy:{createdAt:"asc"}}),
    db.player.findMany({where:{teamId:team.id},orderBy:[{active:"desc"},{lastName:"asc"},{firstName:"asc"}]}),
    db.user.findMany({where:{OR:[{teamMemberships:{some:{teamId:team.id}}},{player:{is:null}},{player:{is:{teamId:team.id}}}]},select:{id:true,name:true,email:true,teamMemberships:{where:{teamId:team.id},select:{roles:true}},player:{select:{id:true,teamId:true}}},orderBy:[{name:"asc"},{email:"asc"}]}),
    db.teamInvite.findMany({where:{teamId:team.id,usedAt:null,expiresAt:{gt:new Date()}},include:{createdBy:{select:{name:true}}},orderBy:{createdAt:"desc"}}),
  ]);
  const teamAdmins=memberships.filter(membership=>membership.roles.includes("team_admin"));
  const canAdmin=user.platformRole==="admin"||user.teamMemberships.some(membership=>membership.teamId===team.id&&membership.roles.includes("team_admin"));
  return <PageShell user={user}><div className="page-head"><div><span className="eyebrow">{team.club.name}</span><h1>Teambeheer</h1></div><TeamSelector teams={teams} current={team.id}/></div><TeamManagementPanel key={team.id} teamId={team.id} club={{id:team.club.id,name:team.club.name,logoPath:team.club.logoLocalPath??team.club.logoUrl}} canAdmin={canAdmin} accounts={accounts.map(account=>({id:account.id,name:account.name,email:account.email,roles:account.teamMemberships[0]?.roles??[],playerId:account.player?.teamId===team.id?account.player.id:null}))} members={memberships.map(membership=>({userId:membership.userId,name:membership.user.name,email:membership.user.email,roles:membership.roles}))} players={players.map(player=>({id:player.id,firstName:player.firstName,namePrefix:player.namePrefix,lastName:player.lastName,displayName:player.displayName,shirtNumber:player.shirtNumber,position:player.position,userId:player.userId,active:player.active}))} invites={invites.map(invite=>({id:invite.id,expiresAt:invite.expiresAt.toISOString(),createdBy:invite.createdBy.name}))} protectedAdminUserId={teamAdmins.length===1?teamAdmins[0].userId:null}/></PageShell>;
}
