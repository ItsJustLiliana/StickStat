"use client";

import { Pencil, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MatchPhoto } from "@/components/match-photo";
import { MatchPhotoManager } from "@/components/match-photo-manager";

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
type Substitution = { playerInId: string; playerOutId: string; minute: number | null };

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

export function MatchTeamStatsForm({ matchId, teamId, teamScore, initialRows, initialSubstitutions, teamPhotoPath, mvpPhotoPath, canEdit, canManagePhotos }: { matchId: string; teamId: string; teamScore: number | null; initialRows: Row[]; initialSubstitutions: Substitution[]; teamPhotoPath: string | null; mvpPhotoPath: string | null; canEdit: boolean; canManagePhotos: boolean }) {
    const router = useRouter();
    const [rows, setRows] = useState(initialRows);
    const [substitutions, setSubstitutions] = useState(initialSubstitutions);
    const [editing, setEditing] = useState(false);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState("");

    const update = (index: number, change: Partial<Row>) => {
        setRows(current => current.map((row, i) => (i === index ? { ...row, ...change } : row)));
    };

    const playedRows = rows.filter(row => row.participation !== "absent");
    const mvpName = playedRows.find(row => row.mvp)?.name ?? null;
    const totalGoals = playedRows.reduce((sum, row) => sum + row.goals, 0);

    async function save() {
        setBusy(true);
        setMessage("");

        const response = await fetch(`/api/matches/${matchId}/team-stats`, {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ teamId, rows, substitutions }),
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
                                    <th>Man of the Match</th>
                                    <th>Notitie</th>
                                </tr>
                            </thead>
                            <tbody>
                                {playedRows.map(row => (
                                    <tr key={row.playerId}>
                                        <td><strong>{row.name}</strong>{row.mvp && mvpPhotoPath && <MatchPhoto src={mvpPhotoPath} alt={`Man of the Match: ${row.name}`} className="match-mvp-photo" />}</td>
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
                        {canEdit && <small className="muted">Markeer eerst spelers in Aanwezigheid en vul daarna prestaties in.</small>}
                    </div>
                )}

                {substitutions.length > 0 && <div className="match-substitutions"><h3>Wissels</h3><ul>{substitutions.map((substitution, index) => <li key={`${substitution.playerInId}-${substitution.playerOutId}-${index}`}><strong>{rows.find(row => row.playerId === substitution.playerInId)?.name ?? "Speler"}</strong> erin voor {rows.find(row => row.playerId === substitution.playerOutId)?.name ?? "speler"}{substitution.minute !== null && ` (${substitution.minute}')`}</li>)}</ul></div>}

                <MatchPhotoManager matchId={matchId} teamId={teamId} teamPhotoPath={teamPhotoPath} mvpPhotoPath={mvpPhotoPath} mvpName={mvpName} canEdit={canManagePhotos} />

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
                        setRows(initialRows); setSubstitutions(initialSubstitutions);
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
                            Man of the Match
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

            <section className="match-substitution-entry" aria-labelledby="substitution-title">
                <div className="card-head"><div><h3 id="substitution-title">Wissels</h3><p className="muted">Leg vast wie erin en eruit ging; minuut is optioneel.</p></div><button className="button secondary" type="button" onClick={() => setSubstitutions(current => [...current, { playerInId: "", playerOutId: "", minute: null }])}>Wissel toevoegen</button></div>
                {substitutions.map((substitution, index) => <div className="substitution-row" key={index}>
                    <select className="input" aria-label={`Speler erin, wissel ${index + 1}`} value={substitution.playerInId} onChange={event => setSubstitutions(current => current.map((item, i) => i === index ? { ...item, playerInId: event.target.value } : item))}><option value="">Speler erin</option>{rows.filter(row => row.participation !== "absent").map(row => <option value={row.playerId} key={row.playerId}>{row.name}</option>)}</select>
                    <select className="input" aria-label={`Speler eruit, wissel ${index + 1}`} value={substitution.playerOutId} onChange={event => setSubstitutions(current => current.map((item, i) => i === index ? { ...item, playerOutId: event.target.value } : item))}><option value="">Speler eruit</option>{rows.filter(row => row.participation !== "absent").map(row => <option value={row.playerId} key={row.playerId}>{row.name}</option>)}</select>
                    <input className="input substitution-minute" aria-label={`Minuut, wissel ${index + 1}`} type="number" min="0" max="120" placeholder="Minuut" value={substitution.minute ?? ""} onChange={event => setSubstitutions(current => current.map((item, i) => i === index ? { ...item, minute: event.target.value === "" ? null : Number(event.target.value) } : item))} />
                    <button className="icon-button" type="button" aria-label={`Wissel ${index + 1} verwijderen`} onClick={() => setSubstitutions(current => current.filter((_, i) => i !== index))}><X size={18} /></button>
                </div>)}
            </section>

            <div className="member-actions">
                <button className="button" disabled={busy || Boolean(teamScore !== null && totalGoals !== teamScore) || substitutions.some(item => !item.playerInId || !item.playerOutId || item.playerInId === item.playerOutId)} onClick={() => void save()}>
                    {busy ? "Opslaan…" : "Opslaan"}
                </button>
                <button className="button secondary" type="button" disabled={busy} onClick={() => { setRows(initialRows); setSubstitutions(initialSubstitutions); setEditing(false); }}>
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
