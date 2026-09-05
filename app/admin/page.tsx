import { redirect } from "next/navigation";
import { AccountBindingPanel } from "@/components/account-binding-panel";
import { AdminClubManagement } from "@/components/admin-club-management";
import { AdminUserManagement } from "@/components/admin-user-management";
import { AppReleasePanel } from "@/components/app-release-panel";
import { PageShell } from "@/components/page-shell";
import { SyncButton } from "@/components/sync-button";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import "@/app/admin-management.css";
export const dynamic = "force-dynamic";
export default async function Admin() {
    const user = await currentUser();
    if (!user) redirect("/login");
    if (user.platformRole !== "admin") redirect("/dashboard");

    const adminCount = await db.user.count({ where: { platformRole: "admin" } });

    const [clubs, teams, users, runs, players, release] = await Promise.all([
        db.club.findMany({ include: { teams: true } }),
        db.team.findMany({ include: { club: true } }),
        db.user.findMany({
            include: { clubMemberships: true, teamMemberships: true },
            orderBy: { name: "asc" },
        }),
        db.syncRun.findMany({ orderBy: { startedAt: "desc" }, take: 10 }),
        db.player.findMany({
            include: { user: true },
            orderBy: [
                { lastName: "asc" },
                { namePrefix: "asc" },
                { firstName: "asc" },
            ],
        }),
        db.appRelease.findFirst({ orderBy: { buildNumber: "desc" } }),
    ]);
    return (
        <PageShell user={user}>
            <div className="page-head">
                <div>
                    <span className="eyebrow">Platformbeheer</span>
                    <h1>Beheer</h1>
                </div>
                <span className="badge accent">PLATFORM ADMIN</span>
            </div>
            <div className="admin-grid">
                <section className="card">
                    <div className="card-head">
                        <h2>Clubs & teams</h2>
                        <span className="badge">{clubs.length} clubs</span>
                    </div>
                    <AdminClubManagement clubs={clubs} />
                </section>
            </div>
            <section className="card" style={{ marginTop: 18 }}>
                <div className="card-head">
                    <h2>Gebruikers</h2>
                    <span className="badge">{users.length} accounts</span>
                </div>
                <AdminUserManagement
                    users={users.map((u) => ({
                        id: u.id,
                        name: u.name,
                        username: u.username,
                        platformRole: u.platformRole,
                        isLastAdmin: u.platformRole === "admin" && adminCount === 1,
                    }))}
                />
            </section>
            <AccountBindingPanel
                currentUserId={user.id}
                users={users.map((account) => ({
                    id: account.id,
                    label: `${account.name} (@${account.username})`,
                }))}
                teams={teams.map((team) => ({
                    id: team.id,
                    label: `${team.club.name} · ${team.name}`,
                }))}
                players={players.map((player) => ({
                    id: player.id,
                    teamId: player.teamId,
                    label: player.displayName,
                    linkedAccount: player.user?.username,
                }))}
            />
            <AppReleasePanel latestVersion={release?.version ?? null} />
            <section className="card" style={{ marginTop: 18 }}>
                <div className="card-head">
                    <h2>Synchronisatie</h2>
                    <span className="badge">IEDER UUR</span>
                </div>
                {teams
                    .filter((team) => team.externalProvider)
                    .map((team) => {
                        const last = runs.find((run) => run.teamId === team.id);
                        return (
                            <div className="sync-item" key={team.id}>
                                <div>
                                    <strong>
                                        {team.club.name} · {team.name}
                                    </strong>
                                    <div className="muted">
                                        {last
                                            ? `${last.status} · ${last.startedAt.toLocaleString("nl-NL")}`
                                            : "Nog niet gesynchroniseerd"}
                                    </div>
                                </div>
                                <SyncButton teamId={team.id} />
                            </div>
                        );
                    })}
            </section>
        </PageShell>
    );
}
