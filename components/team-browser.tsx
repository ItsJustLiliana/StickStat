"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type SavedClub = { id: string; name: string };
type CatalogClub = { provider: "hockeystanden" | "hockey-belgium"; id: string; name: string; location?: string };
type CatalogTeam = CatalogClub & { name: string; shortName: string; identifier: string; clubId: string; clubName: string };

export function TeamBrowser({ clubs }: { clubs: SavedClub[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CatalogClub[]>([]);
  const [selectedClub, setSelectedClub] = useState<CatalogClub | null>(null);
  const [teams, setTeams] = useState<CatalogTeam[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setBusy(true); setMessage("");
      try {
        const response = await fetch(`/api/catalog/search?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error?.message ?? "Zoeken mislukt");
        setResults(body.data ?? []);
      } catch (error) { if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : "Zoeken mislukt"); }
      finally { if (!controller.signal.aborted) setBusy(false); }
    }, 300);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [query]);

  async function chooseClub(club: CatalogClub) {
    setSelectedClub(club); setTeams([]); setBusy(true); setMessage("");
    try {
      const params = new URLSearchParams({ provider: club.provider, clubId: club.id, clubName: club.name });
      const response = await fetch(`/api/catalog/teams?${params}`), body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? "Teams ophalen mislukt");
      setTeams(body.data ?? []);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Teams ophalen mislukt"); }
    finally { setBusy(false); }
  }

  async function follow(team: CatalogTeam) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/catalog/follow", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(team) }), body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? "Team toevoegen mislukt");
      router.push(`/standings?team=${body.data.teamId}`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Team toevoegen mislukt"); }
    finally { setBusy(false); }
  }

  return <section className="card club-browser-card"><div className="card-head"><div><span className="eyebrow">Nederland & België</span><h2>Zoek een club of team</h2></div></div><p className="muted">Een gevolgd team wordt automatisch aan jouw overzicht en de synchronisatie toegevoegd.</p><input className="input" value={query} onChange={event => { setQuery(event.target.value); setResults([]); setSelectedClub(null); setTeams([]); }} placeholder="Bijvoorbeeld Rapide, Braxgata of Amsterdam" aria-label="Club of team zoeken" autoComplete="off" />
    {busy && <p className="muted" role="status">Zoeken…</p>}
    {!selectedClub && results.length > 0 && <div className="club-search-results">{results.map(club => <button className="club-search-result" type="button" onClick={() => void chooseClub(club)} key={`${club.provider}-${club.id}`}><strong>{club.name}</strong><span>{club.provider === "hockeystanden" ? "Nederland" : "België"}{club.location ? ` · ${club.location}` : ""} · Bekijk teams →</span></button>)}</div>}
    {selectedClub && !busy && <div className="catalog-team-results"><div className="card-head"><div><span className="eyebrow">{selectedClub.provider === "hockeystanden" ? "Nederland" : "België"}</span><h3>{selectedClub.name}</h3></div><button className="button secondary compact-button" type="button" onClick={() => { setSelectedClub(null); setTeams([]); }}>Andere club</button></div>{teams.map(team => <div className="catalog-team-row" key={team.identifier}><strong>{team.name}</strong><button className="button secondary compact-button" type="button" disabled={busy} onClick={() => void follow(team)}>Volgen</button></div>)}{!teams.length && <div className="empty">Geen actuele teams gevonden voor deze club.</div>}</div>}
    {query.trim().length >= 2 && !busy && !selectedClub && !results.length && !message && <div className="empty">Geen clubs gevonden.</div>}
    {message && <p className="form-message" role="status">{message}</p>}
    {clubs.length > 0 && <div className="saved-clubs"><span className="eyebrow">Al toegevoegd</span>{clubs.map(club => <Link className="club-search-result" href={`/clubs/${club.id}`} key={club.id}>{club.name}<span>Bekijk teams →</span></Link>)}</div>}
  </section>;
}
