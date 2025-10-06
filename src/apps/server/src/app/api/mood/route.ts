import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/auth/with-auth";
import { db } from "@/lib/db";
import { mood, patient } from "@/lib/db/schema/patient";

const moodSchema = z.object({
	patientId: z.uuid(),
	level: z.enum(["VERY_BAD", "BAD", "NEUTRAL", "GOOD", "VERY_GOOD"]),
	reasons: z.array(z.string()).optional(),
	date: z.string().optional(), // ISO date string
});

export const POST = withAuth(
	async ({ body }) => {
		try {
			await db.insert(mood).values({
				patientId: body.patientId,
				level: body.level,
				reasons: body.reasons,
				date: body.date ? new Date(body.date) : new Date(),
			});
			return NextResponse.json({ success: true });
		} catch (error) {
			console.error("Error saving mood:", error);
			return NextResponse.json(
				{ error: "An error occurred while saving mood." },
				{ status: 500 },
			);
		}
	},
	{ bodySchema: moodSchema },
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

		const moods = await db
			.select()
			.from(mood)
			.where(eq(mood.patientId, existingPatient[0].id))
			.orderBy(desc(mood.date))
			.limit(7);
		return NextResponse.json({ moods });
	} catch (error) {
		console.error("Error fetching moods:", error);
		return NextResponse.json(
			{ error: "An error occurred while fetching moods." },
			{ status: 500 },
		);
	}
});
