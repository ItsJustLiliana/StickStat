import {apiError,HttpError,ok} from "@/lib/api";
import {authorizeTeam} from "@/lib/auth";
import {db} from "@/lib/db";

export async function GET(_:Request,{params}:{params:Promise<{playerId:string}>}){
  try{
    const {playerId}=await params;
    const player=await db.player.findUnique({where:{id:playerId},select:{teamId:true}});
    if(!player)throw new HttpError(404,"NOT_FOUND","Speler niet gevonden");
    await authorizeTeam(player.teamId);
    const matchFilter={status:"finished" as const,OR:[{homeTeamId:player.teamId},{awayTeamId:player.teamId}]};
    const result=await db.player.findUnique({
      where:{id:playerId},
      include:{
        team:{include:{club:true}},
        matchStats:{where:{match:matchFilter},include:{match:true}},
        events:{where:{match:matchFilter}},
      },
    });
    return ok(result);
  }catch(error){return apiError(error)}
}
