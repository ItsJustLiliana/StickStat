import {apiError,HttpError,ok} from "@/lib/api";
import {authorizeTeam} from "@/lib/auth";
import {db} from "@/lib/db";
import {eventSchema} from "@/lib/validation";

export async function POST(request:Request,{params}:{params:Promise<{matchId:string}>}){
  try{
    const {matchId}=await params,match=await db.match.findUnique({where:{id:matchId}});if(!match)throw new HttpError(404,"NOT_FOUND","Wedstrijd niet gevonden");
    let teamId=match.homeTeamId;try{await authorizeTeam(teamId,true)}catch{teamId=match.awayTeamId;await authorizeTeam(teamId,true)}
    const data=eventSchema.parse(await request.json()),playerIds=[data.playerId,data.relatedPlayerId].filter((id):id is string=>Boolean(id));
    if(playerIds.length){const valid=await db.player.count({where:{id:{in:playerIds},teamId}});if(valid!==new Set(playerIds).size)throw new HttpError(400,"PLAYER_TEAM_MISMATCH","Niet alle spelers horen bij het geautoriseerde team")}
    return ok(await db.matchEvent.create({data:{matchId,...data}}),{status:201});
  }catch(error){return apiError(error)}
}
