import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import z from "zod";
import { withAuth } from "@/lib/auth/with-auth";
import { db } from "@/lib/db";
import { patient, sleep } from "@/lib/db/schema/patient";

const _saveSleepSchema = z.object({
	patientId: z.uuid(),
	durationMinutes: z.string(),
	quality: z.string(),
	date: z.string().optional(), // ISO date string
});

export const POST = withAuth(
	async ({ body }) => {
		try {
			await db.insert(sleep).values({
				patientId: body.patientId,
				durationMinutes: body.durationMinutes,
				quality: body.quality,
				date: body.date ? new Date(body.date) : new Date(),
			});
			return NextResponse.json({ success: true });
		} catch (error) {
			console.error("Error saving sleep:", error);
			return NextResponse.json(
				{ error: "An error occurred while saving sleep." },
				{ status: 500 },
			);
		}
	},
	{ bodySchema: _saveSleepSchema },
);

export const GET = withAuth(async ({ session }) => {
	try {
		const existingPatient = await db
			.select()
			.from(patient)
			.where(eq(patient.userId, session.user.id))
			.limit(1);
		if (existingPatient.length === 0) {
			return NextResponse.json(
				{ error: "Patient not found." },
				{ status: 404 },
			);
		}

		const sleeps = await db
			.select()
			.from(sleep)
			.where(eq(sleep.patientId, existingPatient[0].id))
			.orderBy(desc(sleep.date))
			.limit(7);
		return NextResponse.json({ sleeps });
	} catch (error) {
		console.error("Error fetching moods:", error);
		return NextResponse.json(
			{ error: "An error occurred while fetching moods." },
			{ status: 500 },
		);
	}
});
