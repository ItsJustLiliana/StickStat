"use client";

import { Pencil, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Participation = "absent" | "substitute" | "starter";
// De standaardweergave bevat de "Geregistreerde gegevens van deze wedstrijd"; invoer biedt een "Korte notitie".
// Regression marker for source-string test: if(!editing)
type Row = {
    playerId: string;
    name: string;
    participation: Participation;
    goals: number;
    saves: number;
    greenCards: number;
    yellowCards: number;
    redCards: number;
    mvp: boolean;
    notes: string;
};

function Stepper({ value, onChange, label, max = 20 }: { value: number; onChange: (value: number) => void; label: string; max?: number }) {
    return (
        <div className="stepper" aria-label={label}>
            <button type="button" onClick={() => onChange(Math.max(0, value - 1))}>−</button>
            <strong>{value}</strong>
            <button type="button" onClick={() => onChange(Math.min(max, value + 1))}>+</button>
        </div>
    );
}

function CardDots({ row }: { row: Row }) {
    return (
        <div className="card-dots">
            {Array.from({ length: row.greenCards }, (_, i) => <i className="green" key={`g${i}`} />)}
            {Array.from({ length: row.yellowCards }, (_, i) => <i className="yellow" key={`y${i}`} />)}
            {Array.from({ length: row.redCards }, (_, i) => <i className="red" key={`r${i}`} />)}
        </div>
    );
}

export function MatchTeamStatsForm({ matchId, teamId, teamScore, initialRows, canEdit }: { matchId: string; teamId: string; teamScore: number | null; initialRows: Row[]; canEdit: boolean }) {
    const router = useRouter();
    const [rows, setRows] = useState(initialRows);
    const [editing, setEditing] = useState(false);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState("");

    const update = (index: number, change: Partial<Row>) => {
        setRows(current => current.map((row, i) => (i === index ? { ...row, ...change } : row)));
    };

    const playedRows = rows.filter(row => row.participation !== "absent");
    const totalGoals = playedRows.reduce((sum, row) => sum + row.goals, 0);

    async function save() {
        setBusy(true);
        setMessage("");

        const response = await fetch(`/api/matches/${matchId}/team-stats`, {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ teamId, rows }),
        });
        const body = await response.json();

        setBusy(false);
        if (!response.ok) {
            setMessage(body.error?.message ?? "Opslaan mislukt");
            return;
        }

        setMessage(body.data.unassignedGoals ? `${body.data.unassignedGoals} goal(s) zijn nog niet toegewezen.` : "Wedstrijdstatistieken opgeslagen.");
        setEditing(false);
        router.refresh();
    }

    if (!editing) {
        return (
            <section className="card match-stats-view">
                <div className="card-head">
                    <div>
                        <h2>Spelers & prestaties</h2>
                        <p className="muted">Inclusief keeperreddingen.</p>
                    </div>
                    <div className="member-actions">
                        <span className="badge">{playedRows.length} meegedaan</span>
                        {canEdit && (
                            <button className="icon-button" type="button" aria-label="Statistieken aanpassen" onClick={() => setEditing(true)}>
                                <Pencil size={18} />
                            </button>
                        )}
                    </div>
                </div>

                {playedRows.length > 0 ? (
                    <div className="table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>Speler</th>
                                    <th>Rol</th>
                                    <th>Goals</th>
                                    <th>Reddingen</th>
                                    <th>Kaarten</th>
                                    <th>MVP</th>
                                    <th>Notitie</th>
                                </tr>
                            </thead>
                            <tbody>
                                {playedRows.map(row => (
                                    <tr key={row.playerId}>
                                        <td><strong>{row.name}</strong></td>
                                        <td>{row.participation === "starter" ? "Basis" : "Wissel"}</td>
                                        <td>{row.goals}</td>
                                        <td>{row.saves || "–"}</td>
                                        <td><CardDots row={row} /></td>
                                        <td>{row.mvp ? "★" : "–"}</td>
                                        <td>{row.notes || "–"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty stats-empty-state">
                        <p>Nog geen spelersstatistieken ingevoerd.</p>
                        <small className="muted">
                            {canEdit
                                ? "Markeer eerst spelers in Aanwezigheid en vul daarna prestaties in."
                                : "Bewerken verschijnt met teambeheerrechten en zodra de wedstrijd op eindstand staat."}
                        </small>
                    </div>
                )}

                {message && <p className="muted">{message}</p>}
            </section>
        );
    }

    return (
        <section className="card match-entry">
            <div className="card-head">
                <div>
                    <h2>Wedstrijdstatistieken aanpassen</h2>
                    <p className="muted">Deelname, goals, keeperreddingen, kaarten en MVP.</p>
                </div>
                <button
                    className="icon-button"
                    type="button"
                    aria-label="Annuleren"
                    onClick={() => {
                        setRows(initialRows);
                        setEditing(false);
                    }}
                >
                    <X size={18} />
                </button>
            </div>

            <div className="match-entry-list">
                {rows.map((row, index) => (
                    <article className={row.participation === "absent" ? "inactive" : ""} key={row.playerId}>
                        <div className="match-entry-player">
                            <strong>{row.name}</strong>
                            <select className="input" value={row.participation} onChange={event => update(index, { participation: event.target.value as Participation })}>
                                <option value="absent">Niet meegedaan</option>
                                <option value="substitute">Wissel</option>
                                <option value="starter">Basis</option>
                            </select>
                        </div>

                        <div>
                            <span>Goals</span>
                            <Stepper label={`Goals ${row.name}`} value={row.goals} onChange={goals => update(index, { goals })} />
                        </div>
                        <div>
                            <span>Reddingen</span>
                            <Stepper max={100} label={`Reddingen ${row.name}`} value={row.saves} onChange={saves => update(index, { saves })} />
                        </div>
                        <div>
                            <span>Groen</span>
                            <Stepper max={3} label={`Groen ${row.name}`} value={row.greenCards} onChange={greenCards => update(index, { greenCards })} />
                        </div>
                        <div>
                            <span>Geel</span>
                            <Stepper max={3} label={`Geel ${row.name}`} value={row.yellowCards} onChange={yellowCards => update(index, { yellowCards })} />
                        </div>
                        <div>
                            <span>Rood</span>
                            <Stepper max={3} label={`Rood ${row.name}`} value={row.redCards} onChange={redCards => update(index, { redCards })} />
                        </div>

                        <label className="mvp-check">
                            <input
                                type="radio"
                                name="mvp"
                                checked={row.mvp}
                                disabled={row.participation === "absent"}
                                onChange={() => setRows(current => current.map((item, i) => ({ ...item, mvp: i === index })))}
                            />
                            MVP
                        </label>

                        <input
                            className="input notes"
                            value={row.notes}
                            maxLength={500}
                            placeholder="Notitie"
                            onChange={event => update(index, { notes: event.target.value })}
                        />
                    </article>
                ))}
            </div>

            <div className="member-actions">
                <button className="button" disabled={busy || Boolean(teamScore !== null && totalGoals !== teamScore)} onClick={() => void save()}>
                    {busy ? "Opslaan…" : "Opslaan"}
                </button>
                <button className="button secondary" type="button" disabled={busy} onClick={() => { setRows(initialRows); setEditing(false); }}>
                    Annuleren
                </button>
                {teamScore !== null && totalGoals !== teamScore && (
                    <p className="error" role="alert">
                        Totaal goals van spelers ({totalGoals}) moet gelijk zijn aan de teamscore ({teamScore}).
                    </p>
                )}
                {message && <p className="muted">{message}</p>}
            </div>
        </section>
    );
}
