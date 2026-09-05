"use client";

import { Pencil, Trash2, Key } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ManagementDialog } from "@/components/player-management-controls";

type User = {
    id: string;
    name: string;
    username: string;
    platformRole: "admin" | "user";
    isLastAdmin: boolean;
};

type DialogMode = "edit" | "delete" | "reset-password" | null;

export function AdminUserManagement({ users }: { users: User[] }) {
    const router = useRouter();
    const [mode, setMode] = useState<DialogMode>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState("");
    const [editForm, setEditForm] = useState({ name: "", username: "", platformRole: "user" as "admin" | "user" });
    const [tempPassword, setTempPassword] = useState("");

    function close() {
        if (!busy) {
            setMode(null);
            setSelectedUser(null);
            setMessage("");
            setTempPassword("");
            setEditForm({ name: "", username: "", platformRole: "user" });
        }
    }

    function openEdit(user: User) {
        setSelectedUser(user);
        setEditForm({ name: user.name, username: user.username, platformRole: user.platformRole });
        setMode("edit");
    }

    function openDelete(user: User) {
        setSelectedUser(user);
        setMode("delete");
    }

    function openResetPassword(user: User) {
        setSelectedUser(user);
        setMode("reset-password");
    }

    async function saveEdit(event: React.FormEvent<HTMLFormElement>) {
        if (!selectedUser) return;
        event.preventDefault();
        setBusy(true);
        setMessage("");

        try {
            const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(editForm),
            });

            const body = await response.json();
            if (!response.ok) throw new Error(body.error?.message ?? "Wijziging mislukt");

            setMessage("Gebruiker bijgewerkt");
            close();
            router.refresh();
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "Wijziging mislukt");
        } finally {
            setBusy(false);
        }
    }

    async function confirmDelete() {
        if (!selectedUser) return;
        setBusy(true);
        setMessage("");

        try {
            const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
                method: "DELETE",
            });

            const body = await response.json();
            if (!response.ok) throw new Error(body.error?.message ?? "Verwijdering mislukt");

            close();
            router.refresh();
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "Verwijdering mislukt");
            setBusy(false);
        }
    }

    async function resetPassword() {
        if (!selectedUser) return;
        setBusy(true);
        setMessage("");

        try {
            const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
                method: "POST",
            });

            const body = await response.json();
            if (!response.ok) throw new Error(body.error?.message ?? "Reset mislukt");

            setTempPassword(body.data.tempPassword);
            setMessage("Tijdelijk wachtwoord gegenereerd");
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "Reset mislukt");
            setBusy(false);
        }
    }

    return (
        <>
            <div className="users-management-grid">
                {users.map((user) => (
                    <div key={user.id} className="user-card">
                        <div className="user-info">
                            <strong>{user.name}</strong>
                            <span className="muted">@{user.username}</span>
                            <span className="badge">{user.platformRole === "admin" ? "ADMIN" : "User"}</span>
                        </div>
                        <div className="user-actions">
                            <button
                                className="icon-button"
                                type="button"
                                title="Bewerken"
                                aria-label="Bewerken"
                                onClick={() => openEdit(user)}
                            >
                                <Pencil size={18} />
                            </button>
                            <button
                                className="icon-button"
                                type="button"
                                title="Wachtwoord resetten"
                                aria-label="Wachtwoord resetten"
                                onClick={() => openResetPassword(user)}
                            >
                                <Key size={18} />
                            </button>
                            <button
                                className="icon-button danger-button"
                                type="button"
                                title="Verwijderen"
                                aria-label="Verwijderen"
                                onClick={() => openDelete(user)}
                                disabled={user.isLastAdmin && user.platformRole === "admin"}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {mode === "edit" && selectedUser && (
                <ManagementDialog title={`Gebruiker bewerken: ${selectedUser.name}`} onClose={close}>
                    <form className="form-stack" onSubmit={saveEdit}>
                        <label>
                            <span>Naam</span>
                            <input
                                type="text"
                                className="input"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                minLength={2}
                                maxLength={120}
                                required
                                disabled={busy}
                            />
                        </label>
                        <label>
                            <span>Gebruikersnaam</span>
                            <input
                                type="text"
                                className="input"
                                value={editForm.username}
                                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                                pattern="[a-z0-9._-]+"
                                required
                                disabled={busy}
                            />
                        </label>
                        <label>
                            <span>Rol</span>
                            <select
                                className="input"
                                value={editForm.platformRole}
                                onChange={(e) =>
                                    setEditForm({ ...editForm, platformRole: e.target.value as "admin" | "user" })
                                }
                                disabled={busy}
                            >
                                <option value="user">Gebruiker</option>
                                <option value="admin">Admin</option>
                            </select>
                        </label>
                        <div className="member-actions">
                            <button className="button" disabled={busy}>
                                {busy ? "Opslaan…" : "Opslaan"}
                            </button>
                            <button type="button" className="button secondary" disabled={busy} onClick={close}>
                                Annuleren
                            </button>
                        </div>
                        {message && (
                            <p className="form-message" role="alert">
                                {message}
                            </p>
                        )}
                    </form>
                </ManagementDialog>
            )}

            {mode === "delete" && selectedUser && (
                <ManagementDialog title="Gebruiker verwijderen" onClose={close}>
                    <p>
                        Weet je zeker dat je <strong>{selectedUser.name}</strong> wilt verwijderen? Dit kan niet
                        ongedaan gemaakt worden.
                    </p>
                    <div className="member-actions">
                        <button
                            className="button danger-button"
                            type="button"
                            disabled={busy}
                            onClick={confirmDelete}
                        >
                            {busy ? "Verwijderen…" : "Verwijderen"}
                        </button>
                        <button type="button" className="button secondary" disabled={busy} onClick={close}>
                            Annuleren
                        </button>
                    </div>
                    {message && (
                        <p className="form-message" role="alert">
                            {message}
                        </p>
                    )}
                </ManagementDialog>
            )}

            {mode === "reset-password" && selectedUser && (
                <ManagementDialog title="Wachtwoord resetten" onClose={close}>
                    {tempPassword ? (
                        <>
                            <p>Tijdelijk wachtwoord voor <strong>{selectedUser.name}</strong>:</p>
                            <div className="temp-password-display">
                                <code>{tempPassword}</code>
                                <button
                                    type="button"
                                    className="button small"
                                    onClick={() => {
                                        navigator.clipboard.writeText(tempPassword);
                                        setMessage("Gekopieerd naar klembord!");
                                    }}
                                >
                                    Kopiëren
                                </button>
                            </div>
                            <p className="muted">
                                Geef dit wachtwoord aan de gebruiker. Zij moeten dit veranderen na het eerste
                                inloggen.
                            </p>
                            <button type="button" className="button secondary" onClick={close}>
                                Sluiten
                            </button>
                        </>
                    ) : (
                        <>
                            <p>
                                Genereer een tijdelijk wachtwoord voor <strong>{selectedUser.name}</strong>. Deze
                                kunnen ze gebruiken om in te loggen en een nieuw wachtwoord in te stellen.
                            </p>
                            <div className="member-actions">
                                <button
                                    className="button"
                                    type="button"
                                    disabled={busy}
                                    onClick={resetPassword}
                                >
                                    {busy ? "Genereren…" : "Wachtwoord genereren"}
                                </button>
                                <button type="button" className="button secondary" disabled={busy} onClick={close}>
                                    Annuleren
                                </button>
                            </div>
                            {message && (
                                <p className="form-message" role="alert">
                                    {message}
                                </p>
                            )}
                        </>
                    )}
                </ManagementDialog>
            )}
        </>
    );
}
