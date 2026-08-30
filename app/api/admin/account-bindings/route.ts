import {apiError,HttpError,ok} from "@/lib/api";
import {requirePlatformAdmin} from "@/lib/auth";
import {db} from "@/lib/db";
import {z} from "zod";

const role=z.enum(["team_admin","coach","trainer","player","viewer"]);
const schema=z.object({userId:z.string().cuid(),teamId:z.string().cuid(),playerId:z.string().cuid().nullable(),roles:z.array(role).min(1)});

export async function POST(request:Request){
  try{
    await requirePlatformAdmin();
    const input=schema.parse(await request.json());
    const [user,team,player]=await Promise.all([
      db.user.findUnique({where:{id:input.userId},select:{id:true}}),
      db.team.findUnique({where:{id:input.teamId},select:{id:true}}),
      input.playerId?db.player.findUnique({where:{id:input.playerId},select:{id:true,teamId:true,displayName:true}}):null,
    ]);
    if(!user||!team)throw new HttpError(404,"NOT_FOUND","Account of team niet gevonden");
    if(input.playerId&&(!player||player.teamId!==team.id))throw new HttpError(400,"PLAYER_TEAM_MISMATCH","Deze speler hoort niet bij het gekozen team");
    const roles=[...new Set([...input.roles,...(player?["player" as const]:[])])];
    const actions=[db.teamMembership.upsert({where:{userId_teamId:{userId:user.id,teamId:team.id}},update:{roles},create:{userId:user.id,teamId:team.id,roles}})];
    if(player)await db.$transaction([
      ...actions,
      db.player.updateMany({where:{userId:user.id,NOT:{id:player.id}},data:{userId:null}}),
      db.player.update({where:{id:player.id},data:{userId:user.id}}),
      db.user.update({where:{id:user.id},data:{name:player.displayName}}),
    ]);else await db.$transaction(actions);
    return ok({userId:user.id,teamId:team.id,playerId:player?.id??null,roles});
  }catch(error){return apiError(error)}
}
