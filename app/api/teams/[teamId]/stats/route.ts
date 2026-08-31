import {apiError,ok} from "@/lib/api";
import {authorizeTeam} from "@/lib/auth";
import {db} from "@/lib/db";
import {StatisticsService} from "@/services/statistics";

const finishedMatchForTeam=(teamId:string)=>({
  status:"finished" as const,
  OR:[{homeTeamId:teamId},{awayTeamId:teamId}],
});

export async function GET(_:Request,{params}:{params:Promise<{teamId:string}>}){
  try{
    const {teamId}=await params;
    await authorizeTeam(teamId);
    const matchFilter=finishedMatchForTeam(teamId);
    const [matches,players]=await Promise.all([
      db.match.findMany({where:matchFilter,orderBy:{date:"asc"}}),
      db.player.findMany({
        where:{teamId},
        include:{
          matchStats:{where:{match:matchFilter}},
          events:{where:{match:matchFilter}},
        },
      }),
    ]);
    return ok({
      summary:StatisticsService.summary(matches,teamId),
      form:StatisticsService.form(matches,teamId,10),
      cumulativePoints:StatisticsService.cumulativePoints(matches,teamId),
      players:players.map(player=>({
        id:player.id,
        name:player.displayName,
        goals:player.matchStats.reduce((total,stat)=>total+stat.goals,0),
        assists:player.matchStats.reduce((total,stat)=>total+stat.assists,0),
        mvp:player.matchStats.filter(stat=>stat.mvp).length,
        cards:player.events.filter(event=>event.type.endsWith("_card")).length,
      })),
    });
  }catch(error){return apiError(error)}
}
