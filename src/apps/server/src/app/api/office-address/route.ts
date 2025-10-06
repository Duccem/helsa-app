import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import z from "zod";
import { withAuth } from "@/lib/auth/with-auth";
import { db } from "@/lib/db";
import { office_address, therapist } from "@/lib/db/schema/therapist";
import { AppError } from "@/lib/error";

// Schema for creating/updating the therapist office address
// Location kept strict with lat/lng fields; adjust if broader shape is needed later.
const officeAddressSchema = z.object({
	address: z.string().min(1).max(500),
	location: z.object({
		lat: z.number().min(-90).max(90),
		lng: z.number().min(-180).max(180),
	}),
});

export const PUT = withAuth(
	async ({ session, body }) => {
		const existingTherapist = await db
			.select({ id: therapist.id })
			.from(therapist)
			.where(eq(therapist.userId, session.user.id))
			.limit(1);

		if (existingTherapist.length === 0) {
			throw new AppError("Therapist profile not found", "THERAPIST_NOT_FOUND");
		}

		const therapistId = existingTherapist[0].id;

		await db
			.insert(office_address)
			.values({
				therapistId,
				address: body.address,
				location: body.location,
			})
			.onConflictDoUpdate({
				target: office_address.therapistId,
				set: {
					address: body.address,
					location: body.location,
					updatedAt: new Date(),
				},
			});

		return NextResponse.json({ message: "Office address saved" });
	},
	{ bodySchema: officeAddressSchema },
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
