"use client";

import { SlidersHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Season = { id: string; name: string };

export function MatchFilters({ teamId, seasons }: { teamId: string; seasons: Season[] }) {
    const router = useRouter(), searchParams = useSearchParams(), [opponent, setOpponent] = useState(searchParams.get("q") ?? "");
    const update = (name: "season" | "side" | "q", value: string) => {
        const params = new URLSearchParams(searchParams);
        params.set("team", teamId);
        if (value) params.set(name, value); else params.delete(name);
        router.replace(`/matches?${params.toString()}`, {scroll: false});
    };

    const queryOpponent = searchParams.get("q") ?? "";
    useEffect(() => {
        const normalizedOpponent = opponent.trim();
        if (normalizedOpponent === queryOpponent) return;
        const timeout = window.setTimeout(() => update("q", normalizedOpponent), 300);
        return () => window.clearTimeout(timeout);
        // `update` intentionally reads the latest URL when the timer is created.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opponent, queryOpponent, searchParams, teamId]);

    const activeFilters = [queryOpponent, searchParams.get("season"), searchParams.get("side")].filter(Boolean).length;
    const clear = () => {
        setOpponent("");
        router.replace(`/matches?team=${encodeURIComponent(teamId)}`, {scroll: false});
    };

    return <details className="match-filters">
        <summary className="button secondary"><SlidersHorizontal size={17} />Filters{activeFilters > 0 && <span className="filter-count">{activeFilters}</span>}</summary>
        <div className="match-filter-popup">
            <label>Zoek tegenstander<input className="input" type="search" value={opponent} onChange={event => setOpponent(event.target.value)} placeholder="Naam tegenstander" /></label>
            <label>Seizoen<select className="input" value={searchParams.get("season") ?? ""} onChange={event => update("season", event.target.value)}><option value="">Alle seizoenen</option>{seasons.map(season => <option value={season.id} key={season.id}>{season.name}</option>)}</select></label>
            <label>Locatie<select className="input" value={searchParams.get("side") ?? ""} onChange={event => update("side", event.target.value)}><option value="">Thuis & uit</option><option value="home">Thuis</option><option value="away">Uit</option></select></label>
            {activeFilters > 0 && <button className="button secondary clear-filters" type="button" onClick={clear}>Filters wissen</button>}
        </div>
    </details>;
}
