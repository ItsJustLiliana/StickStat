"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { resizePhotoTo1080p } from "@/lib/browser-image";

type Kind = "team" | "mvp";

export function MatchPhotoManager({ matchId, teamId, teamPhotoPath, mvpPhotoPath, mvpName, canEdit }: { matchId: string; teamId: string; teamPhotoPath: string | null; mvpPhotoPath: string | null; mvpName: string | null; canEdit: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<Kind | null>(null);
  const [message, setMessage] = useState("");

  function diagnostic(title: string, details: string[]) {
    window.alert(["Tijdelijke foto-uploaddiagnose", title, ...details].join("\n"));
  }

  async function upload(kind: Kind, file: File | undefined) {
    if (!file) {
      const error = "Er is geen foto ontvangen. Kies de foto opnieuw.";
      setMessage(error);
      diagnostic("Stap 1: de Android-kiezer gaf geen bestand terug.", ["files.length: 0", `browser: ${navigator.userAgent}`]);
      return;
    }
    setBusy(kind);
    setMessage("");
    try {
      const optimized = await resizePhotoTo1080p(file);
      if (optimized.size > 4_000_000) throw new Error("De foto is na verkleinen nog groter dan 4 MB.");
      const form = new FormData();
      form.set("teamId", teamId);
      form.set(`${kind}Photo`, optimized);
      const response = await fetch(`/api/matches/${matchId}/photos`, { method: "POST", body: form });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(`Serverfout ${response.status}: ${body?.error?.message ?? "onbekende fout"}`);
      setMessage("Foto opgeslagen.");
      router.refresh();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Uploaden mislukt";
      setMessage(text);
      diagnostic("Stap 2: de foto kon niet worden verwerkt of verstuurd.", [`bestandsnaam: ${file.name}`, `type: ${file.type || "onbekend"}`, `grootte: ${file.size} bytes`, `fout: ${text}`, `browser: ${navigator.userAgent}`]);
    } finally {
      setBusy(null);
    }
  }

  function receiveFile(kind: Kind, event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const file = input.files?.item(0) ?? undefined;
    if (file) diagnostic("Stap 1 gelukt: bestand ontvangen.", [`bestandsnaam: ${file.name}`, `type: ${file.type || "onbekend"}`, `grootte: ${file.size} bytes`, "De upload start nu."]);
    input.value = "";
    void upload(kind, file);
  }

  async function remove(kind: Kind) {
    setBusy(kind);
    setMessage("");
    try {
      const response = await fetch(`/api/matches/${matchId}/photos`, { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ teamId, kind }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? "Verwijderen mislukt");
      setMessage("Foto verwijderd.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Verwijderen mislukt");
    } finally {
      setBusy(null);
    }
  }

  if (!canEdit) return null;
  const controls = [{ kind: "team" as const, label: "Teamfoto", current: teamPhotoPath }, ...(mvpName ? [{ kind: "mvp" as const, label: `Foto Man of the Match: ${mvpName}`, current: mvpPhotoPath }] : [])];
  return <section className="match-photo-manager"><h3>Wedstrijdfoto&apos;s</h3><p className="muted">Teambeheerder kan een teamfoto en, na het kiezen van de Man of the Match, diens foto toevoegen.</p><div className="match-photo-actions">{controls.map(control => <div key={control.kind}><label className="button secondary" style={{ position: "relative", overflow: "hidden" }}><ImagePlus size={16} />{busy === control.kind ? "Bezig…" : control.current ? `${control.label} vervangen` : control.label}<input aria-label={control.label} disabled={busy !== null} type="file" accept="image/*" onChange={event => receiveFile(control.kind, event)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.01, cursor: "pointer" }} /></label>{control.current && <button className="icon-button" disabled={busy !== null} type="button" aria-label={`${control.label} verwijderen`} onClick={() => void remove(control.kind)}><Trash2 size={16} /></button>}</div>)}</div>{message && <p className="muted" role="status">{message}</p>}</section>;
}
