import { apiError, HttpError, ok } from "@/lib/api";
import { hashPassword, requirePlatformAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { usernameSchema } from "@/lib/validation";

const patchSchema = z.object({
    name: z.string().min(2).max(120).optional(),
    username: usernameSchema.optional(),
    platformRole: z.enum(["admin", "user"]).optional(),
}).refine(obj => Object.keys(obj).length > 0, "At least one field must be provided");

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        await requirePlatformAdmin();
        const { userId } = await params;
        const input = patchSchema.parse(await request.json());

        const user = await db.user.findUnique({ where: { id: userId } });
        if (!user) throw new HttpError(404, "USER_NOT_FOUND", "Gebruiker niet gevonden");

        // Check if username is already taken by another user
        if (input.username) {
            const existing = await db.user.findUnique({ where: { username: input.username } });
            if (existing && existing.id !== userId) {
                throw new HttpError(400, "USERNAME_TAKEN", "Deze gebruikersnaam is al in gebruik");
            }
        }

        const updated = await db.user.update({
            where: { id: userId },
            data: input,
            select: { id: true, name: true, username: true, platformRole: true },
        });

        return ok(updated);
    } catch (error) {
        return apiError(error);
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        await requirePlatformAdmin();
        const { userId } = await params;

        const user = await db.user.findUnique({ where: { id: userId } });
        if (!user) throw new HttpError(404, "USER_NOT_FOUND", "Gebruiker niet gevonden");

        // Prevent deleting the last admin
        const adminCount = await db.user.count({ where: { platformRole: "admin" } });
        if (user.platformRole === "admin" && adminCount === 1) {
            throw new HttpError(400, "LAST_ADMIN", "Kan de laatste admin niet verwijderen");
        }

        // Delete user (cascades will handle related records)
        await db.user.delete({ where: { id: userId } });

        return ok({ deleted: true });
    } catch (error) {
        return apiError(error);
    }
}

// Generate temporary password for password reset
export async function POST(
    request: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        await requirePlatformAdmin();
        const { userId } = await params;

        const user = await db.user.findUnique({ where: { id: userId } });
        if (!user) throw new HttpError(404, "USER_NOT_FOUND", "Gebruiker niet gevonden");

        // Generate a temporary password (12 random characters)
        const tempPassword = Array.from(crypto.getRandomValues(new Uint8Array(12)))
            .map(b => ((b % 36) < 10 ? String.fromCharCode(48 + (b % 36)) : String.fromCharCode(97 + (b % 36 - 10))))
            .join("");

        const passwordHash = await hashPassword(tempPassword);
        await db.user.update({ where: { id: userId }, data: { passwordHash } });

        return ok({ tempPassword }, { status: 201 });
    } catch (error) {
        return apiError(error);
    }
}
