import { addDays, addHours } from "date-fns";
import { NextResponse } from "next/server";
import z from "zod";
import { withAuth } from "@/lib/auth/with-auth";
import { db } from "@/lib/db";
import { medication, medication_reminder } from "@/lib/db/schema/patient";

export const POST = withAuth(
	async ({ body }) => {
		const med = await db
			.insert(medication)
			.values({
				patientId: body.patientId,
				name: body.name,
				dosage: body.dosage,
				frequency: body.frequency,
				startDate: new Date(body.startDate),
				endDate: body.endDate ? new Date(body.endDate) : null,
				notes: body.notes || null,
			})
			.returning();

		await scheduleFirstDoseReminder(body.frequency, med[0].id, body.patientId);

		return NextResponse.json({ message: "Hello from medication route" });
	},
	{
		bodySchema: z.object({
			patientId: z.uuid(),
			name: z.string().min(1),
			dosage: z.string().min(1),
			frequency: z.string().min(1),
			startDate: z.string().refine((date) => !Number.isNaN(Date.parse(date)), {
				message: "Invalid date format",
			}),
			endDate: z
				.string()
				.refine((date) => !Number.isNaN(Date.parse(date)), {
					message: "Invalid date format",
				})
				.optional(),
			notes: z.string().optional(),
		}),
	},
	(_error) =>
		NextResponse.json({ message: "Invalid request" }, { status: 400 }),
);

async function scheduleFirstDoseReminder(
	frequency: string,
	medicationId: string,
	patientId: string,
) {
	let firstDoseDate = new Date();
	const [_, amount, unit] = frequency.split(" "); // each 8 hours
	if (unit.startsWith("hours")) {
		firstDoseDate = addHours(firstDoseDate, Number.parseInt(amount, 10));
	} else if (unit.startsWith("days")) {
		firstDoseDate = addDays(firstDoseDate, Number.parseInt(amount, 10));
	} else {
		throw new Error("Unsupported frequency unit");
	}

	await db.insert(medication_reminder).values({
		medicationId: medicationId,
		patientId: patientId,
		scheduledTime: firstDoseDate,
	});
}
