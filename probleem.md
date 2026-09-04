
Run tailscale ssh <marijn@archlinux.tail50bfa9.ts.net> \

From <https://github.com/ItsJustLiliana/StickStat>

* branch            main       -> FETCH_HEAD
  626ed8c..639a9e3  main       -> origin/main
  From <https://github.com/ItsJustLiliana/StickStat>
* branch            main       -> FETCH_HEAD
  Already on 'main'
  Your branch is behind 'origin/main' by 1 commit, and can be fast-forwarded.
  (use "git pull" to update your local branch)
  Updating 626ed8c..639a9e3
  Fast-forward
  app/agenda/page.tsx | 184 ++++++++++++++++++++++++++++++++++++++++++++++------
  1 file changed, 165 insertions(+), 19 deletions(-)
  Dependencies unchanged; keeping existing node_modules.
  npm notice run stickstat@1.0.0 prisma:generate
  npm notice run prisma generate
  Loaded Prisma config from prisma.config.ts.
  Prisma schema loaded from prisma/schema.prisma.
  ✔ Generated Prisma Client (7.10.0) to ./generated/prisma in 517ms
  npm notice run stickstat@1.0.0 test
  npm notice run vitest run
  RUN  v3.2.7 /projects/StickStat
  ✓ tests/club-logo-management.test.ts (3 tests) 15ms
  ❯ tests/mobile-refresh-and-player-order.test.ts (3 tests | 1 failed) 123ms
  × mobiele refresh en spelersvolgorde > ververst met een eigen pull-gesture en houdt navigatie vast 112ms
  → expected '@import "tailwindcss";\n\n:root {\n  …' to contain 'overscroll-behavior-y: none'
  ✓ mobiele refresh en spelersvolgorde > sorteert operationele spelerslijsten primair op achternaam 1ms
  ✓ mobiele refresh en spelersvolgorde > houdt een beschikbare app-update zichtbaar in notificaties en kan het installatiescherm heropenen 1ms
  ✓ tests/parser.test.ts (3 tests) 148ms
  ✓ tests/statistics-rankings.test.ts (4 tests) 14ms
  ✓ tests/team-invites.test.ts (4 tests) 26ms
  ❯ tests/agenda-and-substitutes.test.ts (3 tests | 1 failed) 133ms
  ✓ invalspelers en agendaweergave > slaat invalspelers expliciet op en toont ze in een aparte lijst 15ms
  × invalspelers en agendaweergave > houdt afspraken tot na hun kalenderdag in Teamagenda 102ms
  → expected 'import { Fragment } from "react";\nim…' to contain '>Teamagenda'
  ✓ invalspelers en agendaweergave > gebruikt eigen datum- en tijdpopovers 2ms
  ✓ tests/team-account-role-picker.test.ts (8 tests) 27ms
  ✓ tests/account-linking-contract.test.ts (3 tests) 18ms
  ✓ tests/combined-account-binding.test.ts (2 tests) 12ms
  ✓ tests/matches-filters.test.ts (2 tests) 14ms
  ✓ tests/registration.test.ts (2 tests) 57ms
  ✓ tests/player-creation-form.test.ts (8 tests) 25ms
  ✓ tests/backup-deployment.test.ts (3 tests) 12ms
  ✓ tests/image-upload.test.ts (4 tests) 12ms
  ✓ tests/auto-deploy.test.ts (2 tests) 20ms
  ✓ tests/team-member-details.test.ts (4 tests) 11ms
  ✓ tests/team-selection.test.ts (3 tests) 13ms
  ✓ tests/player-membership-types.test.ts (4 tests) 29ms
  ✓ tests/overview-tables.test.ts (3 tests) 20ms
  ✓ tests/simple-match-entry.test.ts (3 tests) 15ms
  ✓ tests/authorization.test.ts (1 test) 8ms
  ✓ tests/statistics.test.ts (4 tests) 18ms
  ✓ tests/team-roles.test.ts (2 tests) 9ms
  ✓ tests/team-management-scope.test.ts (3 tests) 14ms
  ✓ tests/schema-safety.test.ts (2 tests) 13ms
  ✓ tests/direct-resource-authorization.test.ts (4 tests) 15ms
  ✓ tests/session-cookie.test.ts (2 tests) 12ms
  ✓ tests/dark-mode.test.ts (3 tests) 23ms
  ✓ tests/csrf.test.ts (2 tests) 11ms
  ✓ tests/team-selector-visibility.test.ts (1 test) 10ms
  ✓ tests/profile-logout.test.ts (1 test) 10ms
  ⎯⎯⎯⎯⎯⎯⎯ Failed Tests 2 ⎯⎯⎯⎯⎯⎯⎯
  FAIL  tests/agenda-and-substitutes.test.ts > invalspelers en agendaweergave > houdt afspraken tot na hun kalenderdag in Teamagenda
  AssertionError: expected 'import { Fragment } from "react";\nim…' to contain '>Teamagenda'

