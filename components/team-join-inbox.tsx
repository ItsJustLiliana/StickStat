"use client";

import {useRouter} from "next/navigation";
import {useState} from "react";

type Request = {id:string; name:string; username:string; createdAt:string};
type Player = {id:string; name:string; linked:boolean};

export function TeamJoinInbox({teamId, requests, players}:{teamId:string; requests:Request[]; players:Player[]}) {
  const router = useRouter(), [busyId, setBusyId] = useState<string | null>(null), [message, setMessage] = useState("");
  async function decide(requestId:string, action:"approve" | "decline", form?:HTMLFormElement) {
    setBusyId(requestId); setMessage("");
    const playerId = form ? String(new FormData(form).get("playerId") || "") : "";
    const response = await fetch(`/api/teams/${teamId}/join-requests/${requestId}`, {method:"PATCH", headers:{"content-type":"application/json"}, body:JSON.stringify({action, playerId:playerId || null})}), body = await response.json();
    setBusyId(null);
    if (!response.ok) { setMessage(body.error?.message ?? "Aanmelding verwerken mislukt"); return; }
    router.refresh();
  }
  if (!requests.length) return <div className="empty">Geen openstaande aanmeldingen.</div>;
  return <div className="team-join-inbox">{requests.map(request => <form className="team-join-request" key={request.id} onSubmit={event => { event.preventDefault(); void decide(request.id, "approve", event.currentTarget); }}><div><strong>{request.name}</strong><span>@{request.username}</span><small>Aangemeld op {new Date(request.createdAt).toLocaleDateString("nl-NL")}</small></div><label><span>Koppel aan speler (optioneel)</span><select className="input" name="playerId" defaultValue=""><option value="">Nog niet koppelen</option>{players.map(player => <option value={player.id} disabled={player.linked} key={player.id}>{player.name}{player.linked ? " · al gekoppeld" : ""}</option>)}</select></label><div className="member-actions"><button className="button" disabled={busyId === request.id}>{busyId === request.id ? "Bezig…" : "Toelaten"}</button><button className="button secondary" type="button" disabled={busyId === request.id} onClick={() => void decide(request.id, "decline")}>Afwijzen</button></div></form>)}{message && <p className="form-message" role="alert">{message}</p>}</div>;
}
