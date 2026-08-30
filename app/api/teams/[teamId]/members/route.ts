import {apiError,HttpError,ok} from "@/lib/api";
import {authorizeTeamManagement} from "@/lib/auth";
import {db} from "@/lib/db";
import type {TeamRole} from "@/generated/prisma/client";
import {z} from "zod";

const role=z.enum(["team_admin","coach","trainer","player","viewer"]);
const saveSchema=z.object({email:z.string().email().transform(value=>value.toLowerCase()),roles:z.array(role).min(1)});
const removeSchema=z.object({userId:z.string().cuid()});

function canGrantTeamAdmin(actor:{platformRole:string;teamMemberships:{teamId:string;roles:TeamRole[]}[]},teamId:string){
  return actor.platformRole==="admin"||actor.teamMemberships.some(membership=>membership.teamId===teamId&&membership.roles.includes("team_admin"));
}

export async function POST(request:Request,{params}:{params:Promise<{teamId:string}>}){
  try{
    const {teamId}=await params,actor=await authorizeTeamManagement(teamId),input=saveSchema.parse(await request.json());
    const roles=[...new Set(input.roles)];
    const user=await db.user.findUnique({where:{email:input.email},select:{id:true}});
    if(!user)throw new HttpError(404,"ACCOUNT_NOT_FOUND","Dit e-mailadres heeft nog geen StickStat-account");
    const existing=await db.teamMembership.findUnique({where:{userId_teamId:{userId:user.id,teamId}}});
    if((roles.includes("team_admin")||existing?.roles.includes("team_admin"))&&!canGrantTeamAdmin(actor,teamId))throw new HttpError(403,"FORBIDDEN","Alleen een teambeheerder kan deze rol beheren");
    if(existing?.roles.includes("team_admin")&&!roles.includes("team_admin")){
      const adminCount=await db.teamMembership.count({where:{teamId,roles:{has:"team_admin"}}});
      if(adminCount<=1)throw new HttpError(409,"LAST_TEAM_ADMIN","Een team moet minimaal één teambeheerder houden");
    }
    return ok(await db.teamMembership.upsert({where:{userId_teamId:{userId:user.id,teamId}},update:{roles},create:{userId:user.id,teamId,roles}}));
  }catch(error){return apiError(error)}
}

export async function DELETE(request:Request,{params}:{params:Promise<{teamId:string}>}){
  try{
    const {teamId}=await params,actor=await authorizeTeamManagement(teamId),input=removeSchema.parse(await request.json());
    const membership=await db.teamMembership.findUnique({where:{userId_teamId:{userId:input.userId,teamId}}});
    if(!membership)throw new HttpError(404,"NOT_FOUND","Teamlid niet gevonden");
    if(membership.roles.includes("team_admin")&&!canGrantTeamAdmin(actor,teamId))throw new HttpError(403,"FORBIDDEN","Alleen een teambeheerder kan een teambeheerder verwijderen");
    if(membership.roles.includes("team_admin")){
      const adminCount=await db.teamMembership.count({where:{teamId,roles:{has:"team_admin"}}});
      if(adminCount<=1)throw new HttpError(409,"LAST_TEAM_ADMIN","Een team moet minimaal één teambeheerder houden");
    }
    await db.$transaction([
      db.player.updateMany({where:{teamId,userId:input.userId},data:{userId:null}}),
      db.teamMembership.delete({where:{userId_teamId:{userId:input.userId,teamId}}}),
    ]);
    return ok({removed:true});
  }catch(error){return apiError(error)}
}
