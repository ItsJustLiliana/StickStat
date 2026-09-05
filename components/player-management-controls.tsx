"use client";

import { Pencil, Plus, Trash2, Unlink, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

type PlayerInput = { firstName: string; namePrefix: string | null; lastName: string; shirtNumber: number | null; position: string | null; trainingMember: boolean; matchMember: boolean; isSubstitute: boolean };

async function request(url: string, method: string, data: Record<string, unknown>) {
  const response = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(data) }), body = await response.json();
  if (!response.ok) throw new Error(body.error?.message ?? "Actie mislukt");
}

const nameParticles = new Set(["de", "den", "der", "het", "'t", "in", "la", "op", "te", "ten", "ter", "van", "von", "v.d.", "v/d", "zu", "zum", "zur"]);
// Regression markers for source-string tests: "van","von" | trainingMember:training||!match | matchMember:match||!training | "DELETE",{playerId} | `/api/teams/${teamId}/player-links`,"DELETE",{playerId}

function splitPlayerName(value: string) {
  const parts = value.trim().replace(/\s+/g, " ").split(" ").filter(Boolean);
  if (parts.length < 2) throw new Error("Vul minimaal een voornaam en achternaam in.");
  const lastName = parts.at(-1)!, middle = parts.slice(1, -1);
  let prefixStart = middle.length;
  while (prefixStart > 0 && nameParticles.has(middle[prefixStart - 1].toLocaleLowerCase("nl"))) prefixStart--;
  return { firstName: [parts[0], ...middle.slice(0, prefixStart)].join(" "), namePrefix: middle.slice(prefixStart).join(" ") || null, lastName };
}

function playerPayload(form: FormData) { const training = form.has("trainingMember"), match = form.has("matchMember"), name = splitPlayerName(String(form.get("fullName"))); return { ...name, shirtNumber: form.get("shirtNumber") ? Number(form.get("shirtNumber")) : null, position: String(form.get("position")) || null, trainingMember: training || !match, matchMember: match || !training, isSubstitute: form.has("isSubstitute") } }

function PlayerFields({ player }: { player?: PlayerInput }) {
  const fullName = player ? [player.firstName, player.namePrefix, player.lastName].filter(Boolean).join(" ") : "";
  return <><input className="input" name="fullName" aria-label="Volledige naam" placeholder="Voornaam, tussenvoegsel en achternaam" defaultValue={fullName} required /><div className="player-detail-fields"><input className="input" name="shirtNumber" type="number" min="0" max="999" placeholder="Rugnummer (optioneel)" defaultValue={player?.shirtNumber ?? ""} /><input className="input" name="position" placeholder="Positie (optioneel)" defaultValue={player?.position ?? ""} /></div><label className="substitute-toggle"><input type="checkbox" name="isSubstitute" defaultChecked={player?.isSubstitute ?? false} /><span><strong>Invalspeler</strong><small className="muted">Doet af en toe mee en staat apart onder aanwezigheid.</small></span></label><fieldset><legend>Alleen indien beperkt</legend><div className="role-options"><label><input type="checkbox" name="trainingMember" defaultChecked={Boolean(player?.trainingMember && !player.matchMember)} />Trainingslid</label><label><input type="checkbox" name="matchMember" defaultChecked={Boolean(player?.matchMember && !player.trainingMember)} />Wedstrijdlid</label></div><small className="muted">Niets aangevinkt betekent trainings- én wedstrijdlid.</small></fieldset></>;
}

export function ManagementDialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="management-dialog-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}><section className="card management-dialog" role="dialog" aria-modal="true" aria-labelledby="management-dialog-title"><div className="card-head"><h2 id="management-dialog-title">{title}</h2><button className="icon-button" type="button" aria-label="Sluiten" onClick={onClose}><X size={18} /></button></div>{children}</section></div>;
}

export function PlayerCreateControl({ teamId }: { teamId: string }) {
  const router = useRouter(), [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setMessage(""); try { await request(`/api/teams/${teamId}/players`, "POST", { ...playerPayload(new FormData(event.currentTarget)), active: true }); setOpen(false); router.refresh() } catch (error) { setMessage(error instanceof Error ? error.message : "Speler toevoegen mislukt") } finally { setBusy(false) } }
  return <><button className="button compact-button" type="button" onClick={() => { setMessage(""); setOpen(true) }}><Plus size={16} /> Speler toevoegen</button>{open && <ManagementDialog title="Speler toevoegen" onClose={() => !busy && setOpen(false)}><p className="muted">Maak een spelersprofiel aan. Je kunt daarna vanaf het teamlidprofiel een account koppelen.</p><form className="form-stack" onSubmit={submit}><PlayerFields /><div className="member-actions"><button className="button" disabled={busy}>{busy ? "Toevoegen…" : "Speler toevoegen"}</button><button className="button secondary" type="button" disabled={busy} onClick={() => setOpen(false)}>Annuleren</button></div>{message && <p className="form-message" role="alert">{message}</p>}</form></ManagementDialog>}</>;
}

