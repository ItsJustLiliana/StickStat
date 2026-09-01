import {EmptyTeam} from "@/components/empty-team";
import {PageShell} from "@/components/page-shell";
import {StandingsView} from "@/components/standings-view";
import {db} from "@/lib/db";
import {pageContext} from "@/lib/page-data";

export const dynamic="force-dynamic";

export default async function Standings({searchParams}:{searchParams:Promise<{team?:string}>}){
  const query=await searchParams,{user,teams,team}=await pageContext(query.team);
  if(!team)return <PageShell user={user}><EmptyTeam/></PageShell>;

  const own=await db.standing.findFirst({where:{teamId:team.id},orderBy:{lastSyncedAt:"desc"}});
  const rows=own?await db.standing.findMany({
    where:{seasonId:own.seasonId,competition:own.competition},
    include:{team:true},
    orderBy:{position:"asc"},
  }):[];

  return <PageShell user={user}><StandingsView competition={own?.competition??"Competitie"} teams={teams} currentTeamId={team.id} rows={rows.map(row=>({id:row.id,teamId:row.teamId,teamName:row.team.name,position:row.position,played:row.played,won:row.won,drawn:row.drawn,lost:row.lost,goalsFor:row.goalsFor,goalsAgainst:row.goalsAgainst,goalDifference:row.goalDifference,points:row.points}))}/></PageShell>;
}
