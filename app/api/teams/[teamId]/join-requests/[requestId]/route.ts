import {z} from "zod";
import {apiError, HttpError, ok} from "@/lib/api";
import {authorizeTeamAdmin} from "@/lib/auth";
import {db} from "@/lib/db";

const schema = z.object({action:z.enum(["approve", "decline"]), playerId:z.string().cuid().nullable().optional()});

export async function PATCH(request:Request, {params}:{params:Promise<{teamId:string; requestId:string}>}) {
  try {
    const {teamId, requestId} = await params, input = schema.parse(await request.json());
    await authorizeTeamAdmin(teamId);
    const joinRequest = await db.teamJoinRequest.findFirst({where:{id:requestId, teamId, status:"pending"}, include:{user:true, team:true}});
    if (!joinRequest) throw new HttpError(404, "REQUEST_NOT_FOUND", "Deze aanmelding is niet meer beschikbaar");
    const player = input.playerId ? await db.player.findFirst({where:{id:input.playerId, teamId}, select:{id:true, userId:true, displayName:true}}) : null;
    if (input.playerId && (!player || (player.userId && player.userId !== joinRequest.userId))) throw new HttpError(400, "PLAYER_UNAVAILABLE", "Dit spelersprofiel kan niet worden gekoppeld");
    if (input.action === "decline") {
      await db.$transaction([db.teamJoinRequest.update({where:{id:joinRequest.id}, data:{status:"declined"}}), db.notification.create({data:{userId:joinRequest.userId, type:"general", title:"Teamaanmelding afgewezen", body:`Je aanmelding voor ${joinRequest.team.name} is niet goedgekeurd.`}})]);
      return ok({status:"declined"});
    }
    await db.$transaction(async transaction => {
      await transaction.teamJoinRequest.update({where:{id:joinRequest.id}, data:{status:"approved"}});
      await transaction.teamMembership.upsert({where:{userId_teamId:{userId:joinRequest.userId, teamId}}, update:{roles:["player"]}, create:{userId:joinRequest.userId, teamId, roles:["player"]}});
      if (player) { await transaction.player.update({where:{id:player.id}, data:{userId:joinRequest.userId}}); await transaction.user.update({where:{id:joinRequest.userId}, data:{name:player.displayName}}); }
      await transaction.notification.create({data:{userId:joinRequest.userId, type:"general", title:"Welkom bij het team", body:`Je bent toegevoegd aan ${joinRequest.team.name}.`, link:"/dashboard"}});
    });
    return ok({status:"approved"});
  } catch (error) { return apiError(error); }
}
