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
import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
	availability_slot,
	schedule,
	schedule_day,
	therapist,
} from "@/lib/db/schema/therapist";

// Util: compute first and last day of next month with date-fns (clearer & TZ-safe relative logic)
function getNextMonthRange() {
	const now = new Date();
	const firstNextMonth = startOfMonth(addMonths(now, 1));
	const start = startOfDay(firstNextMonth);
	const end = endOfMonth(firstNextMonth); // already set to last day 23:59:59.999 local
	return { start, end };
}

function parseTime(t: string) {
	const [hh, mm, ss] = t.split(":");
	return { h: Number(hh), m: Number(mm), s: Number(ss || 0) };
}

function formatTime(h: number, m: number, s = 0) {
	return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Core generation for a batch of schedules
async function generateForSchedules(
	schedules: Array<{
		id: string;
		therapistId: string;
		appointmentDuration: number;
		maxAppointmentPerDay: number;
	}>,
) {
	if (schedules.length === 0) return { created: 0, preservedTaken: 0 };

	const { start, end } = getNextMonthRange();

	// Preload all schedule days for these schedules
	const scheduleIds = schedules.map((s) => s.id);
	const days = await db
		.select({
			scheduleId: schedule_day.scheduleId,
			day: schedule_day.day,
			startHour: schedule_day.startHour,
			endHour: schedule_day.endHour,
		})
		.from(schedule_day)
		.where(inArray(schedule_day.scheduleId, scheduleIds));

	// Group days by scheduleId
	const daysMap = new Map<
		string,
		Array<{
			day: number | null;
			startHour: unknown; // time type from drizzle
			endHour: unknown;
		}>
	>();
	for (const d of days) {
		let arr = daysMap.get(d.scheduleId);
		if (!arr) {
			arr = [];
			daysMap.set(d.scheduleId, arr);
		}
		arr.push({
			day: d.day as number | null,
			startHour: d.startHour,
			endHour: d.endHour,
		});
	}

	// Preload TAKEN slots for all therapists in range
	const therapistIds = schedules.map((s) => s.therapistId);
	const taken = await db
		.select({
			therapistId: availability_slot.therapistId,
			date: availability_slot.date,
			hour: availability_slot.hour,
		})
		.from(availability_slot)
		.where(
			and(
				inArray(availability_slot.therapistId, therapistIds),
				gte(availability_slot.date, start),
				lte(availability_slot.date, end),
				eq(availability_slot.state, "TAKEN"),
			),
		);

	// Index taken slots
	const takenKeySet = new Set<string>();
	const takenCountPerDay = new Map<string, number>(); // key: therapistId|YYYY-MM-DD
	for (const t of taken) {
		const dateKey = t.date.toISOString().slice(0, 10);
		const therapistDayKey = `${t.therapistId}|${dateKey}`;
		const slotKey = `${t.therapistId}|${dateKey}|${String(t.hour)}`;
		takenKeySet.add(slotKey);
		takenCountPerDay.set(
			therapistDayKey,
			(takenCountPerDay.get(therapistDayKey) ?? 0) + 1,
		);
	}

	// Delete ONLY AVAILABLE slots in range for these therapists
	await db
		.delete(availability_slot)
		.where(
			and(
				inArray(availability_slot.therapistId, therapistIds),
				gte(availability_slot.date, start),
				lte(availability_slot.date, end),
				eq(availability_slot.state, "AVAILABLE"),
			),
		);

	const toInsert: Array<{
		therapistId: string;
		date: Date;
		hour: string;
	}> = [];

	let created = 0;

	for (const s of schedules) {
		const sDays = daysMap.get(s.id) ?? [];
		if (sDays.length === 0) continue; // No schedule days configured

		// Make a quick lookup by weekday
		const weekdayMap = new Map<
			number,
			{ startHour: string; endHour: string }
		>();
		for (const d of sDays) {
			weekdayMap.set(d.day as number, {
				startHour: String(d.startHour),
				endHour: String(d.endHour),
			});
		}

		for (const dt of eachDayOfInterval({ start, end })) {
			const w = getDay(dt);
			const cfg = weekdayMap.get(w);
			if (!cfg) continue;

			const { startHour, endHour } = cfg;
			const sp = parseTime(startHour);
			const ep = parseTime(endHour);
			let cursor = set(dt, {
				hours: sp.h,
				minutes: sp.m,
				seconds: sp.s,
				milliseconds: 0,
			});
			const endTime = set(dt, {
				hours: ep.h,
				minutes: ep.m,
				seconds: ep.s,
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
				cursor = addMinutes(cursor, s.appointmentDuration);
			}

			const dateMidnight = startOfDay(dt);
			const dayKey = formatISO(dateMidnight, { representation: "date" });
			const therapistDayKey = `${s.therapistId}|${dayKey}`;
			const takenForDay = takenCountPerDay.get(therapistDayKey) ?? 0;
			const remainingCapacity = Math.max(
				(s.maxAppointmentPerDay ?? daySlots.length) - takenForDay,
				0,
			);
			if (remainingCapacity === 0) continue;

			const candidate = daySlots.filter(
				(h) => !takenKeySet.has(`${s.therapistId}|${dayKey}|${h}`),
			);
			const limited = candidate.slice(0, remainingCapacity);
			for (const hour of limited) {
				toInsert.push({ therapistId: s.therapistId, date: dateMidnight, hour });
				created++;
			}
		}
	}

	// Bulk insert in chunks
	const chunkSize = 1000;
	for (let i = 0; i < toInsert.length; i += chunkSize) {
		const chunk = toInsert.slice(i, i + chunkSize);
		if (chunk.length) await db.insert(availability_slot).values(chunk);
	}

	return { created, preservedTaken: taken.length };
}

export const POST = verifySignatureAppRouter(async () => {
	try {
		// Fetch all therapists that have a schedule (join ensures schedule exists)
		const schedules = await db
			.select({
				id: schedule.id,
				therapistId: schedule.therapistId,
				appointmentDuration: schedule.appointmentDuration,
				maxAppointmentPerDay: schedule.maxAppointmentPerDay,
			})
			.from(schedule)
			.innerJoin(therapist, eq(schedule.therapistId, therapist.id));

		const { created, preservedTaken } = await generateForSchedules(schedules);

		return NextResponse.json({
			message: "Bulk availability generation completed",
			therapistsProcessed: schedules.length,
			created,
			preservedTaken,
		});
	} catch (error) {
		console.error("Error in bulk availability generation", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
});
