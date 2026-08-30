import {apiError,HttpError,ok} from "@/lib/api";
import {authorizeTeamManagement} from "@/lib/auth";
import {db} from "@/lib/db";
import {z} from "zod";

const schema=z.object({userId:z.string().cuid(),playerId:z.string().cuid()});

export async function POST(request:Request,{params}:{params:Promise<{teamId:string}>}){
  try{
    const {teamId}=await params;await authorizeTeamManagement(teamId);
    const input=schema.parse(await request.json());
    const [membership,player]=await Promise.all([
      db.teamMembership.findUnique({where:{userId_teamId:{userId:input.userId,teamId}}}),
      db.player.findUnique({where:{id:input.playerId}}),
    ]);
    if(!membership||!player||player.teamId!==teamId)throw new HttpError(404,"NOT_FOUND","Teamlid of speler niet gevonden");
    const roles=[...new Set([...membership.roles,"player" as const])];
    const [,linkedPlayer]=await db.$transaction([
      db.player.updateMany({where:{userId:input.userId,NOT:{id:input.playerId}},data:{userId:null}}),
      db.player.update({where:{id:input.playerId},data:{userId:input.userId}}),
      db.teamMembership.update({where:{userId_teamId:{userId:input.userId,teamId}},data:{roles}}),
      db.user.update({where:{id:input.userId},data:{name:player.displayName}}),
    ]);
    return ok(linkedPlayer);
  }catch(error){return apiError(error)}
}
