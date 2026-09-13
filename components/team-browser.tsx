"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SavedClub = { id: string; name: string };
type CatalogClub = { provider: "hockeystanden" | "hockey-belgium"; id: string; name: string; location?: string };

export function TeamBrowser({ clubs }: { clubs: SavedClub[] }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CatalogClub[]>([]);
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

  return <section className="card club-browser-card"><div className="card-head"><div><span className="eyebrow">Nederland & België</span><h2>Zoek een club of team</h2></div></div><p className="muted">Kies een club en open daarna een team. Vanuit het team kun je je aanmelden volgens de normale StickStat-structuur.</p><input className="input" value={query} onChange={event => { setQuery(event.target.value); setResults([]); }} placeholder="Bijvoorbeeld Rapide, Braxgata of Amsterdam" aria-label="Club of team zoeken" autoComplete="off" />
    {busy && <p className="muted" role="status">Zoeken…</p>}
    {results.length > 0 && <div className="club-search-results">{results.map(club => <Link className="club-search-result" href={`/clubs/catalog/${club.provider}/${encodeURIComponent(club.id)}?name=${encodeURIComponent(club.name)}`} key={`${club.provider}-${club.id}`}><strong>{club.name}</strong><span>{club.provider === "hockeystanden" ? "Nederland" : "België"}{club.location ? ` · ${club.location}` : ""} · Bekijk teams →</span></Link>)}</div>}
    {query.trim().length >= 2 && !busy && !results.length && !message && <div className="empty">Geen clubs gevonden.</div>}
    {message && <p className="form-message" role="status">{message}</p>}
    {clubs.length > 0 && <div className="saved-clubs"><span className="eyebrow">Al toegevoegd</span>{clubs.map(club => <Link className="club-search-result" href={`/clubs/${club.id}`} key={club.id}>{club.name}<span>Bekijk teams →</span></Link>)}</div>}
  </section>;
}
