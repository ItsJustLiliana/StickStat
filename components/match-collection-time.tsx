"use client";

import {Check, Pencil, X} from "lucide-react";
import {useState, useTransition} from "react";
import {useRouter} from "next/navigation";

export function MatchCollectionTime({matchId, teamId, canEdit, initialTime}: {matchId: string; teamId: string; canEdit: boolean; initialTime: string | null}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false), [time, setTime] = useState(initialTime ?? ""), [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  function close() { setTime(initialTime ?? ""); setMessage(""); setEditing(false); }
  function save() {
    setMessage("");
    startTransition(async () => {
      try {
        const response = await fetch(`/api/matches/${matchId}/collection-time`, {method: "PUT", headers: {"content-type": "application/json"}, body: JSON.stringify({teamId, collectionTime: time || null})});
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message ?? "Opslaan mislukt");
        setEditing(false); router.refresh();
      } catch (error) { setMessage(error instanceof Error ? error.message : "Opslaan mislukt"); }
    });
  }
  if (editing) return <span className="collection-time-editor"><span>Verzamelen</span><input aria-label="Verzameltijd op de club" type="time" value={time} disabled={pending} onChange={event => setTime(event.target.value)} /><button type="button" className="icon-button" aria-label="Verzameltijd opslaan" disabled={pending} onClick={save}><Check size={15}/></button><button type="button" className="icon-button" aria-label="Annuleren" disabled={pending} onClick={close}><X size={15}/></button>{message && <small role="alert">{message}</small>}</span>;
  return <span className="collection-time"><span>Verzamelen club: {initialTime ?? "nog niet bekend"}</span>{canEdit && <button type="button" className="icon-button" aria-label="Verzameltijd bewerken" title="Verzameltijd bewerken" onClick={() => setEditing(true)}><Pencil size={15}/></button>}</span>;
}
