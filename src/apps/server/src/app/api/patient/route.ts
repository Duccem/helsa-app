import { NextResponse } from "next/server";
import z from "zod";
import { withAuth } from "@/lib/auth/with-auth";
import { db } from "@/lib/db";
import { patient } from "@/lib/db/schema/patient";
import { qstashClient } from "@/lib/qstash";

const createPatientSchema = z.object({
	birthDate: z.string().refine((date) => !Number.isNaN(Date.parse(date)), {
		message: "Invalid date format",
	}),
	gender: z.enum(["MAN", "WOMAN", "OTHER"]).optional(),
});

export const PUT = withAuth(
	async ({ body, session }) => {
		try {
			const inserted = await db
				.insert(patient)
				.values({
					birthDate: new Date(body.birthDate),
					gender: body.gender,
					userId: session.user.id,
				})
				.onConflictDoUpdate({
					target: patient.userId,
					set: {
						birthDate: new Date(body.birthDate),
						gender: body.gender,
						updatedAt: new Date(),
					},
				})
				.returning();
			const patientId = inserted[0].id;

			await scheduleConfiguration(patientId);
			return NextResponse.json({ message: "Patient Saved correctly" });
		} catch (_error) {
			return NextResponse.json(
				{ error: "Invalid request data" },
				{ status: 400 },
			);
		}
	},
	{ bodySchema: createPatientSchema },
);

async function scheduleConfiguration(patientId: string) {
	await qstashClient.schedules.create({
		destination: `${process.env.NEXT_PUBLIC_BASE_URL}/api/activity/generate`,
		scheduleId: `generate-activities-${patientId}`,
		cron: "0 0 * * *", // Every day at midnight
		body: JSON.stringify({ patientId: patientId }),
	});
}
