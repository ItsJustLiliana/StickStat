"use client";
import {useRouter} from "next/navigation";
import {useState} from "react";

type UserOption={id:string;label:string};
type TeamOption={id:string;label:string};
type PlayerOption={id:string;label:string;linkedAccount?:string};

async function post(url:string,data:Record<string,string>){
  const response=await fetch(url,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(data)});
  const body=await response.json();
  if(!response.ok)throw new Error(body.error?.message??"Opslaan mislukt");
}

export function AccountBindingPanel({users,teams,players,currentUserId}:{users:UserOption[];teams:TeamOption[];players:PlayerOption[];currentUserId:string}){
  const router=useRouter();
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  const defaultUser=users.some(user=>user.id===currentUserId)?currentUserId:users[0]?.id;

  async function saveMembership(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setMessage("");
    const form=new FormData(event.currentTarget);
    try{
      await post("/api/admin/memberships",{scope:"team",userId:String(form.get("userId")),teamId:String(form.get("teamId")),role:String(form.get("role"))});
      setMessage("Teamtoegang opgeslagen.");router.refresh();
    }catch(error){setMessage(error instanceof Error?error.message:"Opslaan mislukt")}finally{setBusy(false)}
  }

  async function linkPlayer(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setMessage("");
    const form=new FormData(event.currentTarget);
    try{
      await post("/api/admin/player-links",{userId:String(form.get("userId")),playerId:String(form.get("playerId"))});
      setMessage("Account aan speler gekoppeld.");router.refresh();
    }catch(error){setMessage(error instanceof Error?error.message:"Koppelen mislukt")}finally{setBusy(false)}
  }

  return <section className="card" style={{marginTop:18}}><div className="card-head"><h2>Accounts koppelen</h2><span className="badge">BEHEER</span></div><div className="admin-grid"><form onSubmit={saveMembership}><h3>Teamtoegang</h3><p className="muted">Geef een account toegang tot een team en kies de rol.</p><div className="form-row" style={{flexWrap:"wrap"}}><select className="input" name="userId" defaultValue={defaultUser} required>{users.map(user=><option value={user.id} key={user.id}>{user.label}</option>)}</select><select className="input" name="teamId" required>{teams.map(team=><option value={team.id} key={team.id}>{team.label}</option>)}</select><select className="input" name="role" defaultValue="player"><option value="team_admin">Teambeheerder</option><option value="coach">Coach</option><option value="player">Speler</option><option value="viewer">Kijker</option></select><button className="button" disabled={busy||!users.length||!teams.length}>Opslaan</button></div></form><form onSubmit={linkPlayer}><h3>Spelersprofiel</h3><p className="muted">Verbind een account met de bijbehorende speler en geef automatisch teamtoegang.</p><div className="form-row" style={{flexWrap:"wrap"}}><select className="input" name="userId" defaultValue={defaultUser} required>{users.map(user=><option value={user.id} key={user.id}>{user.label}</option>)}</select><select className="input" name="playerId" required>{players.map(player=><option value={player.id} key={player.id}>{player.label}{player.linkedAccount?` · ${player.linkedAccount}`:""}</option>)}</select><button className="button" disabled={busy||!users.length||!players.length}>Koppelen</button></div></form></div>{message&&<p className="muted" role="status" style={{marginTop:16,marginBottom:0}}>{message}</p>}</section>;
}
