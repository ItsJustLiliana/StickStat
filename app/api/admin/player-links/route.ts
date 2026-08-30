import {apiError,HttpError,ok} from "@/lib/api";
import {requirePlatformAdmin} from "@/lib/auth";
import {db} from "@/lib/db";
import {z} from "zod";

const schema=z.object({userId:z.string().cuid(),playerId:z.string().cuid()});

export async function POST(request:Request){
  try{
    await requirePlatformAdmin();
    const input=schema.parse(await request.json());
    const [user,player]=await Promise.all([
      db.user.findUnique({where:{id:input.userId},select:{id:true}}),
      db.player.findUnique({where:{id:input.playerId},select:{id:true,teamId:true,displayName:true}}),
    ]);
    if(!user||!player)throw new HttpError(404,"NOT_FOUND","Account of speler niet gevonden");
    const membership=await db.teamMembership.findUnique({where:{userId_teamId:{userId:input.userId,teamId:player.teamId}}});
    const roles=[...new Set([...(membership?.roles??[]),"player" as const])];
    const [,linkedPlayer]=await db.$transaction([
      db.player.updateMany({where:{userId:input.userId,NOT:{id:input.playerId}},data:{userId:null}}),
      db.player.update({where:{id:input.playerId},data:{userId:input.userId}}),
      db.teamMembership.upsert({where:{userId_teamId:{userId:input.userId,teamId:player.teamId}},update:{roles},create:{userId:input.userId,teamId:player.teamId,roles}}),
      db.user.update({where:{id:input.userId},data:{name:player.displayName}}),
    ]);
    return ok(linkedPlayer);
  }catch(error){return apiError(error)}
}
