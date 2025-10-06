import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import z from "zod";
import { withAuth } from "@/lib/auth/with-auth";
import { db } from "@/lib/db";
import { schedule, therapist } from "@/lib/db/schema/therapist";
import { AppError } from "@/lib/error";

// Esquema para crear / actualizar el schedule del terapeuta
const scheduleSchema = z.object({
	appointmentDuration: z.number().int().min(5).max(240).optional(),
	maxAppointmentPerDay: z.number().int().min(1).max(50).optional(),
});

async function getTherapistId(userId: string) {
	const rows = await db
		.select({ id: therapist.id })
		.from(therapist)
		.where(eq(therapist.userId, userId))
		.limit(1);
	return rows[0]?.id;
}

// Crear o modificar (idempotente) el schedule del terapeuta autenticado
export const PUT = withAuth(
	async ({ session, body }) => {
		const therapistId = await getTherapistId(session.user.id);
		if (!therapistId) {
			throw new AppError("Therapist profile not found", "THERAPIST_NOT_FOUND");
		}

		// Defaults si no vienen en body (mantener valores existentes si ya hay registro)
		// Para simplificar, si falta un campo y existe registro previo lo dejamos igual.
		const existing = await db
			.select({
				id: schedule.id,
				appointmentDuration: schedule.appointmentDuration,
				maxAppointmentPerDay: schedule.maxAppointmentPerDay,
			})
			.from(schedule)
			.where(eq(schedule.therapistId, therapistId))
			.limit(1);

		const newAppointmentDuration =
			body.appointmentDuration ?? existing[0]?.appointmentDuration ?? 30;
		const newMaxPerDay =
			body.maxAppointmentPerDay ?? existing[0]?.maxAppointmentPerDay ?? 5;

		await db
			.insert(schedule)
			.values({
				therapistId,
				appointmentDuration: newAppointmentDuration,
				maxAppointmentPerDay: newMaxPerDay,
			})
			.onConflictDoUpdate({
				target: schedule.therapistId,
				set: {
					appointmentDuration: newAppointmentDuration,
					maxAppointmentPerDay: newMaxPerDay,
					updatedAt: new Date(),
				},
			});

		return NextResponse.json({
			message: "Schedule guardado correctamente",
		});
	},
	{ bodySchema: scheduleSchema },
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

// Obtener el schedule del terapeuta autenticado
export const GET = withAuth(
	async ({ session }) => {
		const therapistId = await getTherapistId(session.user.id);
		if (!therapistId) {
			throw new AppError("Therapist profile not found", "THERAPIST_NOT_FOUND");
		}

		const existing = await db.query.schedule.findFirst({
			where: eq(schedule.therapistId, therapistId),
			with: {
				days: true,
			},
		});

		if (!existing) {
			return NextResponse.json({ schedule: null }, { status: 200 });
		}

		return NextResponse.json({ schedule: existing }, { status: 200 });
	},
	{},
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
