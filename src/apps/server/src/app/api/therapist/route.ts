import { NextResponse } from "next/server";
import z from "zod";
import { withAuth } from "@/lib/auth/with-auth";
import { db } from "@/lib/db";
import { therapist } from "@/lib/db/schema/therapist";

export const PUT = withAuth(
	async ({ session, body }) => {
		await db
			.insert(therapist)
			.values({
				userId: session.user.id,
				specialtyId: body.specialtyId,
				licenseNumber: body.licenseNumber,
				bio: body.bio,
				experience: body.experience,
			})
			.onConflictDoUpdate({
				target: therapist.userId,
				set: {
					specialtyId: body.specialtyId,
					licenseNumber: body.licenseNumber,
					bio: body.bio,
					experience: body.experience,
					updatedAt: new Date(),
				},
			});
		return NextResponse.json({
			message: "Therapist created",
		});
	},
	{
		bodySchema: z.object({
			specialtyId: z.uuid(),
			licenseNumber: z.string().min(1).max(50),
			bio: z.string().max(1000).optional(),
			experience: z.number().min(0).max(100).optional(),
		}),
	},
	(_error) => {
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	},
);
