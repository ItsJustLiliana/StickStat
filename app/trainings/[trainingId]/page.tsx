import { CalendarDays, Clock3, MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { AttendanceList } from "@/components/attendance-list";
import { PageShell } from "@/components/page-shell";
import { pageContext } from "@/lib/page-data";
import { db } from "@/lib/db";
import { hasAnyTeamRole, teamManagementRoles } from "@/lib/team-roles";

export const dynamic = "force-dynamic";

export default async function TrainingDetail({ params, searchParams }: { params: Promise<{ trainingId: string }>; searchParams: Promise<{ team?: string }> }) {
  const [{ trainingId }, query] = await Promise.all([params, searchParams]), { user, teams } = await pageContext(query.team), training = await db.training.findUnique({ where: { id: trainingId }, include: { team: true, attendance: true } });
  if (!training || !teams.some(team => team.id === training.teamId)) notFound();
  const membership = user.teamMemberships.find(item => item.teamId === training.teamId), canManage = user.platformRole === "admin" || Boolean(membership && hasAnyTeamRole(membership.roles, teamManagementRoles));
  const canAdmin = user.platformRole === "admin" || Boolean(membership?.roles.includes("team_admin"));
  const players = await db.player.findMany({ where: { teamId: training.teamId, active: true, trainingMember: true }, include: { user: { select: { photoPath: true } } }, orderBy: [{ lastName: "asc" }, { namePrefix: "asc" }, { firstName: "asc" }] }), status = new Map(training.attendance.map(item => [item.playerId, item.status]));
  const people = players.map(player => ({ playerId: player.id, name: player.displayName, photoPath: player.user?.photoPath ?? player.photoPath, status: status.get(player.id) ?? "unknown" as const, editable: canManage || player.userId === user.id, isSubstitute: player.isSubstitute }));
  return <PageShell user={user}>
    <section className="training-header">
      <div className="training-heading"><span className="training-header-icon"><CalendarDays size={28} /></span><div><span className="eyebrow">{training.team.name}</span><h1>{training.title}</h1></div></div>
      <div className="training-facts"><span><CalendarDays size={17} />{training.date.toLocaleDateString("nl-NL", { timeZone: "Europe/Amsterdam", weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span><span><Clock3 size={17} />{training.startTime ?? "Tijd onbekend"}{training.endTime && ` \u2013 ${training.endTime}`}</span><span><MapPin size={17} />{training.venue ?? "Locatie onbekend"}</span></div>
      {training.notes && <p className="training-notes">{training.notes}</p>}
    </section>
    <AttendanceList endpoint={`/api/trainings/${training.id}/attendance`} canAdmin={canAdmin} locked={training.attendanceLocked} teamId={training.teamId} people={people} />
  </PageShell>;
}
