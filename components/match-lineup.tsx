"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fieldPositions, formations, type Formation } from "@/lib/lineup";

type Player = { id: string; firstName: string; name: string; photoPath: string | null; status: string; eligible: boolean };

function avatarInitials(name: string) {
  return name
    .split(/\s+/)
    .map(part => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function MatchLineup({ matchId, teamId, canEdit, players, initialFormation, initialPositions }: {
  matchId: string; teamId: string; canEdit: boolean; players: Player[]; initialFormation: string; initialPositions: unknown;
}) {
  const router = useRouter();
  const [formation, setFormation] = useState<Formation>(Object.hasOwn(formations, initialFormation) ? initialFormation as Formation : "4-3-3");
  const [positions, setPositions] = useState<(string | null)[]>(Array.from({ length: 11 }, (_, i) => Array.isArray(initialPositions) && typeof initialPositions[i] === "string" ? initialPositions[i] : null));
  const [selected, setSelected] = useState<number | null>(null), [busy, setBusy] = useState(false), [message, setMessage] = useState(""), [dirty, setDirty] = useState(false);
  const spots = fieldPositions(formation);

  useEffect(() => {
    if (selected === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selected]);

  function statusLabel(player: Player) {
    if (player.status === "present") return "Aanwezig";
    if (player.status === "absent") return "Afwezig";
    return "";
  }

  async function save() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/matches/${matchId}/lineup`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ teamId, formation, positions }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? "Opslaan mislukt");
      setDirty(false); setMessage("Opstelling opgeslagen."); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Opslaan mislukt"); }
    finally { setBusy(false); }
  }
  function assign(playerId: string | null) {
    if (selected === null) return;
    setPositions(current => current.map((id, index) => index === selected ? playerId : id === playerId ? null : id));
    setDirty(true); setMessage(""); setSelected(null);
  }

  return <section className="card lineup-card">
    <div className="card-head"><h2>Opstelling</h2>{canEdit ? <label className="formation-picker"><span className="sr-only">Formatie</span><select value={formation} disabled={busy} onChange={event => { setFormation(event.target.value as Formation); setDirty(true); setMessage(""); setSelected(null); }}>{Object.keys(formations).map(value => <option key={value} value={value}>{value}</option>)}</select></label> : <span className="badge">{formation}</span>}</div>
    <div className="lineup-layout read-only">
      <div className="hockey-field" aria-label="Hockeyveld met opstelling">
        <svg className="pitch-markings" viewBox="0 0 550 914" preserveAspectRatio="none" aria-hidden="true"><rect x="8" y="8" width="534" height="898" /><path d="M8 457H542 M8 230H542 M8 684H542 M129 8V18 A146 146 0 0 0 421 18V8 M129 906V896 A146 146 0 0 1 421 896V906" /><path d="M244 8V2H306V8 M244 906V912H306V906" /><circle cx="275" cy="457" r="3" /></svg>
        {spots.map((spot, index) => {
          const player = players.find(item => item.id === positions[index]); return <button key={index} type="button" className={`lineup-position ${selected === index ? "selected" : ""}`} style={{ left: `${spot.x}%`, top: `${spot.y}%` }} disabled={!canEdit || busy} aria-label={`${spot.label}: ${player?.name ?? "Kies speler"}`} aria-pressed={selected === index} onClick={() => setSelected(index)}>
            <span className={`lineup-avatar ${index === 0 ? "goalkeeper" : ""}`}>{player?.photoPath ? <Image unoptimized src={player.photoPath} width={48} height={48} alt="" /> : player ? player.firstName[0] : "+"}</span><span className="lineup-name">{player?.firstName ?? (index === 0 ? "Keeper" : "Kies speler")}</span>
          </button>;
        })}
      </div>
    </div>
    {canEdit && <div className="lineup-actions"><button type="button" className="button" disabled={busy || !dirty} onClick={() => void save()}>{busy ? "Opslaan…" : "Opstelling opslaan"}</button>{dirty && <small className="muted">Niet-opgeslagen wijzigingen</small>}{message && <p role="status">{message}</p>}</div>}
    {canEdit && selected !== null && <div className="lineup-dialog-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setSelected(null); }}><section className="card lineup-dialog" role="dialog" aria-modal="true" aria-labelledby="lineup-dialog-title"><div className="card-head"><h3 id="lineup-dialog-title">{spots[selected].label}</h3><button className="icon-button" type="button" aria-label="Sluiten" onClick={() => setSelected(null)}>×</button></div><button className="button secondary" type="button" disabled={busy} onClick={() => assign(null)}>Positie leegmaken</button><div className="lineup-player-list">{players.filter(player => player.eligible).map(player => {
      const label = positions.includes(player.id) ? "Verplaatsen" : statusLabel(player); return <button className="lineup-player" key={player.id} type="button" disabled={busy} onClick={() => assign(player.id)}>
        {player.photoPath ? <Image unoptimized src={player.photoPath} width={52} height={52} className="player-photo image" alt={`Profielfoto van ${player.name}`} /> : <span className="player-photo">{avatarInitials(player.name)}</span>}<span>{player.name}{label && <small>{label}</small>}</span>
      </button>;
    })}</div></section></div>}
  </section>;
}
