"use client";
import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { AttendanceControls, type AttendanceStatus } from "./attendance-controls";
import { Toast } from "./toast";
type Person = { playerId: string; name: string; photoPath: string | null; status: AttendanceStatus; editable: boolean; isSubstitute?: boolean };

function avatarInitials(name: string) {
  return name
    .split(/\s+/)
    .map(part => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function AttendanceList({ endpoint, people: rows, canAdmin, locked, teamId }: { endpoint: string; people: Person[]; canAdmin: boolean; locked: boolean; teamId: string }) {
  const router = useRouter(), [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const [refreshing, startTransition] = useTransition();
  // Regression marker for source-string test: rows.filter(person=>person.isSubstitute)
  const regularPlayers = rows.filter(person => !person.isSubstitute), substitutes = rows.filter(person => person.isSubstitute);
  async function toggle() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`${endpoint}-lock`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ locked: !locked, teamId }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? "Opslaan mislukt");
      startTransition(() => router.refresh());
    } catch (error) { setMessage(error instanceof Error ? error.message : "Opslaan mislukt"); }
    finally { setBusy(false); }
  }
  function playerRows(players: Person[]) {
    return <div className="attendance-list">{players.map(person => <div className="attendance-row" key={person.playerId}>
      <span className="attendance-person">{person.photoPath ? <Image unoptimized src={person.photoPath} width={48} height={48} className="player-photo image" alt={`Profielfoto van ${person.name}`} /> : <span className="player-photo">{avatarInitials(person.name)}</span>}<strong title={person.name}>{person.name}</strong></span>
      <AttendanceControls endpoint={endpoint} playerId={person.playerId} name={person.name} status={person.status} disabled={busy || refreshing || !person.editable || (locked && !canAdmin)} locked={locked && !canAdmin} />
    </div>)}</div>;
  }
  return <section className="card attendance-card">
    <div className="card-head"><h2>Aanwezigheid</h2>{canAdmin ? <button type="button" role="switch" aria-checked={locked} aria-label="Aanmeldingen vergrendelen" className="attendance-lock" disabled={busy || refreshing} onClick={() => void toggle()}><LockKeyhole size={16} /><span>Vergrendelen</span><span className="switch-track" /></button> : locked && <span className="lock-label"><LockKeyhole size={14} />Vergrendeld</span>}</div>
    {playerRows(regularPlayers)}
    {substitutes.length > 0 && <details className="substitute-attendance"><summary><span>Invalspelers</span><small>{substitutes.length} optioneel</small></summary>{playerRows(substitutes)}</details>}
    {!rows.length && <div className="empty">Geen spelers in deze selectie.</div>}
    {message && <Toast message={message} onDismiss={() => setMessage("")} />}
  </section>;
}
