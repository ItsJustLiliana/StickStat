"use client";

import { Upload, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { resizePhotoTo1080p } from "@/lib/browser-image";

type Club = { id: string; name: string; logoLocalPath: string | null; teams: Array<{ id: string; name: string }> };

export function AdminClubManagement({ clubs }: { clubs: Club[] }) {
    const router = useRouter();
    const [busyClubId, setBusyClubId] = useState<string | null>(null);
    const [message, setMessage] = useState("");
    const [logosOpen, setLogosOpen] = useState(false);

    useEffect(() => {
        if (!logosOpen) return;
        const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape" && !busyClubId) setLogosOpen(false); };
        document.addEventListener("keydown", closeOnEscape);
        return () => document.removeEventListener("keydown", closeOnEscape);
    }, [busyClubId, logosOpen]);

    async function handleLogoUpload(clubId: string, event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;
        setBusyClubId(clubId);
        setMessage("");
        try {
            const formData = new FormData();
            formData.append("logo", await resizePhotoTo1080p(file, 2_000_000, true));
            const response = await fetch(`/api/clubs/${clubId}/logo`, { method: "POST", body: formData });
            const body = await response.json();
            if (!response.ok) throw new Error(body.error?.message ?? "Upload mislukt");
            setMessage("Clublogo geüpload.");
            router.refresh();
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "Upload mislukt");
        } finally {
            setBusyClubId(null);
        }
    }

    return <div className="clubs-management">
        <div className="clubs-management-actions"><p className="muted">Beheer teams per club. Clublogo&apos;s upload je vanuit de compacte lijst.</p><button className="button secondary" type="button" onClick={() => setLogosOpen(true)}><Upload size={17} /> Clublogo&apos;s beheren</button></div>
        {clubs.map((club) => <section key={club.id} className="club-section"><div className="club-header"><div className="club-info"><h3>{club.name}</h3></div></div>{club.teams.length > 0 && <div className="teams-list"><span className="eyebrow">Teams</span>{club.teams.map((team) => <div key={team.id} className="team-item">{team.name}</div>)}</div>}</section>)}
        {message && <p className="form-message" role="status">{message}</p>}
        {logosOpen && <div className="management-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busyClubId) setLogosOpen(false); }}><section className="management-dialog card club-logo-dialog" role="dialog" aria-modal="true" aria-labelledby="club-logo-dialog-title"><div className="card-head"><div><span className="eyebrow">Clubuitstraling</span><h2 id="club-logo-dialog-title">Clublogo&apos;s beheren</h2></div><button className="icon-button" type="button" onClick={() => setLogosOpen(false)} disabled={Boolean(busyClubId)} aria-label="Sluiten"><X size={19} /></button></div><p className="muted">Kies een club en upload een transparant logo.</p><div className="club-logo-list">{clubs.map((club) => <div className="club-logo-list-item" key={club.id}>{club.logoLocalPath ? <Image className="club-logo-preview" src={club.logoLocalPath} alt={`${club.name} logo`} width={60} height={60} unoptimized /> : <div className="club-logo-preview placeholder" aria-hidden="true">{club.name.slice(0, 2).toUpperCase()}</div>}<strong>{club.name}</strong><label className="button secondary compact-button"><Upload size={15} /> {busyClubId === club.id ? "Uploaden…" : "Logo kiezen"}<input type="file" accept="image/*,.heic,.heif" onChange={(event) => void handleLogoUpload(club.id, event)} disabled={Boolean(busyClubId)} hidden /></label></div>)}</div></section></div>}
    </div>;
}