* Expected

* Received

* > Teamagenda
  >

* import { Fragment } from "react";
* import Link from "next/link";
* import { EmptyTeam } from "@/components/empty-team";
* import { MatchTeamLabel } from "@/components/match-team-label";
* import { PageShell } from "@/components/page-shell";
* import { TeamSelector } from "@/components/team-selector";
* import { TrainingCreateForm } from "@/components/training-create-form";
* import { db } from "@/lib/db";
* import { pageContext } from "@/lib/page-data";
* import { hasAnyTeamRole, teamManagementRoles } from "@/lib/team-roles";
*
* export const dynamic = "force-dynamic";
*
* const dateParts = new Intl.DateTimeFormat("nl-NL", {
* timeZone: "Europe/Amsterdam",
* year: "numeric",
* month: "2-digit",
* day: "2-digit",
* });
*
* function dateKey(date: Date) {
* const parts = Object.fromEntries(dateParts.formatToParts(date).map(part => [part.type, part.value]));
* return `${parts.year}-${parts.month}-${parts.day}`;
* }
*
* function weekStart(date: Date) {
* const local = new Date(`${dateKey(date)}T12:00:00`);
* const day = (local.getDay() + 6) % 7;
* local.setDate(local.getDate() - day);
* return local;
* }
*
* function weekKey(date: Date) {
* return dateKey(weekStart(date));
* }
*
* function weekLabel(date: Date) {
* const start = weekStart(date);
* const end = new Date(start);
* end.setDate(start.getDate() + 6);
* return `${start.toLocaleDateString("nl-NL", { day: "numeric", month: "short" })} – ${end.toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}`;
* }
*
* export default async function Agenda({ searchParams }: { searchParams: Promise<{ team?: string; view?: string }> }) {
* const query = await searchParams;
* const { user, teams, team } = await pageContext(query.team);
*
* if (!team) return <PageShell user={user}></PageShell>;
*
* const membership = user.teamMemberships.find(item => item.teamId === team.id);
* const canManage = user.platformRole === "admin" || Boolean(membership && hasAnyTeamRole(membership.roles, teamManagementRoles));
*
* const [matches, trainings] = await Promise.all([
* db.match.findMany({
* where: { OR: [{ homeTeamId: team.id }, { awayTeamId: team.id }] },
* include: { homeTeam: true, awayTeam: true, attendance: { where: { player: { teamId: team.id } } } },
* orderBy: { date: "asc" },
* }),
* db.training.findMany({
* where: { teamId: team.id },
* include: { attendance: true },
* orderBy: [{ date: "asc" }, { startTime: "asc" }],
* }),
* ]);
*
* const items = [
* ...matches.map(match => ({
* id: match.id,
* type: "match" as const,
* date: match.date,
* time: match.startTime,
* title: "",
* venue: match.venue,
* href: `/matches/${match.id}?team=${team.id}`,
* attendance: match.attendance,
* homeTeam: match.homeTeam,
* awayTeam: match.awayTeam,
* })),
* ...trainings.map(training => ({
* id: training.id,
* type: "training" as const,
* date: training.date,
* time: training.startTime,
* title: training.title,
* venue: training.venue,
* href: `/trainings/${training.id}?team=${team.id}`,
* attendance: training.attendance,
* homeTeam: null,
* awayTeam: null,
* })),
* ];
*
* const today = dateKey(new Date());
* const showPast = query.view === "past";
* const visibleItems = items
* .filter(item => showPast ? dateKey(item.date) < today : dateKey(item.date) >= today)
* .sort((a, b) => showPast ? b.date.getTime() - a.date.getTime() : a.date.getTime() - b.date.getTime());
*
* return (
* <PageShell user={user}></pageshell>
*
*
* <span className="eyebrow">Wedstrijden & trainingen</span>
*
*
* <TeamSelector teams={teams} current={team.id} />
*
*
* {canManage && }
*
*
*
*
* <Link
* className={!showPast ? "active" : ""}
* href={`/agenda?team=${team.id}`}
* >
* Teamagenda
*
* <Link
* className={showPast ? "active" : ""}
* href={`/agenda?team=${team.id}&view=past`}
* >
* Verlopen
*
*
*
*
*
* {visibleItems.map((item, index) => {
* const newWeek = index === 0 || weekKey(visibleItems[index - 1].date) !== weekKey(item.date);
* return (
* <Fragment key={`${item.type}-${item.id}`}>
* {newWeek && (
* <div className={`agenda-week-separator ${index === 0 ? "first" : ""}`}>
* <span>{weekLabel(item.date)}</span>
*
* )}
*
* <time></time>
* <strong>{item.date.toLocaleDateString("nl-NL", { day: "2-digit", month: "short" })}</strong>
* <span>{item.time ?? "–"}</span>
*
* <span></span>
* <small className={`agenda-type ${item.type}`}>
* {item.type === "match" ? "Wedstrijd" : "Training"}
*
* {item.type === "match" && item.homeTeam && item.awayTeam ? (
* <span className="agenda-match-teams"></span>
* <MatchTeamLabel
* name={item.homeTeam.shortName}
* own={item.homeTeam.id === team.id}
* side="home"
* />
* <span className="match-versus">–</span>
* <MatchTeamLabel
* name={item.awayTeam.shortName}
* own={item.awayTeam.id === team.id}
* side="away"
* />
*
* ) : (
* <strong>{item.title}</strong>
* )}
* <small>{item.venue ?? "Locatie onbekend"}</small>
*
*
*
* );
* })}
*
*
* {!visibleItems.length && (
*
* {showPast ? "Nog geen verlopen afspraken." : "Geen komende afspraken."}
*
* )}
*
*
* );
* }
* }
*

 ❯ tests/agenda-and-substitutes.test.ts:24:20
     22|     expect(agenda).toContain('dateKey(item.date) < today');
     23|     expect(agenda).toContain('dateKey(item.date) >= today');
     24|     expect(agenda).toContain('>Teamagenda');
       |                    ^
     25|     expect(agenda).toContain('>Verlopen');
     26|     expect(agenda).toContain("agenda-week-separator");
⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/2]⎯
 FAIL  tests/mobile-refresh-and-player-order.test.ts > mobiele refresh en spelersvolgorde > ververst met een eigen pull-gesture en houdt navigatie vast
AssertionError: expected '@import "tailwindcss";\n\n:root {\n  …' to contain 'overscroll-behavior-y: none'

* Expected

* Received

* overscroll-behavior-y: none

* @import "tailwindcss";
*
* :root {
* --ink: #10231d;
* --muted: #64756f;
* --line: #dce5df;
* --paper: #f5f7f4;
* --card: #ffffff;
* --lime: #c9f45b;
* --green: #0c5c42;
* --orange: #ff7043;
* }
*
* html[data-theme="dark"] {
* --ink: #e9f3ee;
* --muted: #9db1a8;
* --line: #2b453a;
* --paper: #0b1511;
* --card: #14231d;
* --green: #62d0a4;
* --orange: #ff8a66;
* color-scheme: dark
* }
*
* * {
* box-sizing: border-box
* }
*
* html {
* background: var(--paper);
* -webkit-text-size-adjust: 100%;
* overscroll-behavior: none;
* -webkit-user-select: none
* }
*
* body {
* margin: 0;
* min-width: 0;
* color: var(--ink);
* background: radial-gradient(circle at 85% -10%, #dcf6c4 0, transparent 30rem), var(--paper);
* font-family: Arial, Helvetica, sans-serif;
* overflow-x: hidden;
* -webkit-overflow-scrolling: touch
* }
*
* button,
* input,
* select,
* textarea {
* font: inherit
* }
*
* img,
* svg {
* max-width: 100%
* }
*
* .mono {
* font-variant-numeric: tabular-nums
* }
*
* .app-shell {
* min-height: 100vh;
* padding-top: 72px
* }
*
* .topbar {
* height: 72px;
* background: #092f25;
* color: white;
* display: flex;
* align-items: center;
* padding: 0 clamp(18px, 4vw, 56px);
* position: fixed;
* top: 0;
* left: 0;
* right: 0;
* z-index: 20;
* box-shadow: 0 8px 30px #092f2522
* }
*
* .brand {
* display: flex;
* align-items: center;
* gap: 11px;
* color: white;
* text-decoration: none;
* font-weight: 900;
* letter-spacing: -.04em;
* font-size: 24px
* }
*
* .brand-mark {
* width: 38px;
* height: 38px;
* flex: 0 0 auto;
* border-radius: 12px;
* background: var(--lime);
* color: #092f25;
* display: grid;
* place-items: center;
* transform: rotate(-4deg)
* }
*
* .topnav {
* display: flex;
* margin-left: auto;
* gap: 5px
* }
*
* .topnav a {
* color: #d8e8e1;
* text-decoration: none;
* padding: 10px 12px;
* border-radius: 10px;
* font-size: 14px;
* font-weight: 700
* }
*
* .topnav a:hover {
* background: #ffffff14;
* color: white
* }
*
* .topnav a[aria-current="page"] {
* background: var(--lime);
* color: #092f25
* }
*
* .avatar {
* margin-left: 18px;
* width: 36px;
* height: 36px;
* border-radius: 50%;
* display: grid;
* place-items: center;
* background: #1a6f55;
* border: 2px solid #ffffff33;
* font-weight: 800
* }
*
* .mobile-nav {
* display: none
* }
*
* .pull-refresh {
* --pull-distance: 0px;
* position: fixed;
* z-index: 19;
* top: 78px;
* left: 50%;
* display: flex;
* align-items: center;
* gap: 7px;
* padding: 8px 12px;
* border: 1px solid var(--line);
* border-radius: 999px;
* background: var(--card);
* color: var(--muted);
* box-shadow: 0 10px 30px #092f2530;
* font-size: 11px;
* font-weight: 850;
* opacity: 0;
* pointer-events: none;
* transform: translate(-50%, calc(-54px + var(--pull-distance)));
* transition: opacity .12s ease, color .12s ease
* }
*
* .pull-refresh.visible {
* opacity: 1
* }
*
* .pull-refresh.ready {
* color: var(--green)
* }
*
* .pull-refresh.ready svg {
* transform: rotate(180deg)
* }
*
* .pull-refresh.refreshing svg {
* animation: pull-refresh-spin .7s linear infinite
* }
*
* @keyframes pull-refresh-spin {
* to {
* transform: rotate(360deg)
* }
* }
*
* .app-version-footer {
* display: flex;
* justify-content: center;
* gap: 8px 18px;
* flex-wrap: wrap;
* padding: 24px 12px 4px;
* color: var(--muted);
* font-size: 11px;
* text-align: center
* }
*
* .content {
* width: 100%;
* max-width: 1420px;
* margin: auto;
* padding: 34px clamp(18px, 4vw, 56px) 70px
* }
*
* .eyebrow {
* text-transform: uppercase;
* letter-spacing: .14em;
* font-size: 11px;
* font-weight: 900;
* color: var(--green)
* }
*
* h1,
* h2,
* h3,
* p {
* margin-top: 0
* }
*
* h1 {
* font-size: clamp(30px, 4vw, 48px);
* overflow-wrap: anywhere;
* letter-spacing: -.045em;
* margin-bottom: 8px;
* line-height: 1
* }
*
* h2 {
* font-size: 22px;
* overflow-wrap: anywhere;
* letter-spacing: -.025em
* }
*
* .muted {
* color: var(--muted)
* }
*
* .page-head {
* display: flex;
* align-items: flex-end;
* justify-content: space-between;
* gap: 20px;
* margin-bottom: 28px
* }
*
* .page-head>*,
* .card-head>* {
* min-width: 0
* }
*
* .team-switch {
* max-width: 100%;
* border: 1px solid var(--line);
* background: white;
* padding: 11px 36px 11px 14px;
* border-radius: 12px;
* color: var(--ink);
* font-weight: 750;
* box-shadow: 0 4px 14px #183a2f0a
* }
*
* .hero {
* background: linear-gradient(120deg, #0b4a38, #0b3329);
* color: white;
* border-radius: 28px;
* padding: clamp(24px, 4vw, 42px);
* display: grid;
* grid-template-columns: 1.3fr 1fr;
* gap: 28px;
* overflow: hidden;
* position: relative;
* box-shadow: 0 24px 60px #153c2c22
* }
*
* .hero:after {
* content: "";
* position: absolute;
* width: 280px;
* height: 280px;
* border: 70px solid #c9f45b1c;
* border-radius: 50%;
* right: -60px;
* top: -95px
* }
*
* .team-title {
* display: flex;
* align-items: center;
* gap: 18px;
* min-width: 0
* }
*
* .team-title>div:last-child {
* min-width: 0
* }
*
* .logo {
* width: 64px;
* height: 64px;
* flex: 0 0 auto;
* border-radius: 19px;
* background: white;
* color: var(--green);
* display: grid;
* place-items: center;
* object-fit: contain;
* font-size: 22px;
* font-weight: 950;
* box-shadow: inset 0 0 0 1px #dce5df
* }
*
* .hero .logo {
* width: 76px;
* height: 76px
* }
*
* .hero h1 {
* margin: 0;
* color: white
* }
*
* .hero p {
* color: #c7ddd5;
* margin: 8px 0 0;
* overflow-wrap: anywhere
* }
*
* .rank-block {
* display: flex;
* align-items: end;
* justify-content: flex-end;
* gap: 25px;
* position: relative;
* z-index: 2
* }
*
* .rank-number {
* font-size: 88px;
* line-height: .8;
* font-weight: 950;
* color: var(--lime);
* letter-spacing: -.08em
* }
*
* .rank-label {
* font-size: 12px;
* text-transform: uppercase;
* letter-spacing: .1em;
* color: #bdd2ca;
* font-weight: 800;
* margin-bottom: 7px
* }
*
* .match-scoreboard {
* display: flex;
* align-items: center;
* justify-content: center;
* gap: clamp(18px, 5vw, 60px);
* position: relative;
* z-index: 2
* }
*
* .match-hero {
* grid-template-columns: 1fr;
* text-align: center
* }
*
* .match-score-divider {
* color: white
* }
*
* .match-score-team {
* display: grid;
* justify-items: center;
* gap: 10px;
* min-width: 0
* }
*
* .match-score-team strong {
* overflow-wrap: anywhere
* }
*
* .match-score {
* font-size: clamp(42px, 8vw, 82px)
* }
*
* .metrics {
* display: grid;
* grid-template-columns: repeat(6, minmax(0, 1fr));
* gap: 12px;
* margin: 18px 0 28px
* }
*
* .match-metrics {
* grid-template-columns: repeat(4, minmax(0, 1fr))
* }
*
* .metric,
* .card {
* min-width: 0;
* background: var(--card);
* border: 1px solid var(--line);
* border-radius: 18px;
* box-shadow: 0 9px 26px #13382a0b
* }
*
* .metric {
* padding: 18px
* }
*
* .metric span {
* display: block;
* color: var(--muted);
* font-size: 12px;
* font-weight: 750;
* margin-bottom: 8px
* }
*
* .metric strong {
* display: block;
* font-size: 28px;
* overflow-wrap: anywhere;
* letter-spacing: -.05em
* }
*
* .grid-2 {
* display: grid;
* grid-template-columns: 1.4fr 1fr;
* gap: 18px
* }
*
* .card {
* padding: 22px
* }
*
* .card-head {
* display: flex;
* align-items: center;
* justify-content: space-between;
* gap: 12px;
* margin-bottom: 18px
* }
*
* .card-head h2 {
* margin: 0
* }
*
* .link {
* color: var(--green);
* text-decoration: none;
* font-weight: 800;
* font-size: 13px
* }
*
* .form-row {
* display: flex;
* gap: 8px;
* flex-wrap: wrap
* }
*
* .form-dot {
* width: 34px;
* height: 34px;
* border-radius: 50%;
* display: grid;
* place-items: center;
* font-weight: 900;
* font-size: 12px
* }
*
* .W {
* background: #dff8a5;
* color: #315207
* }
*
* .G {
* background: #e7ece9;
* color: #4e5f59
* }
*
* .V {
* background: #ffe0d7;
* color: #a63415
* }
*
* .match-row {
* display: grid;
* grid-template-columns: 82px minmax(0, 1fr) auto;
* align-items: center;
* gap: 15px;
* padding: 15px 0;
* border-top: 1px solid var(--line)
* }
*
* .match-row:first-of-type {
* border-top: 0
* }
*
* .match-date {
* color: var(--muted);
* font-size: 12px
* }
*
* .teams {
* display: flex;
* align-items: center;
* gap: 7px;
* min-width: 0;
* font-weight: 750;
* white-space: nowrap
* }
*
* .teams span {
* overflow-wrap: anywhere
* }
*
* .teams .match-team-identity {
* width: auto
* }
*
* .next-match {
* padding: 26px 0
* }
*
* .next-match-teams,
* .last-result,
* .agenda-match-teams {
* display: flex;
* align-items: center;
* gap: 8px;
* flex-wrap: nowrap;
* min-width: 0
* }
*
* .next-match-teams {
* margin: 14px 0
* }
*
* .last-result {
* margin-top: 8px
* }
*
* .agenda-match-teams {
* margin-top: 5px
* }
*
* .score {
* font-size: 22px;
* font-weight: 950;
* letter-spacing: .05em
* }
*
* .badge {
* display: inline-flex;
* align-items: center;
* font-size: 11px;
* font-weight: 850;
* padding: 5px 8px;
* border-radius: 99px;
* background: #eaf2ed;
* color: var(--green)
* }
*
* .badge.accent {
* background: var(--lime)
* }
*
* table {
* width: 100%;
* border-collapse: collapse
* }
*
* th {
* text-align: left;
* color: var(--muted);
* font-size: 11px;
* text-transform: uppercase;
* letter-spacing: .08em;
* padding: 10px
* }
*
* td {
* padding: 13px 10px;
* border-top: 1px solid var(--line);
* font-size: 14px
* }
*
* .active-row {
* background: #eefbd2
* }
*
* .player-grid {
* display: grid;
* grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
* gap: 16px
* }
*
* .player-card {
* display: block;
* color: inherit;
* text-decoration: none;
* background: white;
* border: 1px solid var(--line);
* border-radius: 20px;
* padding: 20px;
* transition: .18s
* }
*
* .player-card:hover {
* transform: translateY(-3px);
* box-shadow: 0 16px 35px #17392d18
* }
*
* .player-top {
* display: flex;
* align-items: center;
* gap: 13px;
* min-width: 0
* }
*
* .player-top>div {
* min-width: 0
* }
*
* .player-photo {
* width: 52px;
* height: 52px;
* flex: 0 0 auto;
* border-radius: 16px;
* background: #e7efe9;
* display: grid;
* place-items: center;
* font-weight: 900;
* color: var(--green)
* }
*
* .player-number {
* margin-left: auto;
* font-size: 26px;
* font-weight: 950;
* color: #b7c4bf
* }
*
* .stat-strip {
* display: flex;
* gap: 20px;
* margin-top: 18px;
* padding-top: 16px;
* border-top: 1px solid var(--line)
* }
*
* .stat-strip strong,
* .stat-strip span {
* display: block
* }
*
* .stat-strip span {
* font-size: 10px;
* color: var(--muted);
* text-transform: uppercase;
* margin-top: 3px
* }
*
* .filters {
* display: flex;
* gap: 10px;
* margin-bottom: 18px;
* flex-wrap: wrap
* }
*
* .page-head-tools {
* display: flex;
* align-items: center;
* justify-content: flex-end;
* gap: 10px
* }
*
* .match-filters {
* position: relative;
* width: max-content;
* max-width: 100%;
* margin: 0
* }
*
* .match-filters summary {
* position: relative;
* list-style: none
* }
*
* .filter-trigger {
* flex: 0 0 auto
* }
*
* .match-filters[open] .filter-trigger {
* background: var(--green);
* color: white
* }
*
* .filter-count {
* min-width: 17px;
* height: 17px;
* display: inline-grid;
* place-items: center;
* position: absolute;
* top: -6px;
* right: -6px;
* border-radius: 999px;
* background: var(--orange);
* color: white;
* font-size: 10px;
* box-shadow: 0 0 0 2px var(--paper)
* }
*
* .match-filters summary::-webkit-details-marker {
* display: none
* }
*
* .match-filter-popup {
* position: absolute;
* z-index: 10;
* top: calc(100% + 8px);
* right: 0;
* display: grid;
* gap: 12px;
* width: min(390px, calc(100vw - 28px));
* padding: 18px;
* border: 1px solid var(--line);
* border-radius: 18px;
* background: var(--card);
* box-shadow: 0 22px 60px #17392d2e
* }
*
* .match-filter-head {
* display: flex;
* align-items: center;
* justify-content: space-between;
* gap: 12px;
* padding-bottom: 12px;
* border-bottom: 1px solid var(--line)
* }
*
* .match-filter-head strong {
* display: block;
* margin-top: 3px;
* font-size: 18px
* }
*
* .match-filter-popup label {
* display: grid;
* gap: 6px;
* color: var(--muted);
* font-size: 12px;
* font-weight: 800
* }
*
* .filter-select-grid {
* display: grid;
* grid-template-columns: 1fr 1fr;
* gap: 10px
* }
*
* .filter-search {
* display: flex;
* align-items: center;
* gap: 9px;
* border: 1px solid var(--line);
* border-radius: 12px;
* padding-left: 12px;
* background: var(--card);
* color: var(--muted)
* }
*
* .filter-search:focus-within {
* border-color: var(--green);
* box-shadow: 0 0 0 3px #0c5c4214
* }
*
* .filter-search .input {
* border: 0;
* padding-left: 0;
* box-shadow: none
* }
*
* .match-filter-popup .input {
* width: 100%;
* min-width: 0
* }
*
* .clear-filters {
* width: 100%
* }
*
* .match-teams {
* display: inline-flex;
* align-items: center;
* gap: 7px;
* color: inherit;
* text-decoration: none
* }
*
* .match-team-identity {
* display: inline-block;
* min-width: 0;
* overflow: hidden;
* text-overflow: ellipsis;
* white-space: nowrap;
* line-height: inherit
* }
*
* .match-team-identity.is-own {
* color: var(--green);
* font-weight: 950;
* text-decoration: underline;
* text-decoration-color: var(--lime);
* text-decoration-thickness: 3px;
* text-underline-offset: 3px
* }
*
* .match-team-identity.is-opponent {
* color: var(--muted);
* font-weight: 700
* }
*
* .own-team {
* display: inline-grid;
* gap: 1px;
* color: var(--green);
* font-weight: 900
* }
*
* .own-team small {
* color: var(--muted);
* font-size: 10px;
* font-weight: 800;
* text-transform: uppercase
* }
*
* .matches-table-card tbody tr {
* transition: background .15s ease
* }
*
* .matches-table-card tbody tr:hover {
* background: #f2f7f4
* }
*
* .standings-card {
* overflow-x: auto
* }
*
* .standings-table .team-name {
* min-width: 210px;
* white-space: nowrap
* }
*
* .standings-table .goal-difference,
* .standings-table .points {
* font-variant-numeric: tabular-nums
* }
*
* .standings-table .points {
* background: transparent
* }
*
* .standings-table .points strong {
* display: inline-grid;
* min-width: 34px;
* height: 34px;
* place-items: center;
* border-radius: 10px;
* background: #eaf2ed;
* color: var(--green)
* }
*
* .detail-toggle {
* display: inline-flex;
* align-items: center;
* gap: 9px;
* min-height: 38px;
* padding: 0;
* border: 0;
* background: transparent;
* color: var(--muted);
* font-size: 12px;
* font-weight: 850;
* cursor: pointer
* }
*
* .detail-toggle i {
* width: 42px;
* height: 24px;
* padding: 3px;
* border-radius: 999px;
* background: #cfdad4;
* transition: background .18s ease
* }
*
* .detail-toggle b {
* display: block;
* width: 18px;
* height: 18px;
* border-radius: 50%;
* background: white;
* box-shadow: 0 2px 6px #092f2530;
* transition: transform .18s ease
* }
*
* .detail-toggle[aria-checked="true"] {
* color: var(--green)
* }
*
* .detail-toggle[aria-checked="true"] i {
* background: var(--green)
* }
*
* .detail-toggle[aria-checked="true"] b {
* transform: translateX(18px)
* }
*
* .detail-toggle:focus-visible {
* outline: 2px solid var(--green);
* outline-offset: 4px;
* border-radius: 6px
* }
*
* .opponent-team,
* .match-versus {
* color: var(--muted)
* }
*
* .input {
* max-width: 100%;
* border: 1px solid var(--line);
* background: white;
* padding: 12px 14px;
* border-radius: 12px;
* min-width: 180px;
* color: var(--ink)
* }
*
* .button {
* min-height: 42px;
* border: 0;
* border-radius: 12px;
* background: var(--green);
* color: white;
* font-weight: 850;
* padding: 12px 16px;
* cursor: pointer
* }
*
* .button:hover {
* background: #084735
* }
*
* .button:disabled {
* opacity: .5
* }
*
* .button.secondary {
* background: #e6eee9;
* color: var(--green)
* }
*
* .empty {
* text-align: center;
* padding: 52px 20px;
* color: var(--muted)
* }
*
* .login-page {
* min-height: 100svh;
* display: grid;
* grid-template-columns: 1.05fr .95fr
* }
*
* .login-brand {
* background: linear-gradient(145deg, #073d2e, #0c6145);
* color: white;
* padding: clamp(35px, 7vw, 90px);
* display: flex;
* flex-direction: column;
* justify-content: space-between;
* overflow: hidden;
* position: relative
* }
*
* .login-brand:after {
* content: "";
* width: 520px;
* height: 520px;
* border: 100px solid #c9f45b1d;
* border-radius: 50%;
* position: absolute;
* right: -200px;
* bottom: -150px
* }
*
* .login-brand h1 {
* font-size: clamp(52px, 7vw, 92px);
* max-width: 680px;
* position: relative;
* z-index: 2
* }
*
* .login-brand p {
* color: #c9ddd5;
* font-size: 18px
* }
*
* .login-panel {
* display: grid;
* place-items: center;
* padding: 30px
* }
*
* .login-form {
* width: min(420px, 100%)
