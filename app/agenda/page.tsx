import { Fragment } from "react";
import Link from "next/link";
import { EmptyTeam } from "@/components/empty-team";
import { MatchTeamLabel } from "@/components/match-team-label";
import { PageShell } from "@/components/page-shell";
import { TeamSelector } from "@/components/team-selector";
import { TrainingCreateForm } from "@/components/training-create-form";
import { db } from "@/lib/db";
import { pageContext } from "@/lib/page-data";
import { hasAnyTeamRole, teamManagementRoles } from "@/lib/team-roles";

export const dynamic = "force-dynamic";

const dateParts = new Intl.DateTimeFormat("nl-NL", {
  timeZone: "Europe/Amsterdam",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function dateKey(date: Date) {
  const parts = Object.fromEntries(dateParts.formatToParts(date).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function weekStart(date: Date) {
  const local = new Date(`${dateKey(date)}T12:00:00`);
  const day = (local.getDay() + 6) % 7;
  local.setDate(local.getDate() - day);
  return local;
}

function weekKey(date: Date) {
  return dateKey(weekStart(date));
}

function weekLabel(date: Date) {
  const start = weekStart(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `${start.toLocaleDateString("nl-NL", { day: "numeric", month: "short" })} – ${end.toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}`;
}

export default async function Agenda({ searchParams }: { searchParams: Promise<{ team?: string; view?: string }> }) {
  const query = await searchParams;
  const { user, teams, team } = await pageContext(query.team);

  if (!team) return <PageShell user={user}><EmptyTeam /></PageShell>;

  const membership = user.teamMemberships.find(item => item.teamId === team.id);
  const canManage = user.platformRole === "admin" || Boolean(membership && hasAnyTeamRole(membership.roles, teamManagementRoles));

  const [matches, trainings] = await Promise.all([
    db.match.findMany({
      where: { OR: [{ homeTeamId: team.id }, { awayTeamId: team.id }] },
      include: { homeTeam: true, awayTeam: true, attendance: { where: { player: { teamId: team.id } } } },
      orderBy: { date: "asc" },
    }),
    db.training.findMany({
      where: { teamId: team.id },
      include: { attendance: true },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
  ]);

  const items = [
    ...matches.map(match => ({
      id: match.id,
      type: "match" as const,
      date: match.date,
      time: match.startTime,
      title: "",
      venue: match.venue,
      href: `/matches/${match.id}?team=${team.id}`,
      attendance: match.attendance,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
    })),
    ...trainings.map(training => ({
      id: training.id,
      type: "training" as const,
      date: training.date,
      time: training.startTime,
      title: training.title,
      venue: training.venue,
      href: `/trainings/${training.id}?team=${team.id}`,
      attendance: training.attendance,
      homeTeam: null,
      awayTeam: null,
    })),
  ];

  const today = dateKey(new Date());
  const showPast = query.view === "past";
  const visibleItems = items
    .filter(item => showPast ? dateKey(item.date) < today : dateKey(item.date) >= today)
    .sort((a, b) => showPast ? b.date.getTime() - a.date.getTime() : a.date.getTime() - b.date.getTime());

  return (
    <PageShell user={user}>
      <div className="page-head">
        <div>
          <span className="eyebrow">Wedstrijden & trainingen</span>
          <h1>Agenda</h1>
        </div>
        <TeamSelector teams={teams} current={team.id} />
      </div>

      {canManage && <TrainingCreateForm teamId={team.id} />}

      <section className="card agenda-card">
        <div className="card-head">
          <nav className="agenda-tabs" aria-label="Agendaweergave">
            <Link
              className={!showPast ? "active" : ""}
              href={`/agenda?team=${team.id}`}
            >
              Teamagenda
            </Link>
            <Link
              className={showPast ? "active" : ""}
              href={`/agenda?team=${team.id}&view=past`}
            >
              Verlopen
            </Link>
          </nav>
        </div>

        <div className="agenda-list">
          {visibleItems.map((item, index) => {
            const newWeek = index === 0 || weekKey(visibleItems[index - 1].date) !== weekKey(item.date);
            return (
              <Fragment key={`${item.type}-${item.id}`}>
                {newWeek && (
                  <div className={`agenda-week-separator ${index === 0 ? "first" : ""}`}>
                    <span>{weekLabel(item.date)}</span>
                  </div>
                )}
                <Link className="agenda-row" href={item.href}>
                  <time>
                    <strong>{item.date.toLocaleDateString("nl-NL", { day: "2-digit", month: "short" })}</strong>
                    <span>{item.time ?? "–"}</span>
                  </time>
                  <span>
                    <small className={`agenda-type ${item.type}`}>
                      {item.type === "match" ? "Wedstrijd" : "Training"}
                    </small>
                    {item.type === "match" && item.homeTeam && item.awayTeam ? (
                      <span className="agenda-match-teams">
                        <MatchTeamLabel
                          name={item.homeTeam.shortName}
                          own={item.homeTeam.id === team.id}
                          side="home"
                        />
                        <span className="match-versus">–</span>
                        <MatchTeamLabel
                          name={item.awayTeam.shortName}
                          own={item.awayTeam.id === team.id}
                          side="away"
                        />
                      </span>
                    ) : (
                      <strong>{item.title}</strong>
                    )}
                    <small>{item.venue ?? "Locatie onbekend"}</small>
                  </span>
                </Link>
              </Fragment>
            );
          })}
        </div>

        {!visibleItems.length && (
          <div className="empty">
            {showPast ? "Nog geen verlopen afspraken." : "Geen komende afspraken."}
          </div>
        )}
      </section>
    </PageShell>
  );
}