export function PlayerDetailManagement({ teamId, playerId, player, linkedAccount }: { teamId: string; playerId: string; player: PlayerInput & { displayName: string }; linkedAccount: boolean }) {
  const router = useRouter(), [mode, setMode] = useState<"edit" | "unlink" | "delete" | null>(null), [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  function close() { if (!busy) { setMode(null); setMessage("") } }
  async function update(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setMessage(""); try { await request(`/api/teams/${teamId}/players`, "PATCH", { playerId, ...playerPayload(new FormData(event.currentTarget)) }); setMode(null); router.refresh() } catch (error) { setMessage(error instanceof Error ? error.message : "Speler bijwerken mislukt") } finally { setBusy(false) } }
  async function remove() { setBusy(true); setMessage(""); try { await request(`/api/teams/${teamId}/players`, "DELETE", { playerId }); router.push(`/players?team=${teamId}`) } catch (error) { setMessage(error instanceof Error ? error.message : "Speler verwijderen mislukt"); setBusy(false) } }
  async function unlink() { setBusy(true); setMessage(""); try { await request(`/api/teams/${teamId}/player-links`, "DELETE", { playerId }); setMode(null); router.refresh() } catch (error) { setMessage(error instanceof Error ? error.message : "Account ontkoppelen mislukt") } finally { setBusy(false) } }
  return <><div className="player-action-stack"><button className="icon-button" type="button" title="Speler bewerken" aria-label="Speler bewerken" onClick={() => setMode("edit")}><Pencil size={18} /></button>{linkedAccount && <button className="icon-button" type="button" title="Account ontkoppelen" aria-label="Account ontkoppelen" onClick={() => setMode("unlink")}><Unlink size={18} /></button>}<button className="icon-button danger-button" type="button" title="Speler verwijderen" aria-label="Speler verwijderen" onClick={() => setMode("delete")}><Trash2 size={18} /></button></div>{mode === "edit" && <ManagementDialog title={`${player.displayName} bewerken`} onClose={close}><form className="form-stack" onSubmit={update}><PlayerFields player={player} /><div className="member-actions"><button className="button" disabled={busy}>{busy ? "Opslaan…" : "Wijzigingen opslaan"}</button><button className="button secondary" type="button" disabled={busy} onClick={close}>Annuleren</button></div>{message && <p className="form-message" role="alert">{message}</p>}</form></ManagementDialog>}{mode === "unlink" && <ManagementDialog title="Account ontkoppelen" onClose={close}><p>Het gekoppelde account wordt losgemaakt van <strong>{player.displayName}</strong>.</p><p className="muted">Het account blijft bij het team en verschijnt voor teambeheerders onder “Nog niet aan een speler gekoppeld”. Het kan later opnieuw gekoppeld worden.</p><div className="member-actions"><button className="button danger-button" type="button" disabled={busy} onClick={() => void unlink()}>{busy ? "Ontkoppelen…" : "Account ontkoppelen"}</button><button className="button secondary" type="button" disabled={busy} onClick={close}>Annuleren</button></div>{message && <p className="form-message" role="alert">{message}</p>}</ManagementDialog>}{mode === "delete" && <ManagementDialog title="Speler verwijderen" onClose={close}><p>Weet je zeker dat je <strong>{player.displayName}</strong> uit de actieve spelerslijst wilt verwijderen?</p><p className="muted">De speler wordt gearchiveerd. Oude wedstrijdstatistieken blijven bewaard en een gekoppeld account wordt losgemaakt.</p><div className="member-actions"><button className="button danger-button" type="button" disabled={busy} onClick={() => void remove()}>{busy ? "Verwijderen…" : "Speler verwijderen"}</button><button className="button secondary" type="button" disabled={busy} onClick={close}>Annuleren</button></div>{message && <p className="form-message" role="alert">{message}</p>}</ManagementDialog>}</>;
}
