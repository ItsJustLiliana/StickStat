import { z } from "zod";
import { apiError, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { clubSlug } from "@/lib/team-names";
import { syncTeam } from "@/services/sync";

const schema = z.object({ provider: z.enum(["hockeystanden", "hockey-belgium"]), clubId: z.string().min(1).max(160), clubName: z.string().min(1).max(160), name: z.string().min(1).max(120), shortName: z.string().min(1).max(160), identifier: z.string().min(1).max(200) });
export async function POST(request: Request) {
  try {
    const user = await requireUser(), data = schema.parse(await request.json());
    const slug = `${data.provider === "hockeystanden" ? "nl" : "be"}-${clubSlug(data.clubName)}`;
    const knownClub = await db.club.findFirst({ where: { externalProvider: data.provider, externalIdentifier: data.clubId } });
    const club = knownClub ? await db.club.update({ where: { id: knownClub.id }, data: { name: data.clubName } }) : await db.club.upsert({ where: { slug }, update: { name: data.clubName, externalProvider: data.provider, externalIdentifier: data.clubId }, create: { name: data.clubName, slug, externalProvider: data.provider, externalIdentifier: data.clubId } });
    const team = await db.team.upsert({ where: { clubId_name: { clubId: club.id, name: data.name } }, update: { shortName: data.shortName, externalProvider: data.provider, externalIdentifier: data.identifier }, create: { clubId: club.id, name: data.name, shortName: data.shortName, externalProvider: data.provider, externalIdentifier: data.identifier } });
    await db.favoriteTeam.upsert({ where: { userId_teamId: { userId: user.id, teamId: team.id } }, update: {}, create: { userId: user.id, teamId: team.id } });
    try { await syncTeam(team.id); } catch { /* The team remains followed and is retried by the scheduler. */ }
    return ok({ clubId: club.id, teamId: team.id }, { status: 201 });
  } catch (error) { return apiError(error); }
}
