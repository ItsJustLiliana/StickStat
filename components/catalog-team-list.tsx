"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Team = { provider: "hockeystanden" | "hockey-belgium"; clubId: string; clubName: string; name: string; shortName: string; identifier: string };

export function CatalogTeamList({ teams }: { teams: Team[] }) {
  const router = useRouter(), [busy, setBusy] = useState<string | null>(null), [message, setMessage] = useState("");
  async function follow(team: Team) {
    setBusy(team.identifier); setMessage("");
    try {
      const response = await fetch("/api/catalog/follow", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(team) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? "Team toevoegen mislukt");
      router.push(`/standings?team=${body.data.teamId}`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Team toevoegen mislukt"); }
    finally { setBusy(null); }
  }
  return <section className="card club-team-list"><div className="card-head"><div><span className="eyebrow">Team selecteren</span><h2>Teams</h2><p className="muted">Open een team om de stand te bekijken of je aan te melden.</p></div></div>{teams.map(team => <article className="catalog-team-row" key={team.identifier}><strong>{team.name}</strong><button className="button secondary compact-button" type="button" disabled={busy !== null} onClick={() => void follow(team)}>{busy === team.identifier ? "Openen…" : "Openen"}</button></article>)}{!teams.length && <div className="empty">Geen actuele teams gevonden voor deze club.</div>}{message && <p className="form-message" role="status">{message}</p>}</section>;
}
