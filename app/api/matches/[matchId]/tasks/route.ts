import {apiError, HttpError, ok} from "@/lib/api";
import {authorizeTeamAdmin} from "@/lib/auth";
import {db} from "@/lib/db";
import {createMatchTaskSchema, deleteMatchTaskSchema} from "@/lib/match-tasks";

async function verifyMatchTeam(matchId: string, teamId: string) {
  const match = await db.match.findUnique({where: {id: matchId}, select: {homeTeamId: true, awayTeamId: true}});
  if (!match || ![match.homeTeamId, match.awayTeamId].includes(teamId)) throw new HttpError(404, "NOT_FOUND", "Wedstrijd niet gevonden");
}

export async function POST(request: Request, {params}: {params: Promise<{matchId: string}>}) {
  try {
    const [{matchId}, input] = await Promise.all([params, request.json().then(value => createMatchTaskSchema.parse(value))]);
    await authorizeTeamAdmin(input.teamId);
    await verifyMatchTeam(matchId, input.teamId);
    const member = await db.teamMembership.findUnique({where: {userId_teamId: {userId: input.userId, teamId: input.teamId}}, select: {id: true}});
    if (!member) throw new HttpError(400, "INVALID_TEAM_MEMBER", "Kies een lid van dit team");
    return ok(await db.matchTask.create({data: {matchId, ...input}, include: {user: {select: {id: true, name: true}}}}));
  } catch (error) { return apiError(error); }
}

export async function DELETE(request: Request, {params}: {params: Promise<{matchId: string}>}) {
  try {
    const [{matchId}, input] = await Promise.all([params, request.json().then(value => deleteMatchTaskSchema.parse(value))]);
    await authorizeTeamAdmin(input.teamId);
    await verifyMatchTeam(matchId, input.teamId);
    const result = await db.matchTask.deleteMany({where: {id: input.taskId, matchId, teamId: input.teamId}});
    if (result.count !== 1) throw new HttpError(404, "NOT_FOUND", "Taak niet gevonden");
    return ok({deleted: true});
  } catch (error) { return apiError(error); }
}
