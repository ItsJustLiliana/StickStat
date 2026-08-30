import {redirect} from "next/navigation";
import {currentUser} from "./auth";
import {db} from "./db";
import {selectPreferredTeam} from "./team-selection";

export async function pageContext(requested?:string){
  const user=await currentUser();
  if(!user)redirect("/login");
  const [teams,player]=await Promise.all([
    db.team.findMany({where:user.platformRole==="admin"?{}:{OR:[{memberships:{some:{userId:user.id}}},{club:{memberships:{some:{userId:user.id}}}}]},include:{club:true},orderBy:{name:"asc"}}),
    db.player.findUnique({where:{userId:user.id},select:{teamId:true}}),
  ]);
  const membershipTeamIds=[...user.teamMemberships].sort((a,b)=>a.createdAt.getTime()-b.createdAt.getTime()).map(membership=>membership.teamId);
  const team=selectPreferredTeam(teams,requested,player?.teamId,membershipTeamIds);
  return {user,teams,team};
}
