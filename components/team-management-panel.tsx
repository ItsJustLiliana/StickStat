"use client";

import {useRouter} from "next/navigation";
import {useState} from "react";

type Role="team_admin"|"coach"|"trainer"|"player"|"viewer";
type Account={id:string;name:string;email:string;roles:Role[];playerId:string|null};
type Member={userId:string;name:string;email:string;roles:Role[]};
type Player={id:string;displayName:string;userId:string|null};
const roleOptions:[Role,string][]=[["player","Speler"],["coach","Coach"],["trainer","Trainer"],["team_admin","Teambeheerder"],["viewer","Kijker"]];
const labels=Object.fromEntries(roleOptions) as Record<Role,string>;

async function request(url:string,method:string,data:Record<string,unknown>){
  const response=await fetch(url,{method,headers:{"content-type":"application/json"},body:JSON.stringify(data)}),body=await response.json();
  if(!response.ok)throw new Error(body.error?.message??"Actie mislukt");
}

export function TeamManagementPanel({teamId,accounts,members,players}:{teamId:string;accounts:Account[];members:Member[];players:Player[]}){
  const router=useRouter(),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
  const [selectedUserId,setSelectedUserId]=useState(accounts[0]?.id??"");
  const [selectedRoles,setSelectedRoles]=useState<Role[]>(accounts[0]?.roles.length?accounts[0].roles:["player"]);
  const [selectedPlayerId,setSelectedPlayerId]=useState(accounts[0]?.playerId??"");

  async function run(action:()=>Promise<void>,success:string){setBusy(true);setMessage("");try{await action();setMessage(success);router.refresh()}catch(error){setMessage(error instanceof Error?error.message:"Actie mislukt")}finally{setBusy(false)}}
  function toggleRole(role:Role){setSelectedRoles(current=>current.includes(role)?current.filter(item=>item!==role):[...current,role])}
  function selectAccount(userId:string){const account=accounts.find(item=>item.id===userId);setSelectedUserId(userId);setSelectedRoles(account?.roles.length?account.roles:["player"]);setSelectedPlayerId(account?.playerId??"")}

  return <>
    <section className="card">
      <div className="card-head"><div><span className="eyebrow">Accounttoegang</span><h2>Account en rollen</h2></div><span className="badge">{members.length} GEKOPPELD</span></div>
      <p className="muted">Kies een geregistreerd account. De huidige rollen worden direct aangevinkt; je kunt ze aanpassen en het account eventueel aan een speler koppelen.</p>
      <form className="binding-form" onSubmit={event=>{event.preventDefault();void run(()=>request(`/api/teams/${teamId}/members`,"POST",{userId:selectedUserId,playerId:selectedPlayerId||null,roles:selectedRoles}),"Account, rollen en spelerskoppeling opgeslagen.")}}>
        <label>Geregistreerd account<select className="input" value={selectedUserId} onChange={event=>selectAccount(event.target.value)} required>{accounts.map(account=><option value={account.id} key={account.id}>{account.name} ({account.email})</option>)}</select></label>
        <label>Spelersprofiel (optioneel)<select className="input" value={selectedPlayerId} onChange={event=>setSelectedPlayerId(event.target.value)}><option value="">Niet aan een speler koppelen</option>{players.map(player=><option value={player.id} key={player.id}>{player.displayName}{player.userId&&player.userId!==selectedUserId?" · gekoppeld aan ander account":""}</option>)}</select></label>
        <fieldset><legend>Rollen</legend><div className="role-options">{roleOptions.map(([value,label])=><label key={value}><input type="checkbox" checked={selectedRoles.includes(value)} onChange={()=>toggleRole(value)}/>{label}</label>)}</div></fieldset>
        <button className="button" disabled={busy||!selectedUserId||!selectedRoles.length}>Account en rollen opslaan</button>
      </form>
    </section>

    <section className="card" style={{marginTop:18}}>
      <div className="card-head"><h2>Huidige teamleden</h2><span className="badge">{members.length}</span></div>
      {members.length?members.map(member=><div className="sync-item" key={member.userId}><div><strong>{member.name}</strong><div className="muted" style={{fontSize:12}}>{member.email}</div><div className="member-roles">{member.roles.map(role=><span className="badge" key={role}>{labels[role]}</span>)}</div></div><button className="button secondary" disabled={busy} onClick={()=>void run(()=>request(`/api/teams/${teamId}/members`,"DELETE",{userId:member.userId}),"Teamlid verwijderd.")}>Verwijderen</button></div>):<p className="muted">Er zijn nog geen accounts aan dit team gekoppeld.</p>}
    </section>

    <div className="profile-grid" style={{marginTop:18}}><section className="card"><h2>Speler toevoegen</h2><p className="muted">De naam op de spelerslijst wordt automatisch samengesteld. Daarna kun je hierboven een geregistreerd account eraan koppelen.</p><form className="form-stack" onSubmit={event=>{event.preventDefault();const form=new FormData(event.currentTarget);void run(()=>request(`/api/teams/${teamId}/players`,"POST",{firstName:String(form.get("firstName")),namePrefix:String(form.get("namePrefix"))||null,lastName:String(form.get("lastName")),shirtNumber:form.get("shirtNumber")?Number(form.get("shirtNumber")):null,position:String(form.get("position"))||null,active:true}),"Speler toegevoegd.")}}><div className="player-name-fields"><input className="input" name="firstName" aria-label="Voornaam" placeholder="Voornaam" required/><input className="input" name="namePrefix" aria-label="Tussenvoegsel" placeholder="Tussenvoegsel (optioneel)"/><input className="input" name="lastName" aria-label="Achternaam" placeholder="Achternaam" required/></div><input className="input" name="shirtNumber" type="number" min="0" max="999" placeholder="Rugnummer (optioneel)"/><input className="input" name="position" placeholder="Positie (optioneel)"/><button className="button" disabled={busy}>Speler toevoegen</button></form></section></div>
    {message&&<p className="card" role="status" style={{marginTop:18}}>{message}</p>}
  </>;
}
