import { verifySignatureAppRouter } from "@upstash/qstash/dist/nextjs";
import { addDays, addHours, subHours } from "date-fns";
import { and, eq, inArray, lt } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { medication, medication_reminder } from "@/lib/db/schema/patient";

// This route is intended to be invoked periodically (e.g. via QStash cron)
// Responsibilities:
// 1. Select all reminders where isTaken = false, forgotten = false and scheduledTime < (now - 2 hours)
// 2. Mark them as forgotten
// 3. For each, schedule a new reminder according to the medication frequency string (e.g. "each 8 hours", "each 2 days")

export const POST = verifySignatureAppRouter(async (_req: NextRequest) => {
	const twoHoursAgo = subHours(new Date(), 2);

	// Fetch overdue reminders
	const overdueReminders = await db
		.select({
			id: medication_reminder.id,
			medicationId: medication_reminder.medicationId,
			patientId: medication_reminder.patientId,
			scheduledTime: medication_reminder.scheduledTime,
		})
		.from(medication_reminder)
		.where(
			and(
				eq(medication_reminder.isTaken, false),
				eq(medication_reminder.forgotten, false),
				lt(medication_reminder.scheduledTime, twoHoursAgo),
			),
		);

	if (overdueReminders.length === 0) {
		return NextResponse.json({ message: "No reminders to reschedule" });
	}

	// Get distinct medicationIds to read their frequencies in a single query
	const medicationIds = Array.from(
		new Set(overdueReminders.map((r) => r.medicationId)),
	);
	const meds = await db
		.select({ id: medication.id, frequency: medication.frequency })
		.from(medication)
		.where(inArray(medication.id, medicationIds));

	const frequencyMap = new Map<string, string>();
	for (const m of meds) {
		frequencyMap.set(m.id, m.frequency);
	}

	// Mark reminders as forgotten
	await Promise.all(
		overdueReminders.map((r) =>
			db
				.update(medication_reminder)
				.set({ forgotten: true })
				.where(eq(medication_reminder.id, r.id)),
		),
	);

	// Prepare new reminders
	const newReminders: Array<{
		medicationId: string;
		patientId: string;
		scheduledTime: Date;
	}> = [];

	for (const reminder of overdueReminders) {
		const freq = frequencyMap.get(reminder.medicationId);
		if (!freq) continue;
		try {
			const nextTime = computeNextDoseTime(freq, reminder.scheduledTime);
			newReminders.push({
				medicationId: reminder.medicationId,
				patientId: reminder.patientId,
				scheduledTime: nextTime,
			});
		} catch (_e) {}
	}

	if (newReminders.length > 0) {
		await db.insert(medication_reminder).values(newReminders);
	}

	return NextResponse.json({
		message: "Rescheduled medication reminders",
		processed: overdueReminders.length,
		created: newReminders.length,
	});
});

function computeNextDoseTime(frequency: string, from: Date): Date {
	// Expected pattern: "each <amount> <unit>" where unit can be "hours", "days", "hour", "day"
	const parts = frequency.trim().split(/\s+/); // e.g. ["each", "8", "hours"]
	if (parts.length < 3 || parts[0] !== "each") {
		throw new Error("Unsupported frequency pattern");
	}
	const amount = Number.parseInt(parts[1], 10);
	if (Number.isNaN(amount) || amount <= 0) {
		throw new Error("Invalid frequency amount");
	}
	const unit = parts[2].toLowerCase();
	if (unit.startsWith("hour")) {
		return addHours(from, amount);
	}
	if (unit.startsWith("day")) {
		return addDays(from, amount);
	}
	throw new Error("Unsupported frequency unit");
}
