import {apiError,HttpError,ok} from "@/lib/api";
import {authorizeTeam} from "@/lib/auth";
import {db} from "@/lib/db";
import {statsSchema} from "@/lib/validation";

export async function PUT(request:Request,{params}:{params:Promise<{matchId:string}>}){
  try{
    const {matchId}=await params,match=await db.match.findUnique({where:{id:matchId}});if(!match)throw new HttpError(404,"NOT_FOUND","Wedstrijd niet gevonden");
    let teamId=match.homeTeamId;try{await authorizeTeam(teamId,true)}catch{teamId=match.awayTeamId;await authorizeTeam(teamId,true)}
    const data=statsSchema.parse(await request.json()),player=await db.player.findUnique({where:{id:data.playerId},select:{teamId:true}});if(!player||player.teamId!==teamId)throw new HttpError(400,"PLAYER_TEAM_MISMATCH","Deze speler hoort niet bij het geautoriseerde team");
    const {playerId,...stats}=data;return ok(await db.playerMatchStats.upsert({where:{matchId_playerId:{matchId,playerId}},update:stats,create:{matchId,playerId,...stats}}));
  }catch(error){return apiError(error)}
}
