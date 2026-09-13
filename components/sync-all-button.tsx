"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SyncAllButton() {
  const router = useRouter(), [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  async function synchronize() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/sync", { method: "POST" }), body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? "Synchroniseren mislukt");
      setMessage(`${body.data.succeeded} team${body.data.succeeded === 1 ? "" : "s"} gesynchroniseerd.`);
      router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Synchroniseren mislukt"); }
    finally { setBusy(false); }
  }
  return <div className="member-actions"><button className="button" type="button" disabled={busy} onClick={() => void synchronize()}>{busy ? "Synchroniseren…" : "Nu alles synchroniseren"}</button>{message && <p className="muted" role="status">{message}</p>}</div>;
}
