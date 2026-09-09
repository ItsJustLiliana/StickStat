"use client";

import Link from "next/link";
import {useRouter} from "next/navigation";
import {useMemo, useState} from "react";

type Club = {id:string; name:string; teams:{id:string; name:string}[]};

export function RegisterForm({inviteToken, teamName, clubs = []}:{inviteToken?:string; teamName?:string; clubs?:Club[]}) {
  const [error, setError] = useState(""), [loading, setLoading] = useState(false), [clubId, setClubId] = useState(""), router = useRouter();
  const teams = useMemo(() => clubs.find(club => club.id === clubId)?.teams ?? [], [clubs, clubId]);

  async function submit(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const form = new FormData(event.currentTarget), response = await fetch("/api/auth/register", {method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({name:form.get("name"), username:form.get("username"), password:form.get("password"), confirmPassword:form.get("confirmPassword"), clubId:form.get("clubId") || undefined, teamId:form.get("teamId") || undefined, inviteToken})}), body = await response.json();
    setLoading(false);
    if (!response.ok) return setError(body.error?.message ?? "Registreren mislukt");
    router.replace("/dashboard");
  }

  return <form className="login-form" onSubmit={submit}>
    <span className="eyebrow">{teamName ? `Uitnodiging voor ${teamName}` : "Nieuw bij StickStat"}</span><h2 style={{fontSize:36, margin:"9px 0 5px"}}>Maak je account</h2>
    <p className="muted">{teamName ? "Na registratie word je direct aan het team toegevoegd." : "Kies je club en team. De teambeheerder krijgt daarna een aanmelding om goed te keuren."}</p>
    <label htmlFor="name">Jouw naam</label><input className="input" id="name" name="name" autoComplete="name" required minLength={2}/><small className="muted">Gebruik je eigen voor- en achternaam, zodat de teambeheerder weet wie je bent.</small>
    {!inviteToken && <><label htmlFor="clubId">Club</label><select className="input" id="clubId" name="clubId" value={clubId} onChange={event => setClubId(event.target.value)} required><option value="">Kies je club</option>{clubs.map(club => <option key={club.id} value={club.id}>{club.name}</option>)}</select><label htmlFor="teamId">Team</label><select className="input" id="teamId" name="teamId" defaultValue="" disabled={!clubId} required><option value="">{clubId ? "Kies je team" : "Kies eerst je club"}</option>{teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}</select></>}
    <label htmlFor="username">Gebruikersnaam</label><input className="input" id="username" name="username" autoComplete="username" required minLength={3} maxLength={32} pattern="[A-Za-z0-9_.-]+"/><small className="muted">Letters, cijfers, punt, streepje en underscore.</small>
    <label htmlFor="password">Wachtwoord</label><input className="input" id="password" name="password" type="password" autoComplete="new-password" minLength={12} required/><small className="muted">Minimaal 12 tekens, met hoofdletter, kleine letter en cijfer.</small>
    <label htmlFor="confirmPassword">Herhaal wachtwoord</label><input className="input" id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={12} required/>
    {error && <div className="error" role="alert">{error}</div>}<button className="button" disabled={loading}>{loading ? "Account maken…" : "Account maken"}</button><p className="muted" style={{textAlign:"center", marginTop:18}}>Al een account? <Link className="link" href={inviteToken ? `/login?next=${encodeURIComponent(`/join/${inviteToken}`)}` : "/login"}>Log in</Link></p>
  </form>;
}
