"use client";

import {Download, X} from "lucide-react";
import {useEffect, useState} from "react";

type Release = {version:string;downloadUrl:string};

export function AndroidAppDownload() {
  const [available, setAvailable] = useState(false), [open, setOpen] = useState(false), [release, setRelease] = useState<Release | null>(null), [message, setMessage] = useState(""), [busy, setBusy] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setAvailable(/Android/i.test(navigator.userAgent) && !("StickStatApp" in window)), 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function askToDownload() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/app/releases/latest"), body = await response.json();
      if (!response.ok || !body.data?.downloadUrl) throw new Error("Er is nog geen appversie beschikbaar.");
      setRelease(body.data); setOpen(true);
    } catch (error) { setMessage(error instanceof Error ? error.message : "De appversie kon niet worden opgehaald."); }
    finally { setBusy(false); }
  }

  if (!available) return null;
  return <div className="android-app-download">
    <button type="button" className="theme-toggle" onClick={askToDownload} disabled={busy} title="StickStat-app downloaden" aria-label="StickStat-app downloaden"><Download size={20}/></button>
    {message && <span role="status">{message}</span>}
    {open && <div className="android-app-dialog-backdrop" role="presentation" onClick={() => setOpen(false)}><section className="android-app-dialog" role="dialog" aria-modal="true" aria-labelledby="android-download-title" onClick={event => event.stopPropagation()}>
      <button type="button" className="icon-button" onClick={() => setOpen(false)} aria-label="Sluiten"><X size={20}/></button>
      <h2 id="android-download-title">StickStat-app downloaden?</h2>
      <p>Versie {release?.version} wordt gedownload van liliananuzohra.com. Android vraagt daarna om de installatie te bevestigen.</p>
      <div><button type="button" className="button secondary" onClick={() => setOpen(false)}>Nee</button><a className="button" href={release?.downloadUrl} onClick={() => setOpen(false)}>Ja, downloaden</a></div>
    </section></div>}
  </div>;
}
