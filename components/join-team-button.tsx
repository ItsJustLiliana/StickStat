"use client";

import { useEffect, useState } from "react";
import { Toast } from "./toast";

export function JoinTeamButton({ teamId }: { teamId: string }) {
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"error" | "success">("error");
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (cooldown <= 0) return;

        const timer = window.setTimeout(() => {
            setCooldown(current => Math.max(0, current - 1));
        }, 1000);

        return () => window.clearTimeout(timer);
    }, [cooldown]);

    async function join() {
        if (busy || cooldown > 0) return;

        setBusy(true);
        setMessage("");

        try {
            const response = await fetch("/api/team-join-requests", {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({ teamId }),
            });

            const body = await response.json();

            if (!response.ok) {
                setMessageType("error");
                setMessage(body.error?.message ?? "Aanmelden mislukt");

                if (
                    response.status === 429 &&
                    typeof body.error?.retryAfter === "number"
                ) {
                    setCooldown(body.error.retryAfter);
                }

                return;
            }

            setMessageType("success");
            setMessage("Je aanmelding is verstuurd naar de teambeheerder.");
            setCooldown(60);
        } catch {
            setMessageType("error");
            setMessage("Aanmelden mislukt");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="join-team-cta">
            <button
                className="button"
                type="button"
                disabled={busy || cooldown > 0}
                onClick={() => void join()}
            >
                {busy
                    ? "Aanmelden…"
                    : cooldown > 0
                        ? `Opnieuw aanmelden over ${cooldown}s`
                        : "Sluit je aan bij dit team"}
            </button>

            {message && (
                <Toast
                    message={message}
                    variant={messageType}
                    onDismiss={() => setMessage("")}
                />
            )}
        </div>
    );
}