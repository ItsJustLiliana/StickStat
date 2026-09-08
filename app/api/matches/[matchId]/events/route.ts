import { apiError, HttpError, ok } from "@/lib/api";
import { authorizeTeamManagement } from "@/lib/auth";
import { db } from "@/lib/db";
import { eventSchema } from "@/lib/validation";
import { z } from "zod";

const editSchema = eventSchema.extend({ eventId: z.string().cuid() });
const deleteSchema = z.object({ eventId: z.string().cuid(), teamId: z.string().cuid() });

async function matchAndAuthorize(matchId: string, teamId: string) {
  const match = await db.match.findUnique({ where: { id: matchId } });
  if (!match) throw new HttpError(404, "NOT_FOUND", "Wedstrijd niet gevonden");
  if (![match.homeTeamId, match.awayTeamId].includes(teamId)) throw new HttpError(400, "TEAM_NOT_IN_MATCH", "Dit team speelt niet in deze wedstrijd");
  await authorizeTeamManagement(teamId);
}

async function validatePlayers(teamId: string, playerIds: (string | null | undefined)[]) {
  const ids = [...new Set(playerIds.filter((id): id is string => Boolean(id)))];
  if (!ids.length) return;
  const count = await db.player.count({ where: { id: { in: ids }, teamId } });
  if (count !== ids.length) throw new HttpError(400, "PLAYER_TEAM_MISMATCH", "Niet alle spelers horen bij dit team");
}

async function assertOwnedEvent(matchId: string, eventId: string, teamId: string) {
  const event = await db.matchEvent.findFirst({ where: { id: eventId, matchId }, include: { player: { select: { teamId: true } }, relatedPlayer: { select: { teamId: true } } } });
  if (!event) throw new HttpError(404, "NOT_FOUND", "Gebeurtenis niet gevonden");
  if (event.player?.teamId !== teamId && event.relatedPlayer?.teamId !== teamId) throw new HttpError(403, "FORBIDDEN", "Deze gebeurtenis hoort niet bij dit team");
}

async function keepOneMvp(matchId: string, teamId: string, exceptId?: string) {
  const existing = await db.matchEvent.findMany({ where: { matchId, type: "mvp", ...(exceptId ? { id: { not: exceptId } } : {}) }, include: { player: { select: { teamId: true } } } });
  const ids = existing.filter(event => event.player?.teamId === teamId).map(event => event.id);
  if (ids.length) await db.matchEvent.deleteMany({ where: { id: { in: ids } } });
}

function validateEvent(data: z.infer<typeof eventSchema>) {
  if ((data.type === "goal" || data.type === "save" || data.type === "mvp" || data.type === "custom" || data.type.endsWith("_card")) && !data.playerId) throw new HttpError(400, "PLAYER_REQUIRED", "Kies een speler");
  if (data.type === "custom" && !data.notes) throw new HttpError(400, "NOTE_REQUIRED", "Vul een notitie in");
}

export async function POST(request: Request, { params }: { params: Promise<{ matchId: string }> }) {
  try {
    const { matchId } = await params, body = await request.json(), teamId = z.string().cuid().parse(body.teamId), data = eventSchema.parse(body);
    await matchAndAuthorize(matchId, teamId); validateEvent(data); await validatePlayers(teamId, [data.playerId, data.relatedPlayerId]);
    if (data.type === "mvp") await keepOneMvp(matchId, teamId);
    return ok(await db.matchEvent.create({ data: { matchId, ...data } }), { status: 201 });
  } catch (error) { return apiError(error); }
}

export async function PUT(request: Request, { params }: { params: Promise<{ matchId: string }> }) {
  try {
    const { matchId } = await params, body = await request.json(), teamId = z.string().cuid().parse(body.teamId), data = editSchema.parse(body);
    await matchAndAuthorize(matchId, teamId); await assertOwnedEvent(matchId, data.eventId, teamId); validateEvent(data); await validatePlayers(teamId, [data.playerId, data.relatedPlayerId]);
    if (data.type === "mvp") await keepOneMvp(matchId, teamId, data.eventId);
    const { eventId, ...update } = data;
    return ok(await db.matchEvent.update({ where: { id: eventId }, data: update }));
  } catch (error) { return apiError(error); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ matchId: string }> }) {
  try {
    const { matchId } = await params, input = deleteSchema.parse(await request.json());
    await matchAndAuthorize(matchId, input.teamId); await assertOwnedEvent(matchId, input.eventId, input.teamId);
    await db.matchEvent.delete({ where: { id: input.eventId } });
    return ok({ deleted: true });
  } catch (error) { return apiError(error); }
}
