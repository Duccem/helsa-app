import { Client } from "@upstash/qstash";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import z from "zod";
import { withAuth } from "@/lib/auth/with-auth";
import { db } from "@/lib/db";
import { schedule, schedule_day, therapist } from "@/lib/db/schema/therapist";
import { AppError } from "@/lib/error";

const qstash = new Client({ token: process.env.QSTASH_TOKEN ?? "" });

// Params: schedule id (uuid v7)
const paramsSchema = z.object({ id: z.uuidv7() });

// Body: array of days to replace (or append in future enhancement if needed)
const bodySchema = z.object({
	days: z
		.array(
			z
				.object({
					day: z.number().int().min(0).max(6), // 0..6 (Sunday..Saturday) adjust if you prefer 1..7
					startHour: z
						.string()
						.regex(
							/^\d{2}:\d{2}(:\d{2})?$/,
							"Invalid time format (HH:MM or HH:MM:SS)",
						),
					endHour: z
						.string()
						.regex(
							/^\d{2}:\d{2}(:\d{2})?$/,
							"Invalid time format (HH:MM or HH:MM:SS)",
						),
				})
				.refine((v) => v.startHour < v.endHour, {
					message: "startHour must be earlier than endHour",
					path: ["endHour"],
				}),
		)
		.min(1)
		.max(7),
});

// Helper: ensure the schedule belongs to the authenticated therapist
async function validateOwnership(scheduleId: string, userId: string) {
	const rows = await db
		.select({ scheduleId: schedule.id })
		.from(schedule)
		.innerJoin(therapist, eq(schedule.therapistId, therapist.id))
		.where(and(eq(schedule.id, scheduleId), eq(therapist.userId, userId)))
		.limit(1);
	return rows.length > 0;
}

async function getTherapistId(scheduleId: string) {
	const rows = await db
		.select({ therapistId: schedule.therapistId })
		.from(schedule)
		.where(eq(schedule.id, scheduleId))
		.limit(1);
	if (rows.length === 0) throw new Error("Schedule not found");
	return rows[0].therapistId;
}

export const POST = withAuth(
	async ({ session, params: { id }, body }) => {
		const owns = await validateOwnership(id, session.user.id);
		if (!owns) {
			throw new AppError(
				"Schedule not found or not owned by user",
				"NOT_FOUND",
			);
		}

		await db.delete(schedule_day).where(eq(schedule_day.scheduleId, id));

		type DayInput = z.infer<typeof bodySchema>["days"][number];
		const values = (body.days as DayInput[]).map((d) => ({
			scheduleId: id,
			day: d.day,
			startHour: d.startHour as unknown as string,
			endHour: d.endHour as unknown as string,
		}));

		if (values.length > 0) {
			await db.insert(schedule_day).values(values);
		}

		const therapistId = await getTherapistId(id);

		await qstash.publishJSON({
			url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/schedule/availability`,
			body: { therapistId },
			delay: "5s",
		});

		return NextResponse.json({
			message: "Schedule days saved",
		});
	},
	{ paramsSchema, bodySchema },
	(error: AppError) => {
		switch (error.code) {
			case "NOT_FOUND":
				return NextResponse.json(
					{ error: "Schedule not found or not owned by user" },
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
