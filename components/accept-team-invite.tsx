"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AcceptTeamInvite({ token, teamName }: { token: string; teamName: string }) { const router = useRouter(), [busy, setBusy] = useState(false), [error, setError] = useState(""); async function accept() { setBusy(true); setError(""); const response = await fetch("/api/invites/accept", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token }) }), body = await response.json(); setBusy(false); if (!response.ok) { setError(body.error?.message ?? "Uitnodiging accepteren mislukt"); return } router.replace(`/dashboard?team=${body.data.teamId}`) } return <div><p>Je bent ingelogd. Voeg je account toe aan <strong>{teamName}</strong>.</p><button className="button" disabled={busy} onClick={() => void accept()}>{busy ? "Toevoegen…" : "Uitnodiging accepteren"}</button>{error && <div className="error" role="alert">{error}</div>}</div> }
