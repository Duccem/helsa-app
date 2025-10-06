import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import z from "zod";
import { withAuth } from "@/lib/auth/with-auth";
import { db } from "@/lib/db";
import { price, therapist } from "@/lib/db/schema/therapist";
import { AppError } from "@/lib/error";

// Schema for creating/updating the therapist price
const priceSchema = z.object({
	amount: z.number().positive("Amount must be greater than 0"),
});

// Idempotent create/update (PUT) so therapists can set or change their price.
export const PUT = withAuth(
	async ({ session, body }) => {
		// Ensure therapist profile exists for the authenticated user
		const existingTherapist = await db
			.select({ id: therapist.id })
			.from(therapist)
			.where(eq(therapist.userId, session.user.id))
			.limit(1);

		if (existingTherapist.length === 0) {
			throw new AppError("Therapist profile not found", "THERAPIST_NOT_FOUND");
		}

		const therapistId = existingTherapist[0].id;

		// Upsert price (unique per therapist)
		await db
			.insert(price)
			.values({ therapistId, amount: body.amount })
			.onConflictDoUpdate({
				target: price.therapistId,
				set: { amount: body.amount, updatedAt: new Date() },
			});

		return NextResponse.json({ message: "Price saved" });
	},
	{ bodySchema: priceSchema },
	(error: AppError) => {
		switch (error.code) {
			case "THERAPIST_NOT_FOUND":
				return NextResponse.json(
					{ error: "Therapist profile not found" },
					{ status: 404 },
				);
			default:
				return NextResponse.json(
					{ error: "Internal Server Error" },
					{ status: 500 },
				);
		}
	},
);
