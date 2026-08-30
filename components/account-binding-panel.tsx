"use client";
import {useRouter} from "next/navigation";
import {useMemo,useState} from "react";

type UserOption={id:string;label:string};
type TeamOption={id:string;label:string};
type PlayerOption={id:string;teamId:string;label:string;linkedAccount?:string};
const roles=[["team_admin","Teambeheerder"],["coach","Coach"],["trainer","Trainer"],["player","Speler"],["viewer","Kijker"]] as const;

export function AccountBindingPanel({users,teams,players,currentUserId}:{users:UserOption[];teams:TeamOption[];players:PlayerOption[];currentUserId:string}){
  const router=useRouter(),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[teamId,setTeamId]=useState(teams[0]?.id??"");
  const defaultUser=users.some(user=>user.id===currentUserId)?currentUserId:users[0]?.id,teamPlayers=useMemo(()=>players.filter(player=>player.teamId===teamId),[players,teamId]);

  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setMessage("");const form=new FormData(event.currentTarget),playerId=String(form.get("playerId")??"");
    const response=await fetch("/api/admin/account-bindings",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({userId:String(form.get("userId")),teamId:String(form.get("teamId")),playerId:playerId||null,roles:form.getAll("roles").map(String)})}),body=await response.json();
    setBusy(false);if(!response.ok){setMessage(body.error?.message??"Koppelen mislukt");return}setMessage("Account, team, rollen en speler zijn opgeslagen.");router.refresh();
  }

  return <section className="card" style={{marginTop:18}}><div className="card-head"><div><h2>Account koppelen</h2><p className="muted" style={{margin:0}}>Regel teamtoegang, rollen en het spelersprofiel in één keer.</p></div><span className="badge">ÉÉN STAP</span></div><form className="binding-form" onSubmit={submit}><label><span>1. Geregistreerde gebruiker</span><select className="input" name="userId" defaultValue={defaultUser} required>{users.map(user=><option value={user.id} key={user.id}>{user.label}</option>)}</select></label><label><span>2. Team</span><select className="input" name="teamId" value={teamId} onChange={event=>setTeamId(event.target.value)} required>{teams.map(team=><option value={team.id} key={team.id}>{team.label}</option>)}</select></label><label><span>3. Spelersprofiel</span><select className="input" name="playerId" defaultValue=""><option value="">Geen spelersprofiel</option>{teamPlayers.map(player=><option value={player.id} key={player.id}>{player.label}{player.linkedAccount?` · gekoppeld aan ${player.linkedAccount}`:""}</option>)}</select><small className="muted">Bij een koppeling wordt Speler automatisch toegevoegd als rol.</small></label><fieldset><legend>4. Rollen</legend><div className="role-options">{roles.map(([value,label])=><label key={value}><input type="checkbox" name="roles" value={value} defaultChecked={value==="player"}/>{label}</label>)}</div></fieldset><button className="button" disabled={busy||!users.length||!teams.length}>{busy?"Opslaan…":"Alles koppelen"}</button></form>{message&&<p className="muted" role="status" style={{marginTop:16,marginBottom:0}}>{message}</p>}</section>;
}
