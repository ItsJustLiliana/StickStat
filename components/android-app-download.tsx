"use client";

import {Download, X} from "lucide-react";
import {useEffect, useState} from "react";
import {createPortal} from "react-dom";

type Release = {version:string;downloadUrl:string};

export function AndroidAppDownload() {
  const [available, setAvailable] = useState(false), [open, setOpen] = useState(false), [release, setRelease] = useState<Release | null>(null), [message, setMessage] = useState(""), [busy, setBusy] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setAvailable(/Android/i.test(navigator.userAgent) && !("StickStatApp" in window)), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

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
  const dialog = open && createPortal(<div className="android-app-dialog-backdrop" role="presentation" onClick={() => setOpen(false)}>
    <section className="android-app-dialog" role="dialog" aria-modal="true" aria-labelledby="android-download-title" aria-describedby="android-download-description" onClick={event => event.stopPropagation()}>
      <button type="button" className="android-app-dialog-close" onClick={() => setOpen(false)} aria-label="Sluiten"><X size={23}/></button>
      <span className="android-app-dialog-eyebrow">StickStat voor Android</span>
      <Download className="android-app-dialog-icon" size={28} aria-hidden="true"/>
      <h2 id="android-download-title">StickStat-app downloaden?</h2>
      <p id="android-download-description">Versie {release?.version} wordt gedownload. Android vraagt daarna om de installatie te bevestigen.</p>
      <div className="android-app-dialog-actions"><a className="button" href={release?.downloadUrl} onClick={() => setOpen(false)}>Download app</a></div>
    </section>
  </div>, document.body);

  return <div className="android-app-download">
    <button type="button" className="theme-toggle" onClick={askToDownload} disabled={busy} title="StickStat-app downloaden" aria-label="StickStat-app downloaden"><Download size={20}/></button>
    {message && <span role="status">{message}</span>}
    {dialog}
  </div>;
}
