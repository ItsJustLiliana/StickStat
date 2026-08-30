import {apiError,HttpError,ok} from "@/lib/api";
import {authorizeTeamManagement} from "@/lib/auth";
import {db} from "@/lib/db";
import {z} from "zod";

const row=z.object({playerId:z.string().cuid(),participation:z.enum(["absent","substitute","starter"]),goals:z.number().int().min(0).max(20),greenCards:z.number().int().min(0).max(3),yellowCards:z.number().int().min(0).max(3),redCards:z.number().int().min(0).max(3),mvp:z.boolean(),notes:z.string().trim().max(500)});
const schema=z.object({teamId:z.string().cuid(),rows:z.array(row).max(100)});
const cardTypes=["green_card","yellow_card","red_card"] as const;

export async function PUT(request:Request,{params}:{params:Promise<{matchId:string}>}){
  try{
    const {matchId}=await params,input=schema.parse(await request.json()),match=await db.match.findUnique({where:{id:matchId}});
    if(!match)throw new HttpError(404,"NOT_FOUND","Wedstrijd niet gevonden");
    if(match.status!=="finished")throw new HttpError(409,"MATCH_NOT_FINISHED","Statistieken kunnen pas na de wedstrijd worden ingevuld");
    if(![match.homeTeamId,match.awayTeamId].includes(input.teamId))throw new HttpError(400,"TEAM_NOT_IN_MATCH","Dit team speelt niet in deze wedstrijd");
    await authorizeTeamManagement(input.teamId);
    const uniquePlayerIds=new Set(input.rows.map(item=>item.playerId));
    if(uniquePlayerIds.size!==input.rows.length)throw new HttpError(400,"DUPLICATE_PLAYER","Een speler staat meerdere keren in de invoer");
    const validPlayers=await db.player.count({where:{teamId:input.teamId,id:{in:[...uniquePlayerIds]}}});
    if(validPlayers!==uniquePlayerIds.size)throw new HttpError(400,"PLAYER_TEAM_MISMATCH","Niet alle spelers horen bij dit team");
    if(input.rows.filter(item=>item.mvp&&item.participation!=="absent").length>1)throw new HttpError(400,"MULTIPLE_MVPS","Kies maximaal één MVP");
    const ownScore=match.homeTeamId===input.teamId?match.homeScore:match.awayScore,totalGoals=input.rows.reduce((total,item)=>total+(item.participation==="absent"?0:item.goals),0);
    if(ownScore!==null&&totalGoals>ownScore)throw new HttpError(400,"TOO_MANY_GOALS","Spelersgoals kunnen niet hoger zijn dan de teamscore");
    await db.$transaction(async transaction=>{
      const playerIds=[...uniquePlayerIds];
      await transaction.matchEvent.deleteMany({where:{matchId,playerId:{in:playerIds},type:{in:[...cardTypes]}}});
      for(const item of input.rows){
        if(item.participation==="absent")await transaction.playerMatchStats.deleteMany({where:{matchId,playerId:item.playerId}});
        else await transaction.playerMatchStats.upsert({where:{matchId_playerId:{matchId,playerId:item.playerId}},update:{started:item.participation==="starter",minutesPlayed:null,goals:item.goals,assists:0,saves:0,mvp:item.mvp,notes:item.notes||null},create:{matchId,playerId:item.playerId,started:item.participation==="starter",goals:item.goals,mvp:item.mvp,notes:item.notes||null}});
        if(item.participation!=="absent")for(const [type,count] of [["green_card",item.greenCards],["yellow_card",item.yellowCards],["red_card",item.redCards]] as const)if(count)await transaction.matchEvent.createMany({data:Array.from({length:count},()=>({matchId,playerId:item.playerId,type}))});
      }
    });
    return ok({saved:true,totalGoals,unassignedGoals:ownScore===null?null:ownScore-totalGoals});
  }catch(error){return apiError(error)}
}
