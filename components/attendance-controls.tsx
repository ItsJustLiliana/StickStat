"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Toast } from "./toast";
export type AttendanceStatus = "present" | "unknown" | "absent";
const choices = [["present", "\u2713", "Aanwezig"], ["unknown", "?", "Onbekend"], ["absent", "\u00d7", "Afwezig"]] as const;
export function AttendanceControls({ endpoint, playerId, name, status, disabled = false, locked = false }: {
  endpoint: string; playerId: string; name: string; status: AttendanceStatus; disabled?: boolean; locked?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [refreshing, startTransition] = useTransition();
  async function change(next: AttendanceStatus) {
    setBusy(true); setError("");
    try {
      const response = await fetch(endpoint, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ playerId, status: next }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? "Opslaan mislukt");
      startTransition(() => router.refresh());
    } catch (error) { setError(error instanceof Error ? error.message : "Opslaan mislukt"); }
    finally { setBusy(false); }
  }
  return <div className={`attendance-control ${locked ? "is-locked" : ""}`}>
    <div className="attendance-options" role="group" aria-label={`Aanwezigheid van ${name}${locked ? ": vergrendeld" : ""}`}>
      {choices.map(([value, icon, label]) => <button key={value} type="button" title={locked ? "Aanmeldingen vergrendeld" : label} aria-label={`${label}: ${name}`} disabled={disabled || locked || busy || refreshing} className={`attendance-choice ${value}`} aria-pressed={status === value} onClick={() => void change(value)}>{icon}</button>)}
    </div>
    {error && <Toast message={error} onDismiss={() => setError("")} />}
  </div>;
}
