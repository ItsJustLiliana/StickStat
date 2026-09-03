import "dotenv/config";
import {PrismaClient} from "../generated/prisma/client";
import {PrismaPg} from "@prisma/adapter-pg";
import { hash } from "@node-rs/argon2";
const db=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL!})});
async function main(){
  const username=(process.env.SEED_ADMIN_USERNAME??"admin").toLowerCase();
  const password=process.env.SEED_ADMIN_PASSWORD;if(!password||password==="change-this-before-seeding")throw new Error("Set een veilig SEED_ADMIN_PASSWORD voordat je seed uitvoert");
  const passwordHash=await hash(password,{memoryCost:19456,timeCost:2,outputLen:32,parallelism:1});
  const user=await db.user.upsert({where:{username},update:{name:"StickStat beheerder",passwordHash,platformRole:"admin"},create:{name:"StickStat beheerder",username,passwordHash,platformRole:"admin"}});
  const club=await db.club.upsert({where:{slug:"mhc-rapide"},update:{externalProvider:"hockeystanden",externalIdentifier:"mhc-rapide"},create:{name:"MHC Rapide",slug:"mhc-rapide",externalProvider:"hockeystanden",externalIdentifier:"mhc-rapide"}});
  const team=await db.team.upsert({where:{clubId_name:{clubId:club.id,name:"Rapide H1"}},update:{externalProvider:"hockeystanden",externalIdentifier:"mhc-rapide/h1"},create:{clubId:club.id,name:"Rapide H1",shortName:"Rapide H1",externalProvider:"hockeystanden",externalIdentifier:"mhc-rapide/h1"}});
  const start=new Date(Date.UTC(2026,6,1)),end=new Date(Date.UTC(2027,5,30,23,59,59));const season=await db.season.upsert({where:{name:"2026/2027"},update:{startDate:start,endDate:end},create:{name:"2026/2027",startDate:start,endDate:end}});
  await db.teamSeason.upsert({where:{teamId_seasonId_competition:{teamId:team.id,seasonId:season.id,competition:"Poule A"}},update:{},create:{teamId:team.id,seasonId:season.id,competition:"Poule A"}});
  await db.clubMembership.upsert({where:{userId_clubId:{userId:user.id,clubId:club.id}},update:{role:"club_admin"},create:{userId:user.id,clubId:club.id,role:"club_admin"}});
  await db.teamMembership.upsert({where:{userId_teamId:{userId:user.id,teamId:team.id}},update:{roles:["team_admin"]},create:{userId:user.id,teamId:team.id,roles:["team_admin"]}});
  console.info("StickStat seed voltooid",{username,club:club.name,team:team.name});
}
main().finally(()=>db.$disconnect()).catch(e=>{console.error(e instanceof Error?e.message:e);process.exit(1)});
