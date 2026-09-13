"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { resizePhotoTo1080p } from "@/lib/browser-image";

type Kind = "team" | "mvp";

export function MatchPhotoManager({ matchId, teamId, teamPhotoPath, mvpPhotoPath, mvpName, canEdit }: { matchId: string; teamId: string; teamPhotoPath: string | null; mvpPhotoPath: string | null; mvpName: string | null; canEdit: boolean }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<Kind | null>(null);
  const [message, setMessage] = useState("");
  const [selectedKind, setSelectedKind] = useState<Kind>("team");

  async function upload(kind: Kind, file: File | undefined) {
    if (!file) {
      setMessage("Er is geen foto ontvangen. Kies de foto opnieuw.");
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
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? "Uploaden mislukt");
      setMessage("Foto opgeslagen.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Uploaden mislukt");
    } finally {
      setBusy(null);
    }
  }

  function choose(kind: Kind) {
    setSelectedKind(kind);
    setMessage("");
    const input = fileInput.current;
    if (!input) {
      setMessage("De fotokiezer kon niet worden geopend. Probeer de pagina te verversen.");
      return;
    }
    input.value = "";
    input.click();
  }

  function receiveFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    void upload(selectedKind, file);
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
  return <section className="match-photo-manager"><h3>Wedstrijdfoto&apos;s</h3><p className="muted">Teambeheerder kan een teamfoto en, na het kiezen van de Man of the Match, diens foto toevoegen.</p><input ref={fileInput} hidden disabled={busy !== null} type="file" accept="image/*,.heic,.heif" onChange={receiveFile} /> <div className="match-photo-actions">{controls.map(control => <div key={control.kind}><button className="button secondary" type="button" disabled={busy !== null} onClick={() => choose(control.kind)}><ImagePlus size={16} />{busy === control.kind ? "Bezig…" : control.current ? `${control.label} vervangen` : control.label}</button>{control.current && <button className="icon-button" disabled={busy !== null} type="button" aria-label={`${control.label} verwijderen`} onClick={() => void remove(control.kind)}><Trash2 size={16} /></button>}</div>)}</div>{message && <p className="muted" role="status">{message}</p>}</section>;
}
