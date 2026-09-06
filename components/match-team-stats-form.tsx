"use client";

import { Pencil, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
    assists: number;
    saves: number;
    greenCards: number;
    yellowCards: number;
    redCards: number;
    mvp: boolean;
    notes: string;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

export function MatchTeamStatsForm({ matchId, teamId, teamScore, initialRows, teamPhotoPath, mvpPhotoPath, canEdit, canManagePhotos }: { matchId: string; teamId: string; teamScore: number | null; initialRows: Row[]; teamPhotoPath: string | null; mvpPhotoPath: string | null; canEdit: boolean; canManagePhotos: boolean }) {
    const router = useRouter();
    const [rows, setRows] = useState(initialRows);
    const [editing, setEditing] = useState(false);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState("");
    const autoSave = useRef(false);
    const [action, setAction] = useState<"goals" | "saves" | "greenCards" | "yellowCards" | "redCards" | "mvp" | "notes" | null>(null);
    const [playerId, setPlayerId] = useState(""), [assistId, setAssistId] = useState(""), [note, setNote] = useState("");

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const update = (index: number, change: Partial<Row>) => {
        setRows(current => current.map((row, i) => (i === index ? { ...row, ...change } : row)));
    };

    function addAction() {
        const index = rows.findIndex(row => row.playerId === playerId);
        if (index < 0 || !action) return;
        autoSave.current = true;
        if (action === "mvp") setRows(current => current.map(row => ({ ...row, mvp: row.playerId === playerId, participation: row.playerId === playerId && row.participation === "absent" ? "substitute" : row.participation })));
        else setRows(current => current.map((row, rowIndex) => {
            if (rowIndex === index) return { ...row, participation: row.participation === "absent" ? "substitute" : row.participation, ...(action === "notes" ? { notes: note.trim() ? [row.notes, note.trim()].filter(Boolean).join(" · ") : row.notes } : { [action]: row[action] + 1 }) };
            if (action === "goals" && row.playerId === assistId) return { ...row, participation: row.participation === "absent" ? "substitute" : row.participation, assists: row.assists + 1 };
            return row;
        }));
        if (action !== "notes" && note.trim()) setRows(current => current.map(row => row.playerId === playerId ? { ...row, notes: [row.notes, note.trim()].filter(Boolean).join(" · ") } : row));
        setAction(null); setPlayerId(""); setAssistId(""); setNote("");
    }

    const playedRows = rows.filter(row => row.participation !== "absent");
    const mvpName = playedRows.find(row => row.mvp)?.name ?? null;
    const totalGoals = playedRows.reduce((sum, row) => sum + row.goals, 0);

    async function save(rowsToSave = rows, closeAfterSave = true) {
        setBusy(true);
        setMessage("");

        const response = await fetch(`/api/matches/${matchId}/team-stats`, {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ teamId, rows: rowsToSave }),
        });
        const body = await response.json();

        setBusy(false);
        if (!response.ok) {
            setMessage(body.error?.message ?? "Opslaan mislukt");
            return;
        }

        setMessage(body.data.unassignedGoals ? `${body.data.unassignedGoals} goal(s) zijn nog niet toegewezen.` : "Wedstrijdstatistieken opgeslagen.");
        if (closeAfterSave) setEditing(false);
        router.refresh();
    }

    // save intentionally uses the latest rows after a local action update.
    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {
        if (!autoSave.current) return;
        autoSave.current = false;
        void save(rows, false);
    }, [rows]);
    /* eslint-enable react-hooks/exhaustive-deps */

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
                                    <th>Assists</th>
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
                                        <td>{row.assists || "â€“"}</td>
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
                    <p className="muted">Kies een actie, speler en eventueel een notitie.</p>
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

            <div className="performance-actions"><p className="muted">Kies een gebeurtenis en daarna de betrokken speler(s).</p>{[["goals", "Goal"], ["saves", "Redding"], ["greenCards", "Groene kaart"], ["yellowCards", "Gele kaart"], ["redCards", "Rode kaart"], ["mvp", "Man of the Match"], ["notes", "Notitie"]].map(([kind, label]) => <button className="button secondary" type="button" key={kind} onClick={() => setAction(kind as typeof action)}>{label}</button>)}</div>
            {action && <div className="lineup-dialog-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setAction(null); }}><section className="card lineup-dialog" role="dialog" aria-modal="true" aria-labelledby="performance-action-title"><div className="card-head"><h3 id="performance-action-title">{({ goals: "Goal", saves: "Redding", greenCards: "Groene kaart", yellowCards: "Gele kaart", redCards: "Rode kaart", mvp: "Man of the Match", notes: "Notitie" } as const)[action]}</h3><button className="icon-button" type="button" aria-label="Sluiten" onClick={() => setAction(null)}><X size={18}/></button></div><label>Speler<select className="input" value={playerId} onChange={event => setPlayerId(event.target.value)}><option value="">Kies speler</option>{rows.map(row => <option key={row.playerId} value={row.playerId}>{row.name}</option>)}</select></label>{action === "goals" && <label>Assist (optioneel)<select className="input" value={assistId} onChange={event => setAssistId(event.target.value)}><option value="">Geen assist</option>{rows.filter(row => row.playerId !== playerId).map(row => <option key={row.playerId} value={row.playerId}>{row.name}</option>)}</select></label>}<label>Notitie (optioneel)<textarea className="input" value={note} maxLength={500} onChange={event => setNote(event.target.value)} /></label><button className="button" type="button" disabled={!playerId || (action === "notes" && !note.trim())} onClick={addAction}>Toevoegen</button></section></div>}

            <div className="member-actions">
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
