import {apiError,HttpError,ok} from "@/lib/api";
import {authorizeTeamManagement} from "@/lib/auth";
import {db} from "@/lib/db";
import type {TeamRole} from "@/generated/prisma/client";
import {z} from "zod";

const role=z.enum(["team_admin","coach","trainer","player","viewer"]);
const saveSchema=z.object({userId:z.string().cuid(),playerId:z.string().cuid().nullable(),roles:z.array(role)});
const removeSchema=z.object({userId:z.string().cuid()});

function canGrantTeamAdmin(actor:{platformRole:string;teamMemberships:{teamId:string;roles:TeamRole[]}[]},teamId:string){
  return actor.platformRole==="admin"||actor.teamMemberships.some(membership=>membership.teamId===teamId&&membership.roles.includes("team_admin"));
}

export async function POST(request:Request,{params}:{params:Promise<{teamId:string}>}){
  try{
    const {teamId}=await params,actor=await authorizeTeamManagement(teamId),input=saveSchema.parse(await request.json());
    const [user,player]=await Promise.all([db.user.findUnique({where:{id:input.userId},select:{id:true}}),input.playerId?db.player.findUnique({where:{id:input.playerId},select:{id:true,teamId:true,displayName:true}}):null]);
    if(!user)throw new HttpError(404,"ACCOUNT_NOT_FOUND","Dit StickStat-account bestaat niet meer");
    if(input.playerId&&(!player||player.teamId!==teamId))throw new HttpError(400,"PLAYER_TEAM_MISMATCH","Deze speler hoort niet bij dit team");
    const roles=[...new Set([...input.roles,...(player?["player" as const]:[])])];
    const existing=await db.teamMembership.findUnique({where:{userId_teamId:{userId:user.id,teamId}}});
    if((roles.includes("team_admin")||existing?.roles.includes("team_admin"))&&!canGrantTeamAdmin(actor,teamId))throw new HttpError(403,"FORBIDDEN","Alleen een teambeheerder kan deze rol beheren");
    if(existing?.roles.includes("team_admin")&&!roles.includes("team_admin")){
      const adminCount=await db.teamMembership.count({where:{teamId,roles:{has:"team_admin"}}});
      if(adminCount<=1)throw new HttpError(409,"LAST_TEAM_ADMIN","Een team moet minimaal één teambeheerder houden");
    }
    const actions=[db.teamMembership.upsert({where:{userId_teamId:{userId:user.id,teamId}},update:{roles},create:{userId:user.id,teamId,roles}})];
    if(player)await db.$transaction([...actions,db.player.updateMany({where:{userId:user.id,NOT:{id:player.id}},data:{userId:null}}),db.player.update({where:{id:player.id},data:{userId:user.id}}),db.user.update({where:{id:user.id},data:{name:player.displayName}})]);else await db.$transaction([...actions,db.player.updateMany({where:{teamId,userId:user.id},data:{userId:null}})]);
    return ok({userId:user.id,teamId,playerId:player?.id??null,roles});
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
