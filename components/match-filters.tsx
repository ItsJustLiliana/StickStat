"use client";

import { SlidersHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type Season = { id: string; name: string };

export function MatchFilters({ teamId, seasons }: { teamId: string; seasons: Season[] }) {
    const router = useRouter(), searchParams = useSearchParams(), [opponent, setOpponent] = useState(searchParams.get("q") ?? "");
    const update = (name: "season" | "side" | "q", value: string) => {
        const params = new URLSearchParams(searchParams);
        params.set("team", teamId);
        if (value) params.set(name, value); else params.delete(name);
        router.replace(`/matches?${params.toString()}`);
    };
    return <details className="match-filters">
        <summary className="button secondary"><SlidersHorizontal size={17} />Filters</summary>
        <div className="match-filter-popup">
            <label>Zoek tegenstander<input className="input" value={opponent} onChange={event => { const value = event.target.value; setOpponent(value); update("q", value) }} placeholder="Naam tegenstander" /></label>
            <label>Seizoen<select className="input" value={searchParams.get("season") ?? ""} onChange={event => update("season", event.target.value)}><option value="">Alle seizoenen</option>{seasons.map(season => <option value={season.id} key={season.id}>{season.name}</option>)}</select></label>
            <label>Locatie<select className="input" value={searchParams.get("side") ?? ""} onChange={event => update("side", event.target.value)}><option value="">Thuis & uit</option><option value="home">Thuis</option><option value="away">Uit</option></select></label>
        </div>
    </details>;
}