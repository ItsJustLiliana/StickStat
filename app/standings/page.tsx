import {EmptyTeam} from "@/components/empty-team";
import {PageShell} from "@/components/page-shell";
import {TeamSelector} from "@/components/team-selector";
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

  return <PageShell user={user}>
    <div className="page-head"><div><span className="eyebrow">{own?.competition??"Competitie"}</span><h1>Stand</h1></div><TeamSelector teams={teams} current={team.id}/></div>
    <section className="card" style={{overflowX:"auto"}}>
      <table><thead><tr><th>#</th><th>Team</th><th>GS</th><th>W</th><th>G</th><th>V</th><th>DV</th><th>DT</th><th>DS</th><th>P</th></tr></thead><tbody>
        {rows.map(row=><tr className={row.teamId===team.id?"active-row":""} key={row.id}><td><strong>{row.position}</strong></td><td><strong>{row.team.shortName}</strong></td><td>{row.played}</td><td>{row.won}</td><td>{row.drawn}</td><td>{row.lost}</td><td>{row.goalsFor}</td><td>{row.goalsAgainst}</td><td>{row.goalDifference}</td><td><strong>{row.points}</strong></td></tr>)}
      </tbody></table>
      {!rows.length&&<div className="empty">De stand verschijnt na de eerste succesvolle synchronisatie.</div>}
    </section>
  </PageShell>;
}
