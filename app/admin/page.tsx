import {redirect} from "next/navigation";
import {AccountBindingPanel} from "@/components/account-binding-panel";
import {PageShell} from "@/components/page-shell";
import {SyncButton} from "@/components/sync-button";
import {currentUser} from "@/lib/auth";
import {db} from "@/lib/db";

export const dynamic="force-dynamic";

export default async function Admin(){
  const user=await currentUser();
  if(!user)redirect("/login");
  if(user.platformRole!=="admin")redirect("/dashboard");
  const [clubs,teams,users,runs,players]=await Promise.all([
    db.club.findMany({include:{teams:true}}),
    db.team.findMany({include:{club:true}}),
    db.user.findMany({include:{clubMemberships:true,teamMemberships:true},orderBy:{name:"asc"}}),
    db.syncRun.findMany({include:{team:true},orderBy:{startedAt:"desc"},take:10}),
    db.player.findMany({include:{team:{include:{club:true}},user:true},orderBy:[{team:{name:"asc"}},{displayName:"asc"}]}),
  ]);
  return <PageShell user={user}><div className="page-head"><div><span className="eyebrow">Platformbeheer</span><h1>Beheer</h1></div><span className="badge accent">PLATFORM ADMIN</span></div><div className="admin-grid"><section className="card"><div className="card-head"><h2>Clubs & teams</h2><span className="badge">{clubs.length} clubs</span></div>{clubs.map(club=><div className="sync-item" key={club.id}><div><strong>{club.name}</strong><div className="muted" style={{fontSize:12}}>{club.teams.map(team=>team.name).join(", ")||"Nog geen teams"}</div></div></div>)}</section><section className="card"><div className="card-head"><h2>Gebruikers</h2><span className="badge">{users.length} accounts</span></div>{users.map(account=><div className="sync-item" key={account.id}><div><strong>{account.name}</strong><div className="muted" style={{fontSize:12}}>{account.email} · {account.platformRole} · {account.teamMemberships.length} teams</div></div></div>)}</section></div><AccountBindingPanel currentUserId={user.id} users={users.map(account=>({id:account.id,label:`${account.name} (${account.email})`}))} teams={teams.map(team=>({id:team.id,label:`${team.club.name} · ${team.name}`}))} players={players.map(player=>({id:player.id,teamId:player.teamId,label:player.displayName,linkedAccount:player.user?.email}))}/><section className="card" style={{marginTop:18}}><div className="card-head"><h2>Synchronisatie</h2><span className="badge">IEDER UUR</span></div>{teams.filter(team=>team.externalProvider).map(team=>{const last=runs.find(run=>run.teamId===team.id);return <div className="sync-item" key={team.id}><div><strong>{team.club.name} · {team.name}</strong><div className="muted" style={{fontSize:12}}>{last?`${last.status} · ${last.startedAt.toLocaleString("nl-NL")} · ${last.newMatches} nieuw / ${last.updatedMatches} bijgewerkt`:"Nog niet gesynchroniseerd"}{last?.error&&` · ${last.error}`}</div></div><SyncButton teamId={team.id}/></div>})}</section></PageShell>;
}
