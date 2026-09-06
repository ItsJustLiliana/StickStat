import {apiError,HttpError,ok} from "@/lib/api";
import {authorizeTeamManagement} from "@/lib/auth";
import {db} from "@/lib/db";
import {z} from "zod";

const substitution=z.object({playerInId:z.string().cuid(),playerOutId:z.string().cuid(),minute:z.number().int().min(0).max(120).nullable()}).refine(item=>item.playerInId!==item.playerOutId,{message:"Een speler kan niet voor zichzelf wisselen"});
const schema=z.object({teamId:z.string().cuid(),substitutions:z.array(substitution).max(30)});

export async function PUT(request:Request,{params}:{params:Promise<{matchId:string}>}){
  try{const {matchId}=await params,input=schema.parse(await request.json()),match=await db.match.findUnique({where:{id:matchId}});if(!match||![match.homeTeamId,match.awayTeamId].includes(input.teamId))throw new HttpError(404,"NOT_FOUND","Wedstrijd niet gevonden");await authorizeTeamManagement(input.teamId);const teamPlayers=await db.player.findMany({where:{teamId:input.teamId},select:{id:true}}),teamPlayerIds=teamPlayers.map(player=>player.id),inputPlayerIds=new Set(input.substitutions.flatMap(item=>[item.playerInId,item.playerOutId]));if(![...inputPlayerIds].every(id=>teamPlayerIds.includes(id)))throw new HttpError(400,"PLAYER_TEAM_MISMATCH","Niet alle spelers horen bij dit team");await db.$transaction(async transaction=>{await transaction.matchEvent.deleteMany({where:{matchId,type:"substitution",OR:[{playerId:{in:teamPlayerIds}},{relatedPlayerId:{in:teamPlayerIds}}]}});if(input.substitutions.length)await transaction.matchEvent.createMany({data:input.substitutions.map(item=>({matchId,playerId:item.playerInId,relatedPlayerId:item.playerOutId,minute:item.minute,type:"substitution"}))});});return ok({saved:true});}catch(error){return apiError(error)}
}
