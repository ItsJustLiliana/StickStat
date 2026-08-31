import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { HockeyStandenProvider } from "@/providers/hockeystanden";
import type { HockeyDataProvider } from "@/providers/types";

const providers: Record<string, HockeyDataProvider> = { hockeystanden: new HockeyStandenProvider() };
const slugify = (v:string)=>v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"").slice(0,60)||"team";
function seasonFor(date:Date){ const year=date.getUTCFullYear(); const start=date.getUTCMonth()>=6?year:year-1; return {name:`${start}/${start+1}`,startDate:new Date(Date.UTC(start,6,1)),endDate:new Date(Date.UTC(start+1,5,30,23,59,59))}; }
async function opponentTeam(name:string){ const slug=slugify(name); const club=await db.club.upsert({where:{slug},update:{},create:{name,slug}}); return db.team.upsert({where:{clubId_name:{clubId:club.id,name}},update:{},create:{clubId:club.id,name,shortName:name}}); }

export async function syncTeam(teamId:string){
  const team=await db.team.findUnique({where:{id:teamId},include:{club:true}}); if(!team?.externalProvider||!team.externalIdentifier) throw new Error("Team heeft geen providerconfiguratie");
  const provider=providers[team.externalProvider]; if(!provider) throw new Error(`Onbekende provider: ${team.externalProvider}`);
  const lock=Number.parseInt(createHash("sha1").update(teamId).digest("hex").slice(0,7),16);
  const rows=await db.$queryRaw<Array<{locked:boolean}>>`SELECT pg_try_advisory_lock(${lock}) AS locked`; if(!rows[0]?.locked) throw new Error("Synchronisatie loopt al");
  const run=await db.syncRun.create({data:{teamId,status:"running"}}); logger.info("Sync gestart",{teamId,provider:team.externalProvider});
  try {
    const [clubData,matches,standings]=await Promise.all([provider.getClub(team.externalIdentifier),provider.getMatches(team.externalIdentifier),provider.getStandings(team.externalIdentifier)]); let created=0,updated=0;
    if(clubData?.logoUrl)await db.club.update({where:{id:team.clubId},data:{logoUrl:clubData.logoUrl}});
    for(const external of matches){ const seasonData=seasonFor(external.date); const season=await db.season.upsert({where:{name:seasonData.name},update:{},create:seasonData}); const ownHome=[team.name,team.shortName].some(n=>external.homeTeam.toLowerCase().includes(n.toLowerCase())); const ownAway=[team.name,team.shortName].some(n=>external.awayTeam.toLowerCase().includes(n.toLowerCase())); if(!ownHome&&!ownAway) continue; const home=ownHome?team:await opponentTeam(external.homeTeam); const away=ownAway?team:await opponentTeam(external.awayTeam); const existing=await db.match.findFirst({where:{OR:[{externalProvider:team.externalProvider,externalId:external.externalId},{seasonId:season.id,homeTeamId:home.id,awayTeamId:away.id,date:external.date}]}}); const data={externalProvider:team.externalProvider,externalId:external.externalId,seasonId:season.id,competition:external.competition,homeTeamId:home.id,awayTeamId:away.id,date:external.date,startTime:external.startTime,venue:external.venue,status:external.status,homeScore:external.homeScore,awayScore:external.awayScore,lastSyncedAt:new Date()}; if(existing){await db.match.update({where:{id:existing.id},data});updated++;}else{await db.match.create({data});created++;} }
    for(const row of standings){ const seasonData=seasonFor(new Date()); const season=await db.season.upsert({where:{name:seasonData.name},update:{},create:seasonData}); const standingTeam=[team.name,team.shortName].some(n=>row.team.toLowerCase().includes(n.toLowerCase()))?team:await opponentTeam(row.team); await db.standing.upsert({where:{seasonId_competition_teamId:{seasonId:season.id,competition:row.competition,teamId:standingTeam.id}},update:{...row,team:undefined,lastSyncedAt:new Date()},create:{seasonId:season.id,teamId:standingTeam.id,competition:row.competition,position:row.position,played:row.played,won:row.won,drawn:row.drawn,lost:row.lost,goalsFor:row.goalsFor,goalsAgainst:row.goalsAgainst,goalDifference:row.goalDifference,points:row.points,lastSyncedAt:new Date()}}); }
    await db.syncRun.update({where:{id:run.id},data:{status:"success",completedAt:new Date(),newMatches:created,updatedMatches:updated}}); logger.info("Sync voltooid",{teamId,created,updated}); return {created,updated,standings:standings.length};
  } catch(error){ const message=error instanceof Error?error.message:String(error); await db.syncRun.update({where:{id:run.id},data:{status:"failed",completedAt:new Date(),error:message.slice(0,1000)}}); logger.error("Sync mislukt",{teamId,error:message}); throw error;
  } finally { await db.$queryRaw`SELECT pg_advisory_unlock(${lock})`; }
}
export async function syncAllTeams(){ const teams=await db.team.findMany({where:{externalProvider:{not:null},externalIdentifier:{not:null}}}); for(const team of teams){try{await syncTeam(team.id);}catch{/* logged per team */}} }
