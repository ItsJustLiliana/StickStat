"use client";
import {useRouter} from "next/navigation";
import {useState} from "react";

async function send(url:string,method:string,data:Record<string,string>){
  const response=await fetch(url,{method,headers:{"content-type":"application/json"},body:JSON.stringify(data)}),body=await response.json();
  if(!response.ok)throw new Error(body.error?.message??"Opslaan mislukt");
}

export function ProfileForms({name,email,lockedName}:{name:string;email:string;lockedName:boolean}){
  const router=useRouter(),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
  async function run(action:()=>Promise<void>,success:string){setBusy(true);setMessage("");try{await action();setMessage(success);router.refresh()}catch(error){setMessage(error instanceof Error?error.message:"Opslaan mislukt")}finally{setBusy(false)}}
  async function changePassword(event:React.FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setMessage("");const form=new FormData(event.currentTarget);try{await send("/api/profile/password","POST",{currentPassword:String(form.get("currentPassword")),newPassword:String(form.get("newPassword")),confirmPassword:String(form.get("confirmPassword"))});router.replace("/login");router.refresh()}catch(error){setMessage(error instanceof Error?error.message:"Opslaan mislukt");setBusy(false)}}
  return <><div className="profile-grid"><section className="card"><h2>Profielgegevens</h2>{lockedName&&<p className="muted">Je naam komt uit je gekoppelde spelersprofiel en kan hier niet worden gewijzigd.</p>}<form className="form-stack" onSubmit={event=>{event.preventDefault();const form=new FormData(event.currentTarget);void run(()=>send("/api/profile","PATCH",{name:String(form.get("name")),email:String(form.get("email"))}),"Profiel opgeslagen.")}}><label>Naam</label><input className="input" name="name" defaultValue={name} disabled={lockedName}/>{lockedName&&<input type="hidden" name="name" value={name}/>}<label>E-mailadres</label><input className="input" name="email" type="email" defaultValue={email} required/><button className="button" disabled={busy}>Profiel opslaan</button></form></section><section className="card"><h2>Wachtwoord wijzigen</h2><form className="form-stack" onSubmit={changePassword}><label>Huidig wachtwoord</label><input className="input" name="currentPassword" type="password" autoComplete="current-password" required minLength={8}/><label>Nieuw wachtwoord</label><input className="input" name="newPassword" type="password" autoComplete="new-password" required minLength={12}/><small className="muted">Minimaal 12 tekens, met hoofdletter, kleine letter en cijfer.</small><label>Herhaal nieuw wachtwoord</label><input className="input" name="confirmPassword" type="password" autoComplete="new-password" required minLength={12}/><button className="button" disabled={busy}>Wachtwoord wijzigen</button></form></section></div>{message&&<p className="card" role="status" style={{marginTop:18}}>{message}</p>}</>;
}
