import { verifySignatureAppRouter } from "@upstash/qstash/dist/nextjs";
import {
	addMinutes,
	addMonths,
	eachDayOfInterval,
	endOfMonth,
	formatISO,
	getDay,
	isBefore,
	set,
	startOfDay,
	startOfMonth,
} from "date-fns";
import { and, eq, gte, lte } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import z from "zod";
import { db } from "@/lib/db";
import {
	availability_slot,
	schedule,
	schedule_day,
} from "@/lib/db/schema/therapist";

// Body validation
const bodySchema = z.object({
	therapistId: z.string().uuid(),
});

// Utility: next month range using date-fns
function getNextMonthRange() {
	const now = new Date();
	const firstNext = startOfMonth(addMonths(now, 1));
	const start = startOfDay(firstNext);
	const end = endOfMonth(firstNext); // local timezone end
	return { start, end };
}

function parseTime(t: string) {
	// Accept formats HH:MM or HH:MM:SS
	const [hh, mm, ss] = t.split(":");
	return { h: Number(hh), m: Number(mm), s: Number(ss || 0) };
}

function formatTime(h: number, m: number, s = 0) {
	return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export const POST = verifySignatureAppRouter(async (req: NextRequest) => {
	try {
		const json = await req.json();
		const { therapistId } = bodySchema.parse(json);

		// Load schedule base data
		const scheduleRows = await db
			.select({
				id: schedule.id,
				appointmentDuration: schedule.appointmentDuration,
				maxAppointmentPerDay: schedule.maxAppointmentPerDay,
			})
			.from(schedule)
			.where(eq(schedule.therapistId, therapistId))
			.limit(1);

		if (scheduleRows.length === 0) {
			return NextResponse.json(
				{ error: "Therapist schedule not found" },
				{ status: 404 },
			);
		}

		const sch = scheduleRows[0];

		// Load schedule days
		const days = await db
			.select({
				day: schedule_day.day, // 0..6 (as per route for schedule days)
				startHour: schedule_day.startHour,
				endHour: schedule_day.endHour,
			})
			.from(schedule_day)
			.where(eq(schedule_day.scheduleId, sch.id));

		if (days.length === 0) {
			return NextResponse.json(
				{ error: "No schedule days configured" },
				{ status: 400 },
			);
		}

		const { start, end } = getNextMonthRange();

		// Fetch taken slots we must preserve (date normalized to midnight in our model)
		const takenSlots = await db
			.select({ date: availability_slot.date, hour: availability_slot.hour })
			.from(availability_slot)
			.where(
				and(
					eq(availability_slot.therapistId, therapistId),
					gte(availability_slot.date, start),
					lte(availability_slot.date, end),
					eq(availability_slot.state, "TAKEN"),
				),
			);

		// Build lookup sets/maps for taken slots
		const takenKeySet = new Set<string>();
		const takenCountPerDay = new Map<string, number>();
		for (const ts of takenSlots) {
			const dayKey = ts.date.toISOString().slice(0, 10); // YYYY-MM-DD
			const key = `${dayKey}|${String(ts.hour)}`;
			takenKeySet.add(key);
			takenCountPerDay.set(dayKey, (takenCountPerDay.get(dayKey) ?? 0) + 1);
		}

		// Remove ONLY AVAILABLE slots (we will regenerate them); preserve TAKEN
		await db
			.delete(availability_slot)
			.where(
				and(
					eq(availability_slot.therapistId, therapistId),
					gte(availability_slot.date, start),
					lte(availability_slot.date, end),
					eq(availability_slot.state, "AVAILABLE"),
				),
			);

		// Prepare a lookup map for schedule days
		const dayMap = new Map<number, { startHour: string; endHour: string }>();
		for (const d of days) {
			dayMap.set(d.day as number, {
				startHour: String(d.startHour),
				endHour: String(d.endHour),
			});
		}

		const slotsToInsert: Array<{
			therapistId: string;
			date: Date;
			hour: string;
		}> = [];

		// Iterate every day of next month
		let _createdCount = 0;
		for (const dt of eachDayOfInterval({ start, end })) {
			const weekday = getDay(dt); // 0=Sunday .. 6=Saturday
			const scheduleForDay = dayMap.get(weekday);
			if (!scheduleForDay) continue; // Therapist does not work this day

			const { startHour, endHour } = scheduleForDay;
			const startParsed = parseTime(startHour as string);
			const endParsed = parseTime(endHour as string);

			// Build list of time slots stepping by appointmentDuration minutes
			let cursor = set(dt, {
				hours: startParsed.h,
				minutes: startParsed.m,
				seconds: startParsed.s,
				milliseconds: 0,
			});
			const endTime = set(dt, {
				hours: endParsed.h,
				minutes: endParsed.m,
				seconds: endParsed.s,
				milliseconds: 0,
			});

			const daySlots: string[] = [];
			while (isBefore(cursor, endTime)) {
				daySlots.push(
					formatTime(
						cursor.getHours(),
						cursor.getMinutes(),
						cursor.getSeconds(),
					),
				);
				cursor = addMinutes(cursor, sch.appointmentDuration);
			}

			// Remaining capacity after already taken slots
			const dayKey = formatISO(startOfDay(dt), { representation: "date" });
			const takenForDay = takenCountPerDay.get(dayKey) ?? 0;
			const remainingCapacity = Math.max(
				(sch.maxAppointmentPerDay ?? daySlots.length) - takenForDay,
				0,
			);
			if (remainingCapacity === 0) continue;

			// Filter out slots already taken
			const candidate = daySlots.filter(
				(h) => !takenKeySet.has(`${dayKey}|${h}`),
			);
			const limited = candidate.slice(0, remainingCapacity);
			for (const hour of limited) {
				slotsToInsert.push({
					therapistId,
					date: startOfDay(dt),
					hour,
				});
				_createdCount++;
			}
		}

		// Chunk inserts to avoid parameter limits (simple approach: 500 per batch)
		const chunkSize = 500;
		for (let i = 0; i < slotsToInsert.length; i += chunkSize) {
			const chunk = slotsToInsert.slice(i, i + chunkSize);
			if (chunk.length > 0) {
				await db.insert(availability_slot).values(chunk);
			}
		}

		return NextResponse.json({
			message: "Availability regenerated",
		});
	} catch (error) {
		console.error("Error regenerating availability", error);
		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: error.issues }, { status: 400 });
		}
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
});
