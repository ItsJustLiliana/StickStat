import {apiError, HttpError, ok} from "@/lib/api";
import {requireUser} from "@/lib/auth";
import {db} from "@/lib/db";
import {z} from "zod";

export async function GET() {
  try {
    const user = await requireUser();
    const teamIds = user.platformRole === "admin" ? undefined : user.teamMemberships.filter(membership => membership.roles.includes("team_admin")).map(membership => membership.teamId);
    const count = await db.teamJoinRequest.count({where:{status:"pending", ...(teamIds ? {teamId:{in:teamIds}} : {})}});
    return ok({count});
  } catch (error) { return apiError(error); }
}

export async function POST(request:Request){try{const user=await requireUser(),{teamId}=z.object({teamId:z.string().cuid()}).parse(await request.json());if(user.teamMemberships.some(membership=>membership.teamId===teamId))throw new HttpError(409,"ALREADY_MEMBER","Je bent al lid van dit team");const team=await db.team.findUnique({where:{id:teamId},include:{club:true,memberships:{where:{roles:{has:"team_admin"}},select:{userId:true}}}});if(!team)throw new HttpError(404,"TEAM_NOT_FOUND","Dit team bestaat niet");const joinRequest=await db.teamJoinRequest.upsert({where:{userId_teamId:{userId:user.id,teamId}},update:{status:"pending"},create:{userId:user.id,teamId}});if(team.memberships.length)await db.notification.createMany({data:team.memberships.map(membership=>({userId:membership.userId,type:"general",title:"Nieuwe teamaanmelding",body:`${user.name} wil lid worden van ${team.club.name} · ${team.name}.`,link:`/team-requests?team=${team.id}`}))});return ok(joinRequest,{status:201})}catch(error){return apiError(error)}}
