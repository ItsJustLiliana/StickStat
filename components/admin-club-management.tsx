"use client";

import { Upload } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Club = {
    id: string;
    name: string;
    logoLocalPath: string | null;
    teams: Array<{ id: string; name: string }>;
};

export function AdminClubManagement({ clubs }: { clubs: Club[] }) {
    const router = useRouter();
    const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState("");

    async function handleLogoUpload(
        clubId: string,
        event: React.ChangeEvent<HTMLInputElement>
    ) {
        const file = event.target.files?.[0];
        if (!file) return;

        setBusy(true);
        setMessage("");

        try {
            const formData = new FormData();
            formData.append("logo", file);

            const response = await fetch(`/api/clubs/${clubId}/logo`, {
                method: "POST",
                body: formData,
            });

            const body = await response.json();
            if (!response.ok) throw new Error(body.error?.message ?? "Upload mislukt");

            setMessage("Logo geüpload!");
            router.refresh();
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "Upload mislukt");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="clubs-management">
            {clubs.map((club) => (
                <section key={club.id} className="club-section">
                    <div className="club-header">
                        <div className="club-info">
                            <h3>{club.name}</h3>
                            {club.logoLocalPath && (
                                <div className="club-logo-preview">
                                    <Image
                                        src={club.logoLocalPath}
                                        alt={`${club.name} logo`}
                                        width={60}
                                        height={60}
                                        unoptimized
                                    />
                                </div>
                            )}
                        </div>
                        <label className="icon-button" title="Logo uploaden" aria-label="Logo uploaden">
                            <Upload size={18} />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleLogoUpload(club.id, e)}
                                disabled={busy}
                                style={{ display: "none" }}
                            />
                        </label>
                    </div>

                    {club.teams.length > 0 && (
                        <div className="teams-list">
                            <span className="eyebrow">Teams</span>
                            {club.teams.map((team) => (
                                <div key={team.id} className="team-item">
                                    {team.name}
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            ))}
            {message && <p className="form-message">{message}</p>}
        </div>
    );
}
